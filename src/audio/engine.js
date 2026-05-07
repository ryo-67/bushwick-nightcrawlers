/**
 * src/audio/engine.js — singleton bootstrap for the audio system.
 *
 * Tone.js v15 is loaded as a global in index.html before this module
 * is imported. We read it off `window.Tone` at call time rather than
 * importing, so this file fits the bundler-free build.
 *
 * Audio routing:
 *   ToneBufferSource → ratGen.perRatGain → ratGain (master) → Destination
 *
 * Each RatGenerator owns its own perRatGain (the recency-ladder
 * volume slot). The master ratGain sits at RAT_FOREGROUND_GAIN as
 * the absolute foreground level. Cumulative voicing is implemented
 * by walking the registry on every register/unregister and ramping
 * each rat's perRatGain to its recency-rank multiplier.
 *
 * Visit tracking is small enough to live alongside the audio
 * machinery, since the alley reveal in §12.5c will hook into the
 * same engine module.
 */

import { USVS, USVS_COCAINE } from './manifest.js';
import { initBeds } from './beds.js';
import { reviews } from '../content/reviews.js';
import { applyOnEngineStart as applyMasterControls } from './master-controls.js';

// Master foreground level for the most-recent rat. Tune by ear.
export const RAT_FOREGROUND_GAIN = 0.4;

// Spatial recency ladder. Three parallel curves, applied per rank:
//   - gain: how loud each rat is at its rank
//   - lowpass cutoff (Hz): air-absorption mimic; older rats lose treble
//   - reverb send (0..1): older rats are heard mostly through reflections
// Index 0 = foreground, index N = N steps back. RAT_CAP must equal length.
export const RAT_GAIN_LADDER = [1.0, 0.3, 0.12, 0.05, 0.02];
export const RAT_LPF_LADDER = [20000, 5000, 2500, 1200, 600];
export const RAT_REVERB_SEND_LADDER = [0.0, 0.15, 0.3, 0.45, 0.55];

// Maximum simultaneous rats. The 6th opening evicts the oldest.
export const RAT_CAP = 5;

// Fadeout used for natural completion and cap eviction. Same value
// for both — natural completion's fade is silent (audio is over),
// but the timing keeps cleanup symmetric.
export const RAT_FADE_OUT_SEC = 1.0;

// Ramp time when recency rank changes (a new rat opens, a rat ends).
// Smooth enough to avoid clicks, fast enough to feel responsive.
export const RAT_LADDER_RAMP_SEC = 0.4;

// Review-bearing venue ids, derived from reviews data so this list
// stays in sync with the content layer.
export const REVIEW_VENUE_IDS = Array.from(
  new Set(Object.values(reviews).map((r) => r.venueId))
);

const BANK_DIRS = {
  usvs: 'assets/sounds/usvs',
  'usvs-cocaine': 'assets/sounds/usvs-cocaine',
};

const BANK_FILES = {
  usvs: USVS,
  'usvs-cocaine': USVS_COCAINE,
};

const banks = {
  usvs: [],
  'usvs-cocaine': [],
};

const EFFECT_NAMES = ['chime', 'cough', 'fizz', 'vibrate', 'camera', 'linkedin'];
const effectBuffers = new Map();

let ready = false;
let startPromise = null;
let ratGain = null;
let sharedRatReverb = null;
const readyListeners = [];

// Map<reviewerId, RatGenerator> — insertion order is recency.
// First entry = oldest active rat, last entry = foreground.
const ratRegistry = new Map();

// Listeners notified after every register/unregister so UI surfaces
// (currently the alley modal's mini-cards) can reflect rank changes.
const activeRatsListeners = new Set();

function tierForDuration(d) {
  if (d < 0.4) return 'short';
  if (d < 0.9) return 'medium';
  if (d < 2.0) return 'long';
  return 'extra-long';
}

async function loadBank(name) {
  const dir = BANK_DIRS[name];
  const files = BANK_FILES[name];
  const promises = files.map(async (filename) => {
    const url = `${dir}/${filename}`;
    const buffer = new window.Tone.ToneAudioBuffer();
    await buffer.load(url);
    return {
      filename,
      buffer,
      duration: buffer.duration,
      tier: tierForDuration(buffer.duration),
    };
  });
  return Promise.all(promises);
}

function tierCounts(samples) {
  const counts = { short: 0, medium: 0, long: 0, 'extra-long': 0 };
  for (const s of samples) counts[s.tier] += 1;
  return counts;
}

async function loadBanks() {
  const [u, c] = await Promise.all([loadBank('usvs'), loadBank('usvs-cocaine')]);
  banks.usvs = u;
  banks['usvs-cocaine'] = c;

  const uc = tierCounts(u);
  const cc = tierCounts(c);
  // eslint-disable-next-line no-console
  console.log(
    `Audio banks loaded: ${u.length} general (s=${uc.short} m=${uc.medium} l=${uc.long} x=${uc['extra-long']}), ` +
      `${c.length} cocaine (s=${cc.short} m=${cc.medium} l=${cc.long} x=${cc['extra-long']})`
  );
}

async function loadEffectBuffers() {
  const tasks = EFFECT_NAMES.map(async (name) => {
    const buf = new window.Tone.ToneAudioBuffer();
    await buf.load(`assets/sounds/effects/${name}.wav`);
    effectBuffers.set(name, buf);
  });
  await Promise.all(tasks);
}

export function start() {
  if (startPromise) return startPromise;
  startPromise = (async () => {
    const Tone = window.Tone;
    await Tone.start();
    // Apply persisted master volume / mute before any audio starts.
    applyMasterControls();
    ratGain = new Tone.Gain(RAT_FOREGROUND_GAIN).toDestination();
    sharedRatReverb = new Tone.Reverb({
      decay: 5,
      preDelay: 0.03,
      wet: 1.0,
    }).connect(ratGain);
    await sharedRatReverb.generate();
    await Promise.all([loadBanks(), initBeds(), loadEffectBuffers()]);
    ready = true;
    while (readyListeners.length) {
      const fn = readyListeners.shift();
      try {
        fn();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }
  })();
  return startPromise;
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

function rampParam(param, target, rampSec) {
  const Tone = window.Tone;
  const now = Tone.now();
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(target, now + rampSec);
}

function applyRankToRat(ratGen, rank) {
  if (!ratGen.perRatGain || !ratGen.perRatLPF || !ratGen.perRatReverbSend) return;
  const gainTarget = RAT_GAIN_LADDER[rank] ?? 0;
  const lpfTarget = RAT_LPF_LADDER[rank] ?? RAT_LPF_LADDER[RAT_LPF_LADDER.length - 1];
  const sendTarget = RAT_REVERB_SEND_LADDER[rank] ?? RAT_REVERB_SEND_LADDER[RAT_REVERB_SEND_LADDER.length - 1];
  rampParam(ratGen.perRatGain.gain, gainTarget, RAT_LADDER_RAMP_SEC);
  rampParam(ratGen.perRatLPF.frequency, lpfTarget, RAT_LADDER_RAMP_SEC);
  rampParam(ratGen.perRatReverbSend.gain, sendTarget, RAT_LADDER_RAMP_SEC);
}

function recomputeLadder() {
  const entries = Array.from(ratRegistry.entries());
  const total = entries.length;
  for (let idx = 0; idx < total; idx += 1) {
    const [, ratGen] = entries[idx];
    const rank = total - 1 - idx; // 0 = most recent
    applyRankToRat(ratGen, rank);
  }
}

function notifyActiveRatsListeners() {
  const snapshot = getActiveRatRanks();
  for (const fn of activeRatsListeners) {
    try {
      fn(snapshot);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }
}

export function getActiveRatRanks() {
  const entries = Array.from(ratRegistry.entries());
  const total = entries.length;
  return entries.map(([reviewerId], idx) => ({
    reviewerId,
    rank: total - 1 - idx,
  }));
}

export function onActiveRatsChange(fn) {
  activeRatsListeners.add(fn);
  return () => activeRatsListeners.delete(fn);
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

export function activeRats() {
  return Array.from(ratRegistry.keys());
}

export function activeRatCount() {
  return ratRegistry.size;
}

// ---- visit tracking ----

function visitedKey(venueId) {
  return `bushwick.visited.${venueId}`;
}

export function markVisited(venueId) {
  // Detect threshold-cross: was incomplete before this call, complete after.
  // Fire a one-shot custom event the UI listens for to reveal the alley pin.
  // Idempotent visits (already-visited venue) don't re-fire because the
  // before/after states are both already complete.
  const wasComplete = hasVisitedAllReviewVenues();
  try {
    localStorage.setItem(visitedKey(venueId), 'true');
  } catch {
    // localStorage unavailable — visit not persisted
  }
  if (!wasComplete && hasVisitedAllReviewVenues()) {
    try {
      window.dispatchEvent(new CustomEvent('bushwick:all-venues-visited'));
    } catch {
      // dispatchEvent unavailable (non-browser environment)
    }
  }
}

export function hasVisited(venueId) {
  try {
    return localStorage.getItem(visitedKey(venueId)) === 'true';
  } catch {
    return false;
  }
}

export function visitedReviewVenues() {
  return REVIEW_VENUE_IDS.filter((id) => hasVisited(id));
}

export function hasVisitedAllReviewVenues() {
  return REVIEW_VENUE_IDS.every((id) => hasVisited(id));
}
