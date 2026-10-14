/**
 * src/audio/normalize.js — the one key normalisation shared by the
 * keyword tables and the syllable estimator: lowercase, letters
 * only, so "Ketamine," and "ketamine" match the same entry.
 *
 * RatGenerator's normalizeWord is deliberately different (it keeps
 * inner hyphens and digits for trigger matching); don't merge them.
 */

export function lettersOnly(word) {
  return word.toLowerCase().replace(/[^a-z]/g, '');
}
