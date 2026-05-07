/**
 * src/audio/keyword-effects.js — keyword → sample-effect spec table.
 *
 * When a rat speaks a word matching one of these keys, RatGenerator
 * schedules the matching sample to play at the same time as the
 * word's USV. The sample routes through the rat's perRatLPF so it
 * inherits the recency-rank treatment (close = clear, distant =
 * muffled and reverberant).
 *
 * Keys are normalized: lowercase, non-alpha stripped. Sub-word
 * matches are NOT supported in v1 — "untagged" does not match
 * "tagged" because both normalize to themselves, not to a shared
 * stem. Keep keys to whole-word matches.
 *
 * Filter / processing effects (k-hole low-pass on "ketamine",
 * glitch on time-words) are §12.4c, not here.
 */

export const KEYWORD_EFFECTS = {
  tagged:     { effect: 'chime', volume: -5, layered: ['vibrate'] },
  immaculate: { effect: 'chime', volume: -5, layered: ['vibrate'] },
  iconic:     { effect: 'chime', volume: -5, layered: ['vibrate'] },
  inkedin:    { effect: 'linkedin', volume: -7 },
  yelp:       { effect: 'chime', volume: -5, layered: ['vibrate'] },
  viral:      { effect: 'cough', volume: -9 },
  sniff:      { effect: 'cough', volume: -9 },
  sniffs:     { effect: 'cough', volume: -9 },
  diet:       { effect: 'fizz', volume: -7, offset: 0 },
  fizzy:      { effect: 'fizz', volume: -7, offset: 0 },
  pepsico:    { effect: 'fizz', volume: -7, offset: 0 },
  subscribe:  { effect: 'vibrate', volume: -11 },
  following:  { effect: 'vibrate', volume: -11 },
  followers:  { effect: 'vibrate', volume: -11 },
  gemini:     { effect: 'vibrate', volume: -11 },
  linkedin:   { effect: 'linkedin', volume: -7 },
  brimfield:  { effect: 'camera', volume: -7 },
};

export function matchKeyword(word) {
  if (typeof word !== 'string') return null;
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
  return KEYWORD_EFFECTS[normalized] || null;
}
