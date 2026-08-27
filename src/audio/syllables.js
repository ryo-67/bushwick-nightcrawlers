/**
 * src/audio/syllables.js — vowel-cluster syllable estimator for the
 * syllabic voice mode. Pure function, English heuristic (~95% on the
 * review corpus): count vowel groups, drop silent trailing e, keep
 * -le endings, floor at 1.
 */

const VOWEL_GROUP = /[aeiouy]+/g;

export function syllableCount(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length === 0) return 1;
  if (w.length <= 3) return 1;

  let count = (w.match(VOWEL_GROUP) || []).length;

  // Silent trailing e ("crumb-le" keeps it via the -le rule below).
  if (/[^aeiou]e$/.test(w) && !/[^aeiou]le$/.test(w)) count -= 1;
  // -es endings that don't add a syllable ("bones", "cigarettes"),
  // except after sibilants where they do ("noses", "boxes").
  if (/[^aeiouscxz]es$/.test(w)) count -= 1;
  // -ed endings that don't add a syllable ("wrapped", "simmered"),
  // except after t/d where they do ("wasted", "added").
  if (/[^aeioutd]ed$/.test(w)) count -= 1;

  return Math.max(1, count);
}
