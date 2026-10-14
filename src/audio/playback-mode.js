/**
 * src/audio/playback-mode.js — playback mode controller.
 *
 * Two modes:
 *   'moment' — generative. Each playback differs (Math.random).
 *              Default. The rats are speaking, not replaying.
 *   'tongue' — the rats' real language (V72, replacing 'record'):
 *              words render as syllable-core USV runs (rat-generator
 *              scheduleSyllabicWord) and residual randomness is
 *              seeded, so the same review plays identically every
 *              time — determinism emerges from the language itself
 *              rather than from a recording.
 *
 * Persisted in localStorage (KEYS.playbackMode in src/storage.js).
 * The footer toggle calls setMode(); RatGenerator calls getMode()
 * at start() time. Mid-playback mode flips do not affect the
 * currently-playing generator.
 */

import { KEYS, readLocal, writeLocal } from '../storage.js';

const VALID_MODES = new Set(['moment', 'tongue']);
const DEFAULT_MODE = 'moment';

let currentMode = DEFAULT_MODE;

let storedMode = readLocal(KEYS.playbackMode);
// V72: 'record' folded into 'tongue' — migrate saved prefs.
if (storedMode === 'record') storedMode = 'tongue';
if (VALID_MODES.has(storedMode)) currentMode = storedMode;

export function getMode() {
  return currentMode;
}

export function setMode(mode) {
  if (!VALID_MODES.has(mode)) return;
  if (mode === currentMode) return;
  currentMode = mode;
  writeLocal(KEYS.playbackMode, mode);
}
