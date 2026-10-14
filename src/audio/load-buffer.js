/**
 * src/audio/load-buffer.js — tolerant single-file buffer loading.
 *
 * V74: every preload file (~190) goes through here: one retry, then
 * null (logged) instead of a throw, so a single bad file costs one
 * sample rather than rejecting the whole preload and leaving the
 * corner silent.
 */

const RETRY_DELAY_MS = 1000;

export async function loadBufferWithRetry(url, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const buffer = new window.Tone.ToneAudioBuffer();
      await buffer.load(url);
      return buffer;
    } catch (e) {
      if (attempt === retries) {
        // eslint-disable-next-line no-console
        console.error(`Audio file failed to load: ${url}`, e);
        return null;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  return null;
}
