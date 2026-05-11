/**
 * src/audio/beds.js — site-wide ambient + intermittent train +
 * per-venue layered ambient beds.
 *
 * Four layers:
 *   1. JMZ rumble: site-wide, looping, low gain. The structural
 *      beat of the corner. Starts on engine.start(), never stops.
 *   2. Myrtle-Broadway traffic: site-wide, looping, very low gain.
 *      The intersection's noise floor. Starts with JMZ, never
 *      stops.
 *   3. Train passes: site-wide, intermittent. JMZ-platform
 *      register but as discrete events at 90-180s random
 *      intervals.
 *   4. Per-venue beds: layered atomic samples through individual
 *      component gains feeding a shared gain that handles fade-
 *      in/out. Lazy-loaded on first need.
 *
 * Persistent beds: VENUE_BED_MAP entries with `persistent: true`
 * fade to a reduced gain on modal close instead of fading out
 * fully — the bed continues playing as a background layer once the
 * user has experienced the venue. Currently used for Rash, where
 * the lingering firetruck siren IS the venue's ongoing sound.
 *
 * Stereo is preserved end-to-end.
 */

// Component gainDb values anchored to the established baseline
// (see git history for previous tuning passes). Primary loop
// component matches the most recent per-venue level (cafe -11,
// bar -13, rave -11, firetruck -19). Secondary atomic ambient at
// -22 to -28; tertiary subtle at -28 to -32. Multi-component beds
// should sum-perceived to roughly the existing single-file bed
// level, not pile additively louder. Tune by ear in verification.
const VENUE_BED_MAP = {
  'caffeine-underground': {
    components: [
      { file: 'cafe.webm', gainDb: -11 },              // primary
      { file: 'leaky-pipe.webm', gainDb: -25 },        // secondary
      { file: 'foil.webm', gainDb: -30 },              // tertiary
    ],
  },
  'mood-ring': {
    components: [
      { file: 'bar.webm', gainDb: -13 },               // primary
    ],
  },
  'bossa-nova': {
    components: [
      { file: 'rave.webm', gainDb: -11 },              // primary
    ],
  },
  'rash': {
    components: [
      { file: 'firetruck.webm', gainDb: -19 },         // primary, persistent
    ],
    persistent: true,
    persistentGainDb: -25,
  },

  // Venues without a dedicated single-file primary; layered atomic
  // samples sum to a comparable presence. Tune by ear.
  'market-hotel': {
    components: [
      { file: 'punk-ambience.webm', gainDb: -13 },     // primary
    ],
  },
  'mr-kiwi': {
    components: [
      { file: 'fridge-hum.webm', gainDb: -20 },        // primary character
      { file: 'fluoro-hum.webm', gainDb: -25 },        // secondary
      { file: 'spanish-radio.webm', gainDb: -23 },     // secondary, distinct content
    ],
  },
  'trifecta': {
    components: [
      { file: 'fryer.webm', gainDb: -20 },             // primary character
      { file: 'fluoro-hum.webm', gainDb: -24 },        // secondary
      { file: 'fridge-hum.webm', gainDb: -27 },        // tertiary
      { file: 'ambulance.webm', gainDb: -32 },         // distant siren
    ],
  },
  'jmz-platform': {
    components: [
      { file: 'pigeon-family.webm', gainDb: -22 },     // primary
      { file: 'ambulance.webm', gainDb: -32 },         // distant siren
    ],
  },
  'alley': {
    components: [
      { file: 'water-drip.webm', gainDb: -24 },        // primary (was secondary)
      { file: 'leaky-pipe.webm', gainDb: -28 },        // secondary (was tertiary)
    ],
  },
  'ornithology': {
    components: [
      { file: 'jazz.webm', gainDb: -16 },              // primary — jazz IS the venue
    ],
  },
};

const BED_DIR = 'assets/sounds/effects';
const JMZ_FILE = 'assets/sounds/ambient/jmz-rumble.webm';
const MYRTLE_TRAFFIC_FILE = 'assets/sounds/ambient/myrtle-broadway-traffic.webm';
const TRAIN_FILE = 'assets/sounds/effects/train.webm';

const JMZ_GAIN_DB = -12;
// Anchored 18 dB below JMZ as a true noise floor — the intersection's
// continuous traffic murmur, present but not competing with the
// structural rumble or any per-venue bed.
const MYRTLE_TRAFFIC_GAIN_DB = -30;
const TRAIN_GAIN_DB = -17;
const TRAIN_INTERVAL_MIN_SEC = 90;
const TRAIN_INTERVAL_MAX_SEC = 180;
const BED_FADE_IN = 2.5;
const BED_FADE_OUT = 1.5;

let jmzPlayer = null;
let jmzGain = null;
let myrtleTrafficPlayer = null;
let myrtleTrafficGain = null;
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
  myrtleTrafficGain = new Tone.Gain(Tone.dbToGain(MYRTLE_TRAFFIC_GAIN_DB)).toDestination();
  myrtleTrafficPlayer = new Tone.Player({
    url: MYRTLE_TRAFFIC_FILE,
    loop: true,
    autostart: false,
  }).connect(myrtleTrafficGain);
  trainGain = new Tone.Gain(Tone.dbToGain(TRAIN_GAIN_DB)).toDestination();
  trainPlayer = new Tone.Player({
    url: TRAIN_FILE,
    loop: false,
    autostart: false,
  }).connect(trainGain);
  await Tone.loaded();
}

// Gesture-bound (or post-gesture): kicks off the JMZ rumble loop,
// the Myrtle traffic noise floor, and the recursive train-pass
// scheduler. Must run after the audio context has resumed.
export function startBedsPlayback() {
  if (jmzPlayer && jmzPlayer.state !== 'started') jmzPlayer.start();
  if (myrtleTrafficPlayer && myrtleTrafficPlayer.state !== 'started') {
    myrtleTrafficPlayer.start();
  }
  scheduleNextTrainPass();
}

// Backwards compat: combined preload + start. Loading-screen flow
// uses the split functions instead, but this one-step variant stays
// available for any caller that wants the legacy single-call shape.
export async function initBeds() {
  await preloadBeds();
  startBedsPlayback();
}

function playTrainNow() {
  if (!trainPlayer) return;
  try {
    if (trainPlayer.state === 'started') trainPlayer.stop();
    trainPlayer.start();
  } catch {
    // player may have been disposed mid-schedule; harmless
  }
}

function scheduleNextTrainPass() {
  const range = TRAIN_INTERVAL_MAX_SEC - TRAIN_INTERVAL_MIN_SEC;
  const delaySec = TRAIN_INTERVAL_MIN_SEC + Math.random() * range;
  trainTimerId = setTimeout(() => {
    playTrainNow();
    scheduleNextTrainPass();
  }, delaySec * 1000);
}

// Fires a train pass immediately. Site-wide intermittent schedule
// continues running in parallel — this is an additive trigger for
// pin-open hooks (e.g., clicking jmz-platform). If a pass is already
// in flight, it's restarted from the top so the user gets a clear
// "train arriving" event tied to their click.
export function triggerTrainPass() {
  playTrainNow();
}

async function ensureBed(venueId) {
  if (venueBeds.has(venueId)) return venueBeds.get(venueId);
  const Tone = window.Tone;
  const entry = VENUE_BED_MAP[venueId];
  if (!entry) return null;
  const components = entry.components || [];
  if (components.length === 0) return null;

  // Shared gain controls fade-in/out. Component gains set fixed
  // relative levels within the bed: each component routes through
  // its own gain node before joining the shared bus, so the mix
  // ratios survive the shared fade envelope.
  const sharedGain = new Tone.Gain(0).toDestination();
  const componentObjs = [];

  for (const comp of components) {
    const componentGain = new Tone.Gain(Tone.dbToGain(comp.gainDb)).connect(sharedGain);
    const player = new Tone.Player({
      url: `${BED_DIR}/${comp.file}`,
      loop: true,
      autostart: false,
    }).connect(componentGain);
    componentObjs.push({ player, componentGain, file: comp.file });
  }

  await Tone.loaded();

  const bed = {
    components: componentObjs,
    sharedGain,
    persistent: !!entry.persistent,
    persistentGainDb: entry.persistentGainDb ?? -6,
  };
  venueBeds.set(venueId, bed);
  return bed;
}

function fadeIn(bed) {
  const Tone = window.Tone;
  const now = Tone.now();
  const target = 1; // shared gain at unity; components carry the mix
  bed.sharedGain.gain.cancelScheduledValues(now);
  bed.sharedGain.gain.setValueAtTime(bed.sharedGain.gain.value, now);
  bed.sharedGain.gain.linearRampToValueAtTime(target, now + BED_FADE_IN);
  for (const comp of bed.components) {
    if (comp.player.state !== 'started') comp.player.start();
  }
}

function fadeOut(venueId) {
  const bed = venueBeds.get(venueId);
  if (!bed) return;
  const Tone = window.Tone;
  const now = Tone.now();
  bed.sharedGain.gain.cancelScheduledValues(now);
  bed.sharedGain.gain.setValueAtTime(bed.sharedGain.gain.value, now);

  if (bed.persistent) {
    // Persistent: fade shared gain to reduced level, components keep
    // looping. The bed becomes a background layer once the user has
    // experienced it.
    const target = Tone.dbToGain(bed.persistentGainDb);
    bed.sharedGain.gain.linearRampToValueAtTime(target, now + BED_FADE_OUT);
    return;
  }

  // Non-persistent: fade shared gain to silence and stop all
  // component players.
  bed.sharedGain.gain.linearRampToValueAtTime(0, now + BED_FADE_OUT);
  setTimeout(() => {
    for (const comp of bed.components) {
      try {
        if (comp.player.state === 'started') comp.player.stop();
      } catch {
        // already stopped — fine
      }
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
