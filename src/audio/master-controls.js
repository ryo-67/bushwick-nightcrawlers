/**
 * src/audio/master-controls.js — master volume + mute, persisted.
 *
 * Wires directly to Tone.Destination.volume (in dB) and
 * Tone.Destination.mute (boolean). No new master node — Tone exposes
 * these on the destination node already, so master controls affect
 * everything: rat voices, beds, reverb output, JMZ rumble.
 *
 * State is cached on module load (read from localStorage) and
 * re-applied to Tone whenever Tone is available. Setting volume or
 * mute updates both the cache, localStorage, and Tone.
 *
 * Slider range: -40 dB (effectively silent) to 0 dB (full mix).
 * Defaults: volume 0 dB, mute false.
 */

const VOL_KEY = 'bushwick.audio.volume';
const MUTE_KEY = 'bushwick.audio.muted';

export const VOLUME_MIN_DB = -40;
export const VOLUME_MAX_DB = 0;

const DEFAULT_VOLUME = 0;
const DEFAULT_MUTED = false;

let cachedVolume = DEFAULT_VOLUME;
let cachedMuted = DEFAULT_MUTED;

try {
  const raw = localStorage.getItem(VOL_KEY);
  if (raw !== null) {
    const parsed = parseFloat(raw);
    if (Number.isFinite(parsed)) {
      cachedVolume = Math.max(VOLUME_MIN_DB, Math.min(VOLUME_MAX_DB, parsed));
    }
  }
} catch {
  // localStorage unavailable
}

try {
  cachedMuted = localStorage.getItem(MUTE_KEY) === 'true';
} catch {
  // localStorage unavailable
}

function applyToTone() {
  const Tone = typeof window !== 'undefined' ? window.Tone : null;
  if (!Tone || !Tone.getDestination) return;
  const dest = Tone.getDestination();
  try {
    dest.volume.value = cachedVolume;
    dest.mute = cachedMuted;
  } catch {
    // Destination may not be ready yet; engine.start() will call
    // applyOnEngineStart() once Tone is fully initialized.
  }
}

export function getVolume() {
  return cachedVolume;
}

export function getMuted() {
  return cachedMuted;
}

export function setVolume(db) {
  const clamped = Math.max(VOLUME_MIN_DB, Math.min(VOLUME_MAX_DB, db));
  cachedVolume = clamped;
  try {
    localStorage.setItem(VOL_KEY, String(clamped));
  } catch {
    // localStorage unavailable — in-memory only
  }
  applyToTone();
}

export function setMuted(muted) {
  cachedMuted = !!muted;
  try {
    localStorage.setItem(MUTE_KEY, cachedMuted ? 'true' : 'false');
  } catch {
    // localStorage unavailable
  }
  applyToTone();
}

export function applyOnEngineStart() {
  applyToTone();
}
