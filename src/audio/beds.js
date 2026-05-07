/**
 * src/audio/beds.js — site-wide JMZ rumble + per-venue ambient beds.
 *
 * Two layers:
 *   1. JMZ rumble: site-wide, persistent, low gain. Starts on
 *      engine.start() and never stops. Routed jmz → jmzGain → destination.
 *   2. Per-venue beds: caffeine-underground / mood-ring / bossa-nova
 *      get cafe / bar / rave loops. Lazy-loaded on first need. Each
 *      bed has its OWN gain node so cross-fades between venues stay
 *      clean even if a fade-out is mid-flight when a fade-in begins.
 *
 * Stereo is preserved end-to-end. No Tone.Mono, no .toMono().
 *
 * Other venues (market-hotel, mr-kiwi, trifecta, jmz-platform, alley,
 * rash, ornithology) have no per-venue bed; the JMZ rumble alone
 * carries them.
 */

const VENUE_BED_MAP = {
  'caffeine-underground': { file: 'cafe.wav', gainDb: -18 },
  'mood-ring': { file: 'bar.wav', gainDb: -18 },
  'bossa-nova': { file: 'rave.wav', gainDb: -18 },
  // Rash is a memorial — distant siren sits below the bar/cafe/rave
  // beds and below the JMZ rumble's peaks. -28dB places it as
  // distant atmosphere, not foreground emergency.
  'rash': { file: 'firetruck.wav', gainDb: -28 },
};

const BED_DIR = 'assets/sounds/effects';
const JMZ_FILE = 'assets/sounds/jmz-rumble.wav';

const JMZ_GAIN_DB = -27;
const BED_FADE_IN = 2.5;
const BED_FADE_OUT = 1.5;

let jmzPlayer = null;
let jmzGain = null;

const venueBeds = new Map();
let activeBedVenueId = null;

export async function initBeds() {
  const Tone = window.Tone;
  jmzGain = new Tone.Gain(Tone.dbToGain(JMZ_GAIN_DB)).toDestination();
  jmzPlayer = new Tone.Player({
    url: JMZ_FILE,
    loop: true,
    autostart: false,
  }).connect(jmzGain);
  await Tone.loaded();
  jmzPlayer.start();
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
  const bed = { player, gain, gainDb: entry.gainDb };
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
