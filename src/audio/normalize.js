/**
 * src/audio/normalize.js — shared text handling for the voice and
 * the review card.
 *
 * splitTokens / isSpace: the ONE word splitter. RatGenerator schedules
 * word i and the modal lights span i, so both must split a review
 * identically; they both call this.
 *
 * lettersOnly / lookupByLetters: the key normalisation shared by the
 * keyword tables and the syllable estimator — lowercase, letters only,
 * so "Ketamine," and "ketamine" match the same entry. (RatGenerator's
 * normalizeWord is deliberately different: it keeps inner hyphens and
 * digits for trigger matching; don't merge them.)
 */

// Words and the whitespace runs between them, in order, no empties.
export function splitTokens(text) {
  return text.split(/(\s+)/).filter((token) => token !== '');
}

export function isSpace(token) {
  return /^\s+$/.test(token);
}

export function lettersOnly(word) {
  return word.toLowerCase().replace(/[^a-z]/g, '');
}

export function lookupByLetters(table, word) {
  return table[lettersOnly(word)] ?? null;
}
