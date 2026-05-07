/**
 * src/audio/beds.js — site-wide JMZ rumble + intermittent train +
 * per-venue ambient beds.
 *
 * Three layers:
 *   1. JMZ rumble: site-wide, looping, low gain. Starts on
 *      engine.start() and never stops.
 *   2. Train passes: site-wide, intermittent. Same JMZ-platform
 *      register but plays as discrete events at 90-180s random
 *      intervals (a real train passes every few minutes, not
 *      continuously).
 *   3. Per-venue beds: caffeine-underground / mood-ring / bossa-nova /
 *      rash get cafe / bar / rave / firetruck loops. Lazy-loaded on
 *      first need. Each bed has its own gain node so cross-fades
 *      between venues stay clean.
 *
 * Persistent beds: VENUE_BED_MAP entries with `persistent: true`
 * fade to a reduced gain on modal close instead of fading out
 * fully — the bed continues playing as a background layer once the
 * user has experienced the venue. Currently used for Rash, where
 * the lingering firetruck siren IS the venue's ongoing sound.
 *
 * Stereo is preserved end-to-end.
 */

const VENUE_BED_MAP = {
  'caffeine-underground': { file: 'cafe.m4a', gainDb: -18 },
  'mood-ring': { file: 'bar.m4a', gainDb: -18 },
  'bossa-nova': { file: 'rave.m4a', gainDb: -18 },
  // Rash is permanently closed — the firetruck siren persists as
  // ambient layer once the user has visited. -22 dB while modal
  // open, -28 dB after close (kept playing, just receded).
  'rash': {
    file: 'firetruck.m4a',
    gainDb: -22,
    persistent: true,
    persistentGainDb: -28,
  },
};

const BED_DIR = 'assets/sounds/effects';
const JMZ_FILE = 'assets/sounds/jmz-rumble.m4a';
const TRAIN_FILE = 'assets/sounds/effects/train.m4a';

const JMZ_GAIN_DB = -27;
const TRAIN_GAIN_DB = -20;
const TRAIN_INTERVAL_MIN_SEC = 90;
const TRAIN_INTERVAL_MAX_SEC = 180;
const BED_FADE_IN = 2.5;
const BED_FADE_OUT = 1.5;

let jmzPlayer = null;
let jmzGain = null;
let trainPlayer = null;
let trainGain = null;
let trainTimerId = null;

const venueBeds = new Map();
let activeBedVenueId = null;

// Pre-gesture: build node graph and load buffers. The Player.start()
// call must wait until the AudioContext is running, so it's deferred
// to startBedsPlayback().
export async function preloadBeds() {
  const Tone = window.Tone;
  jmzGain = new Tone.Gain(Tone.dbToGain(JMZ_GAIN_DB)).toDestination();
  jmzPlayer = new Tone.Player({
    url: JMZ_FILE,
    loop: true,
    autostart: false,
  }).connect(jmzGain);
  trainGain = new Tone.Gain(Tone.dbToGain(TRAIN_GAIN_DB)).toDestination();
  trainPlayer = new Tone.Player({
    url: TRAIN_FILE,
    loop: false,
    autostart: false,
  }).connect(trainGain);
  await Tone.loaded();
}

// Gesture-bound (or post-gesture): kicks off the JMZ rumble loop and
// the recursive train-pass scheduler. Must run after the audio context
// has resumed.
export function startBedsPlayback() {
  if (jmzPlayer && jmzPlayer.state !== 'started') jmzPlayer.start();
  scheduleNextTrainPass();
}

// Backwards compat: combined preload + start. Loading-screen flow
// uses the split functions instead, but this one-step variant stays
// available for any caller that wants the legacy single-call shape.
export async function initBeds() {
  await preloadBeds();
  startBedsPlayback();
}

function scheduleNextTrainPass() {
  const range = TRAIN_INTERVAL_MAX_SEC - TRAIN_INTERVAL_MIN_SEC;
  const delaySec = TRAIN_INTERVAL_MIN_SEC + Math.random() * range;
  trainTimerId = setTimeout(() => {
    if (trainPlayer) {
      try {
        if (trainPlayer.state === 'started') trainPlayer.stop();
        trainPlayer.start();
      } catch {
        // player may have been disposed mid-schedule; harmless
      }
    }
    scheduleNextTrainPass();
  }, delaySec * 1000);
}

async function ensureBed(venueId) {
  if (venueBeds.has(venueId)) return venueBeds.get(venueId);
  const Tone = window.Tone;
  const entry = VENUE_BED_MAP[venueId];
  if (!entry) return null;
  const gain = new Tone.Gain(0).toDestination();
  const player = new Tone.Player({
    url: `${BED_DIR}/${entry.file}`,
    loop: true,
    autostart: false,
  }).connect(gain);
  await Tone.loaded();
  const bed = {
    player,
    gain,
    gainDb: entry.gainDb,
    persistent: !!entry.persistent,
    // Default persistent level is -6 dB below active. Override by
    // setting `persistentGainDb` explicitly on the VENUE_BED_MAP entry.
    persistentGainDb: entry.persistentGainDb ?? entry.gainDb - 6,
  };
  venueBeds.set(venueId, bed);
  return bed;
}

function fadeIn(bed) {
  const Tone = window.Tone;
  const now = Tone.now();
  const target = Tone.dbToGain(bed.gainDb);
  bed.gain.gain.cancelScheduledValues(now);
  bed.gain.gain.setValueAtTime(bed.gain.gain.value, now);
  bed.gain.gain.linearRampToValueAtTime(target, now + BED_FADE_IN);
  if (bed.player.state !== 'started') bed.player.start();
}

function fadeOut(venueId) {
  const bed = venueBeds.get(venueId);
  if (!bed) return;
  const Tone = window.Tone;
  const now = Tone.now();
  bed.gain.gain.cancelScheduledValues(now);
  bed.gain.gain.setValueAtTime(bed.gain.gain.value, now);

  if (bed.persistent) {
    // Persistent: fade to reduced gain, keep player looping. The bed
    // becomes a background layer once the user has experienced it.
    const target = Tone.dbToGain(bed.persistentGainDb);
    bed.gain.gain.linearRampToValueAtTime(target, now + BED_FADE_OUT);
    return;
  }

  // Non-persistent: fade to silence and stop the player.
  bed.gain.gain.linearRampToValueAtTime(0, now + BED_FADE_OUT);
  setTimeout(() => {
    try {
      if (bed.player.state === 'started') bed.player.stop();
    } catch {
      // already stopped — fine
    }
  }, BED_FADE_OUT * 1000 + 50);
}

export async function startVenueBed(venueId) {
  if (!VENUE_BED_MAP[venueId]) {
    if (activeBedVenueId) {
      const previous = activeBedVenueId;
      activeBedVenueId = null;
      fadeOut(previous);
    }
    return;
  }
  if (activeBedVenueId === venueId) return;
  if (activeBedVenueId) fadeOut(activeBedVenueId);
  activeBedVenueId = venueId;
  const bed = await ensureBed(venueId);
  if (bed && activeBedVenueId === venueId) fadeIn(bed);
}

export function stopActiveBed() {
  if (!activeBedVenueId) return;
  const previous = activeBedVenueId;
  activeBedVenueId = null;
  fadeOut(previous);
}
