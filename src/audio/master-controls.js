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

import { KEYS, readLocal, writeLocal, readFlag, writeFlag } from '../storage.js';

// index.html repeats these as the slider's min/max so its first paint
// is right; change both together.
export const VOLUME_MIN_DB = -40;
export const VOLUME_MAX_DB = 0;

const DEFAULT_VOLUME = 0;
const DEFAULT_MUTED = false;

let cachedVolume = DEFAULT_VOLUME;
let cachedMuted = DEFAULT_MUTED;

function clampDb(db) {
  return Math.max(VOLUME_MIN_DB, Math.min(VOLUME_MAX_DB, db));
}

const storedVolume = parseFloat(readLocal(KEYS.volume));
if (Number.isFinite(storedVolume)) cachedVolume = clampDb(storedVolume);
cachedMuted = readFlag(KEYS.muted);

// Called on every change and once more when the engine starts.
export function applyToTone() {
  const dest = window.Tone?.getDestination();
  if (!dest) return;
  try {
    dest.volume.value = cachedVolume;
    dest.mute = cachedMuted;
  } catch {
    // Destination may not be ready yet; engine.start() applies the
    // saved state again once Tone is fully initialized.
  }
}

export function getVolume() {
  return cachedVolume;
}

export function getMuted() {
  return cachedMuted;
}

export function setVolume(db) {
  cachedVolume = clampDb(db);
  writeLocal(KEYS.volume, cachedVolume);
  applyToTone();
}

export function setMuted(muted) {
  cachedMuted = !!muted;
  writeFlag(KEYS.muted, cachedMuted);
  applyToTone();
}

