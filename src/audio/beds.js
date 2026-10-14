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

import { panForVenue } from './spatial.js';
import { loadBufferWithRetry } from './load-buffer.js';
import { rampParam } from './ramp.js';

// Component gainDb values. Primary loop components sit at the
// per-venue level (cafe -11, bar -13, rave -11, firetruck -19).
// Secondary atomic ambient at -22 to -28; tertiary subtle at -28 to
// -32. Multi-component beds should sum-perceived to roughly a
// single-file bed's level, not pile additively louder. Tune by ear
// in verification.
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
      { file: 'water-drip.webm', gainDb: -24 },        // primary
      { file: 'leaky-pipe.webm', gainDb: -28 },        // secondary
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

// venueId → Promise<bed|null>, stored before the first await so a
// quick close-and-reopen reuses the in-flight build instead of
// building (and fading in) a second, orphaned bed.
const bedBuilds = new Map();
// venueId → built bed, for the synchronous fade-out path.
const venueBeds = new Map();
// file → Promise<ToneAudioBuffer|null>. Several venues share files
// (fridge-hum, fluoro-hum, ambulance, leaky-pipe); each is fetched
// and decoded once.
const bedBuffers = new Map();
let activeBedVenueId = null;

// Pre-gesture: build node graph and load buffers. The Player.start()
// call must wait until the AudioContext is running, so it's deferred
// to startBedsPlayback().
//
// V74: each bed loads on its own (one retry, then left silent)
// rather than awaiting Tone.loaded() — that waits on EVERY in-flight
// Tone download, so one failed USV file would reject the beds too.
// Nodes are created once, so a preload retry only refetches what's
// still missing.
export async function preloadBeds() {
  const Tone = window.Tone;
  if (!jmzPlayer) {
    jmzGain = new Tone.Gain(Tone.dbToGain(JMZ_GAIN_DB)).toDestination();
    jmzPlayer = new Tone.Player({ loop: true, autostart: false }).connect(jmzGain);
    myrtleTrafficGain = new Tone.Gain(Tone.dbToGain(MYRTLE_TRAFFIC_GAIN_DB)).toDestination();
    myrtleTrafficPlayer = new Tone.Player({ loop: true, autostart: false }).connect(myrtleTrafficGain);
    trainGain = new Tone.Gain(Tone.dbToGain(TRAIN_GAIN_DB)).toDestination();
    trainPlayer = new Tone.Player({ loop: false, autostart: false }).connect(trainGain);
  }
  await Promise.all([
    [jmzPlayer, JMZ_FILE],
    [myrtleTrafficPlayer, MYRTLE_TRAFFIC_FILE],
    [trainPlayer, TRAIN_FILE],
  ].map(async ([player, url]) => {
    if (player.loaded) return;
    const buffer = await loadBufferWithRetry(url);
    if (buffer) player.buffer = buffer;
  }));
}

// Gesture-bound (or post-gesture): kicks off the JMZ rumble loop,
// the Myrtle traffic noise floor, and the recursive train-pass
// scheduler. Must run after the audio context has resumed. A bed
// whose file never loaded stays silent (V74).
export function startBedsPlayback() {
  if (jmzPlayer?.loaded && jmzPlayer.state !== 'started') jmzPlayer.start();
  if (myrtleTrafficPlayer?.loaded && myrtleTrafficPlayer.state !== 'started') {
    myrtleTrafficPlayer.start();
  }
  scheduleNextTrainPass();
}

// Fires a train pass immediately. Used by the recursive schedule and
// by pin-open hooks (e.g. clicking jmz-platform); the schedule keeps
// running alongside. A pass already in flight restarts from the top
// so the click gets a clear "train arriving" event.
export function triggerTrainPass() {
  if (!trainPlayer?.loaded) return;
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
  setTimeout(() => {
    triggerTrainPass();
    scheduleNextTrainPass();
  }, delaySec * 1000);
}

// A failed file isn't cached, so the next open of a venue that uses
// it tries again.
function loadBedBuffer(file) {
  if (!bedBuffers.has(file)) {
    bedBuffers.set(file, loadBufferWithRetry(`${BED_DIR}/${file}`).then((buffer) => {
      if (!buffer) bedBuffers.delete(file);
      return buffer;
    }));
  }
  return bedBuffers.get(file);
}

// Callers check VENUE_BED_MAP first, so the venue has a bed.
function ensureBed(venueId) {
  if (!bedBuilds.has(venueId)) {
    bedBuilds.set(venueId, buildBed(venueId, VENUE_BED_MAP[venueId]));
  }
  return bedBuilds.get(venueId);
}

// V74 loading, as for the site-wide layers: each component loads on
// its own (one retry), and a component whose file never loads is
// left out rather than failing the whole bed.
async function buildBed(venueId, entry) {
  const Tone = window.Tone;

  // Shared gain controls fade-in/out. Component gains set fixed
  // relative levels within the bed: each component routes through
  // its own gain node before joining the shared bus, so the mix
  // ratios survive the shared fade envelope.
  // Spatial: the whole bed sits where the venue's pin sits on the
  // map (see spatial.js). Site-wide layers above (JMZ, traffic,
  // train) stay centered.
  const bedPanner = new Tone.Panner(panForVenue(venueId)).toDestination();
  const sharedGain = new Tone.Gain(0).connect(bedPanner);
  const players = (await Promise.all(entry.components.map(async (comp) => {
    const buffer = await loadBedBuffer(comp.file);
    if (!buffer) return null;
    const componentGain = new Tone.Gain(Tone.dbToGain(comp.gainDb)).connect(sharedGain);
    const player = new Tone.Player({ loop: true, autostart: false }).connect(componentGain);
    player.buffer = buffer;
    return player;
  }))).filter(Boolean);

  if (players.length === 0) {
    // Nothing loaded: drop the empty graph and forget the build so
    // the next open retries.
    sharedGain.dispose();
    bedPanner.dispose();
    bedBuilds.delete(venueId);
    return null;
  }

  const bed = {
    players,
    sharedGain,
    entry, // its VENUE_BED_MAP entry: persistent, persistentGainDb
    // Pending stop from a non-persistent fade-out; a quick reopen
    // cancels it so the old timer can't silence the reopened bed.
    stopTimer: null,
  };
  venueBeds.set(venueId, bed);
  return bed;
}

function fadeIn(bed) {
  clearTimeout(bed.stopTimer);
  bed.stopTimer = null;
  // Shared gain at unity; the component gains carry the mix.
  rampParam(bed.sharedGain.gain, 1, BED_FADE_IN);
  for (const player of bed.players) {
    if (player.state !== 'started') player.start();
  }
}

function fadeOut(venueId) {
  const bed = venueBeds.get(venueId);
  if (!bed) return;
  if (bed.entry.persistent) {
    // Persistent: fade shared gain to reduced level, components keep
    // looping. The bed becomes a background layer once the user has
    // experienced it.
    rampParam(bed.sharedGain.gain, window.Tone.dbToGain(bed.entry.persistentGainDb), BED_FADE_OUT);
    return;
  }

  // Non-persistent: fade shared gain to silence and stop all
  // component players.
  rampParam(bed.sharedGain.gain, 0, BED_FADE_OUT);
  bed.stopTimer = setTimeout(() => {
    bed.stopTimer = null;
    for (const player of bed.players) {
      try {
        if (player.state === 'started') player.stop();
      } catch {
        // already stopped — fine
      }
    }
  }, BED_FADE_OUT * 1000 + 50);
}

export async function startVenueBed(venueId) {
  if (!VENUE_BED_MAP[venueId]) {
    stopActiveBed();
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
