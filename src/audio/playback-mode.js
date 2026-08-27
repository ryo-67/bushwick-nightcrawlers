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
 * Persisted in localStorage under bushwick.playback.mode.
 * The footer toggle calls setMode(); RatGenerator calls getMode()
 * at start() time. Mid-playback mode flips do not affect the
 * currently-playing generator.
 */

const STORAGE_KEY = 'bushwick.playback.mode';
const VALID_MODES = new Set(['moment', 'tongue']);
const DEFAULT_MODE = 'moment';

let currentMode = DEFAULT_MODE;
const listeners = new Set();

try {
  let stored = localStorage.getItem(STORAGE_KEY);
  // V72: 'record' folded into 'tongue' — migrate saved prefs.
  if (stored === 'record') stored = 'tongue';
  if (VALID_MODES.has(stored)) currentMode = stored;
} catch {
  // localStorage unavailable — stay on default
}

export function getMode() {
  return currentMode;
}

export function setMode(mode) {
  if (!VALID_MODES.has(mode)) return;
  if (mode === currentMode) return;
  currentMode = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage unavailable — in-memory only
  }
  for (const fn of listeners) {
    try {
      fn(mode);
    } catch {
      // Don't let one listener tank the rest.
    }
  }
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
