/**
 * src/audio/engine.js — singleton bootstrap for the audio system.
 *
 * Tone.js v15 is loaded as a global in index.html before this module
 * is imported. We read it off `window.Tone` at call time rather than
 * importing, so this file fits the bundler-free build.
 *
 * Audio routing:
 *   ToneBufferSource → ratGen's per-rat chain (LPF, gain, panner,
 *   reverb send) → ratGain (master) → Destination
 *
 * Each RatGenerator owns its own perRatGain (the recency-ladder
 * volume slot). The master ratGain sits at RAT_FOREGROUND_GAIN as
 * the absolute foreground level. Cumulative voicing is implemented
 * by walking the registry on every register/unregister and ramping
 * each rat's perRatGain to its recency-rank multiplier.
 *
 * Visit tracking (which review venues have been opened, used to
 * unlock the alley) is small enough to live alongside the audio
 * machinery.
 */

import { USVS, USVS_COCAINE } from './manifest.js';
import { preloadBeds, startBedsPlayback } from './beds.js';
import { loadBufferWithRetry } from './load-buffer.js';
import { rampParam } from './ramp.js';
import { KEYS, readFlag, writeFlag } from '../storage.js';
import { rats } from '../content/rats.js';
import { venues } from '../content/venues.js';
import { applyToTone as applyMasterControls } from './master-controls.js';
import { KEYWORD_EFFECTS } from './keyword-effects.js';

// Master foreground level for the most-recent rat. Tune by ear.
const RAT_FOREGROUND_GAIN = 0.25;

// Spatial recency ladder. Three parallel curves, applied per rank:
//   - gain: how loud each rat is at its rank
//   - lowpass cutoff (Hz): air-absorption mimic; older rats lose treble
//   - reverb send (0..1): older rats are heard mostly through reflections
// Index 0 = foreground, index N = N steps back. One entry per voice
// slot, so the ladders' length is the voice cap.
const RAT_GAIN_LADDER = [1.0, 0.3, 0.12, 0.05, 0.02];
const RAT_LPF_LADDER = [20000, 5000, 2500, 1200, 600];
const RAT_REVERB_SEND_LADDER = [0.0, 0.15, 0.3, 0.45, 0.55];

// Maximum simultaneous rats (5). The next one evicts the oldest.
const RAT_CAP = RAT_GAIN_LADDER.length;

// Fadeout used for natural completion and cap eviction. Same value
// for both — natural completion's fade is silent (audio is over),
// but the timing keeps cleanup symmetric.
const RAT_FADE_OUT_SEC = 1.0;

// Ramp time when recency rank changes (a new rat opens, a rat ends).
// Smooth enough to avoid clicks, fast enough to feel responsive.
const RAT_LADDER_RAMP_SEC = 0.4;

// Review venues count toward unlocking gated pins (the alley).
const REVIEW_VENUE_IDS = Object.values(venues)
  .filter((v) => v.kind === 'review')
  .map((v) => v.id);

const BANK_DIRS = {
  usvs: 'assets/sounds/usvs',
  'usvs-cocaine': 'assets/sounds/usvs-cocaine',
};

// The files in each USV bank (manifest.js); RatGenerator reads the
// same table to rebuild its full syllable pools.
export const BANK_FILES = {
  usvs: USVS,
  'usvs-cocaine': USVS_COCAINE,
};

const banks = {
  usvs: [],
  'usvs-cocaine': [],
};

// Every sample the keyword table can fire, so a new entry there loads
// without another list to update.
const EFFECT_NAMES = [
  ...new Set(
    Object.values(KEYWORD_EFFECTS).flatMap((spec) => [spec.effect, ...(spec.layered ?? [])])
  ),
];
const effectBuffers = new Map();

let ready = false;
let preloadPromise = null;
let startPromise = null;
let ratGain = null;
let sharedRatReverb = null;
// The reverb's impulse response renders once; a failed render is
// forgotten so a preload retry can try again.
let reverbPromise = null;
const readyListeners = [];

// Map<reviewerId, RatGenerator> — insertion order is recency.
// First entry = oldest active rat, last entry = foreground.
const ratRegistry = new Map();

// Listeners notified after every register/unregister so UI surfaces
// (currently the alley modal's mini-cards) can reflect rank changes.
const activeRatsListeners = new Set();

// Exported so RatGenerator can tier a sample whose file failed to
// load from its analyzed duration (usv-features.js dur) — V74.
export function tierForDuration(d) {
  if (d < 0.4) return 'short';
  if (d < 0.9) return 'medium';
  if (d < 2.0) return 'long';
  return 'extra-long';
}

// V74: a file that fails (after one retry) is dropped from the bank
// rather than failing the load. Survivors keep manifest order, which
// the syllable pools depend on (see rat-generator getSyllablePools).
async function loadBank(name) {
  const dir = BANK_DIRS[name];
  const files = BANK_FILES[name];
  const promises = files.map(async (filename) => {
    const buffer = await loadBufferWithRetry(`${dir}/${filename}`);
    if (!buffer) return null;
    return {
      filename,
      buffer,
      duration: buffer.duration,
      tier: tierForDuration(buffer.duration),
    };
  });
  return (await Promise.all(promises)).filter(Boolean);
}

async function loadBanks() {
  const [u, c] = await Promise.all([loadBank('usvs'), loadBank('usvs-cocaine')]);
  // An empty bank means the network is gone, not one bad file — that
  // is a real failure, so let preload reject (and become retryable).
  if (u.length === 0 || c.length === 0) {
    throw new Error('USV bank empty: no samples loaded');
  }
  banks.usvs = u;
  banks['usvs-cocaine'] = c;
}

// Warms the browser cache for every selfie + venue photo, so a modal
// or pin hover resolves its <img> from cache. Started once the audio
// has loaded rather than awaited with it: the images aren't needed
// to play anything, and ~4 MB of them would hold up "the rats are
// ready". Errors resolve (don't reject); the modal/tooltip's own
// onerror handlers hide broken images.
function preloadImages() {
  const selfiePaths = Object.values(rats)
    .map((r) => r.selfiePath)
    .filter(Boolean);
  const photoPaths = Object.values(venues)
    .map((v) => v.photoPath)
    .filter(Boolean);
  const all = [...selfiePaths, ...photoPaths];
  return Promise.all(
    all.map(
      (path) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = path;
        })
    )
  );
}

async function loadEffectBuffers() {
  // V74: a missing effect just doesn't fire — RatGenerator already
  // treats a null getEffectBuffer() as "skip".
  const tasks = EFFECT_NAMES.map(async (name) => {
    if (effectBuffers.has(name)) return;
    const buf = await loadBufferWithRetry(`assets/sounds/effects/${name}.webm`);
    if (buf) effectBuffers.set(name, buf);
  });
  await Promise.all(tasks);
}

// Pre-gesture: build the node graph and load all buffers. Runs while
// the loading screen is on-screen, so audio is already decoded when
// the user clicks Enter. No AudioContext resume happens here — the
// context stays suspended; nodes and decoded buffers hold fine in that
// state. Idempotent: subsequent calls return the same promise.
//
// V74: a rejected preload is forgotten so the next call (Enter, or
// the next gesture after a failed start) retries — up to
// PRELOAD_MAX_ATTEMPTS in total, then the rejection sticks. Node
// creation is guarded so a retry never duplicates the graph.
const PRELOAD_MAX_ATTEMPTS = 2;
let preloadAttempts = 0;

export function preload() {
  if (preloadPromise) return preloadPromise;
  preloadAttempts += 1;
  const attempt = (async () => {
    const Tone = window.Tone;
    if (!ratGain) {
      ratGain = new Tone.Gain(RAT_FOREGROUND_GAIN).toDestination();
      sharedRatReverb = new Tone.Reverb({
        decay: 5,
        preDelay: 0.03,
        wet: 1.0,
      }).connect(ratGain);
    }
    reverbPromise ??= sharedRatReverb.generate().catch((e) => {
      reverbPromise = null;
      throw e;
    });
    await Promise.all([
      reverbPromise,
      loadBanks(),
      preloadBeds(),
      loadEffectBuffers(),
    ]);
    preloadImages();
  })();
  preloadPromise = attempt;
  attempt.catch(() => {
    if (preloadPromise === attempt && preloadAttempts < PRELOAD_MAX_ATTEMPTS) {
      preloadPromise = null;
    }
  });
  return attempt;
}

// Gesture-bound: must be called from inside a user-gesture handler so
// AudioContext.resume() (via Tone.start) is permitted. Captures
// Tone.start() synchronously to keep the gesture chain intact, then
// awaits preload + applies master state + starts ambient beds.
export function start() {
  if (startPromise) return startPromise;
  const Tone = window.Tone;
  // Synchronous capture: Tone.start() must be invoked inside the
  // gesture handler. The promise it returns can be awaited later;
  // the resume request itself is what needs the gesture.
  const tonePromise = Tone.start();
  const attempt = (async () => {
    await tonePromise;
    await preload();
    // Apply persisted master volume / mute before any audio starts.
    applyMasterControls();
    startBedsPlayback();
    ready = true;
    while (readyListeners.length) {
      const fn = readyListeners.shift();
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    }
  })();
  startPromise = attempt;
  // V74: forget a failed start so the next gesture can retry it
  // (preload() decides whether another load attempt is allowed).
  attempt.catch(() => {
    if (startPromise === attempt) startPromise = null;
  });
  return attempt;
}

// V74: true when a failed preload has been forgotten and another
// attempt is still allowed — main.js uses it to decide whether to
// re-arm a retry on the next gesture.
export function canRetryStart() {
  return !ready && preloadPromise === null && preloadAttempts > 0;
}

export function isReady() {
  return ready;
}

export function onReady(fn) {
  if (ready) fn();
  else readyListeners.push(fn);
}

export function getBank(name) {
  return banks[name] || [];
}

export function getRatGain() {
  return ratGain;
}

export function getSharedRatReverb() {
  return sharedRatReverb;
}

export function getEffectBuffer(name) {
  return effectBuffers.get(name) || null;
}

// ---- cumulative voicing registry ----

function applyRankToRat(ratGen, rank) {
  if (!ratGen.perRatGain || !ratGen.perRatLPF || !ratGen.perRatReverbSend) return;
  // rank < RAT_CAP: the registry never holds more rats than ladder rungs.
  rampParam(ratGen.perRatGain.gain, RAT_GAIN_LADDER[rank], RAT_LADDER_RAMP_SEC);
  rampParam(ratGen.perRatLPF.frequency, RAT_LPF_LADDER[rank], RAT_LADDER_RAMP_SEC);
  rampParam(ratGen.perRatReverbSend.gain, RAT_REVERB_SEND_LADDER[rank], RAT_LADDER_RAMP_SEC);
}

function recomputeLadder() {
  for (const [reviewerId, rank] of Object.entries(getActiveRatRanks())) {
    applyRankToRat(ratRegistry.get(reviewerId), rank);
  }
}

function notifyActiveRatsListeners() {
  const ranks = getActiveRatRanks();
  for (const fn of activeRatsListeners) {
    try {
      fn(ranks);
    } catch (e) {
      console.error(e);
    }
  }
}

// { reviewerId: rank } for every speaking rat; 0 = most recent.
export function getActiveRatRanks() {
  const ids = Array.from(ratRegistry.keys());
  return Object.fromEntries(ids.map((id, idx) => [id, ids.length - 1 - idx]));
}

export function onActiveRatsChange(fn) {
  activeRatsListeners.add(fn);
}

export function registerRat(reviewerId, ratGen) {
  // Displace any rat with the same id (modal-reopen of an active rat).
  // Immediate stop + dispose; the new instance will play fresh.
  const existing = ratRegistry.get(reviewerId);
  if (existing) {
    ratRegistry.delete(reviewerId);
    existing.dispose();
  }

  // Cap eviction: if we'd exceed RAT_CAP after inserting, fade out
  // the oldest rat and remove it from the registry.
  if (ratRegistry.size >= RAT_CAP) {
    const oldestId = ratRegistry.keys().next().value;
    const oldest = ratRegistry.get(oldestId);
    ratRegistry.delete(oldestId);
    if (oldest) oldest.fadeOutAndDispose(RAT_FADE_OUT_SEC);
  }

  ratRegistry.set(reviewerId, ratGen);
  recomputeLadder();
  notifyActiveRatsListeners();
}

export function unregisterRat(reviewerId) {
  const rg = ratRegistry.get(reviewerId);
  if (!rg) return;
  ratRegistry.delete(reviewerId);
  rg.fadeOutAndDispose(RAT_FADE_OUT_SEC);
  recomputeLadder();
  notifyActiveRatsListeners();
}

// ---- visit tracking ----

export function markVisited(venueId) {
  writeFlag(KEYS.visited(venueId), true);
}

function hasVisited(venueId) {
  return readFlag(KEYS.visited(venueId));
}

export function visitedReviewVenueCount() {
  return REVIEW_VENUE_IDS.filter((id) => hasVisited(id)).length;
}
