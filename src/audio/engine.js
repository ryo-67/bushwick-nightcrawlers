/**
 * src/audio/engine.js — singleton bootstrap for the audio system.
 *
 * Tone.js v15 is loaded as a global script in index.html before this
 * module is imported. We do not import Tone here; we read it off
 * `window.Tone` at call time so this file can sit alongside ES module
 * imports without touching the bundler-free build.
 *
 * Lifecycle:
 *   start()        — must be called inside a user gesture. Idempotent.
 *                    Calls Tone.start() then loads both USV banks.
 *   isReady()      — true after both banks have finished loading.
 *   onReady(fn)    — fires fn when ready (immediately if already ready).
 *   getBank(name)  — returns the loaded sample array for 'usvs' or
 *                    'usvs-cocaine'. Each entry is
 *                    { filename, buffer, duration, tier }.
 */

import { USVS, USVS_COCAINE } from './manifest.js';

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

let ready = false;
let startPromise = null;
const readyListeners = [];

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

export function start() {
  if (startPromise) return startPromise;
  startPromise = (async () => {
    await window.Tone.start();
    await loadBanks();
    ready = true;
    while (readyListeners.length) {
      const fn = readyListeners.shift();
      try {
        fn();
      } catch (e) {
        // Don't let one listener tank the rest.
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
