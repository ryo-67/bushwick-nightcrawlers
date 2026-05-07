/**
 * src/audio/keyword-processors.js — keyword → processing-effect dispatch.
 *
 * Distinct from keyword-effects.js (which plays SAMPLES alongside the
 * voice). Processors automate parameters on per-rat audio nodes already
 * inserted into the rat's chain — they modulate the rat's voice itself.
 *
 * Two processors in this version:
 *   - kHole       (Razor Whisker, on "ketamine")
 *   - timeGlitch  (Edible Eddie, on time-words)
 *
 * Each processor takes (rat, time) where `time` is the AudioContext
 * time at which the matched word starts speaking. All automation is
 * scheduled relative to that time so the effect lands exactly when
 * the word does, regardless of how far in the future cursor is at
 * scheduling.
 *
 * Per-rat opt-in: rats without the relevant processor chain bail
 * silently via the `if (!rat.kHolePhaser) return` guard. False-positive
 * keyword matches (e.g., "now" appearing in other rats' text) cost
 * a property check.
 */

// K-hole: phaser sweep + ping-pong delay trails + LPF dip, all
// activate together over a 2.5s envelope. The voice keeps talking
// through the dip; what changes is its spatial presence (wide stereo
// trails), its timbre (swirling phaser), and its high-frequency
// content (closed filter). Dissolution, not muting.
export function kHole(rat, time) {
  if (!rat.kHolePhaser) return;
  const t = typeof time === 'number' ? time : window.Tone.now();

  const phW = rat.kHolePhaser.wet;
  const ppW = rat.kHolePingPong.wet;
  const lpf = rat.kHoleLPF.frequency;

  phW.cancelScheduledValues(t);
  ppW.cancelScheduledValues(t);
  lpf.cancelScheduledValues(t);

  // Fade in 0.5s, hold 1.0s, fade out 1.0s.
  phW.setValueAtTime(0, t);
  phW.linearRampToValueAtTime(0.75, t + 0.5);
  phW.setValueAtTime(0.75, t + 1.5);
  phW.linearRampToValueAtTime(0, t + 2.5);

  ppW.setValueAtTime(0, t);
  ppW.linearRampToValueAtTime(0.55, t + 0.5);
  ppW.setValueAtTime(0.55, t + 1.5);
  ppW.linearRampToValueAtTime(0, t + 2.5);

  // Filter uses exponential ramps (smoother for frequency); avoid 0
  // as a target since exponential can't ramp to zero.
  // Listen-test (Pass A): 320 Hz left voice nearly inaudible (mute,
  // not dissolve). Raised target to 850 Hz so voice remains
  // recognizable through the dip. Hold shortened 1.0s → 0.5s so the
  // dissolution feels like a wave passing through, not a mute-and-
  // recover. Phaser + ping-pong envelopes unchanged — they carry the
  // dissolution feel.
  lpf.setValueAtTime(20000, t);
  lpf.exponentialRampToValueAtTime(850, t + 0.5);
  lpf.setValueAtTime(850, t + 1.0);
  lpf.exponentialRampToValueAtTime(20000, t + 2.5);
}

// Time-glitch: short irregular stutter on FeedbackDelay wet, plus a
// brief vibrato depth pulse for pitch wobble. Total ~0.5s. Reads as
// time instability inside the word, not a smooth echo. Arrhythmic
// step times are intentional — the abrupt setValueAtTime transitions
// produce stutter; a smooth ramp would just be tremolo.
export function timeGlitch(rat, time) {
  if (!rat.glitchDelay) return;
  const t = typeof time === 'number' ? time : window.Tone.now();

  const w = rat.glitchDelay.wet;
  const v = rat.glitchVibrato.depth;

  w.cancelScheduledValues(t);
  v.cancelScheduledValues(t);

  // Irregular stutter pulses on delay wet.
  w.setValueAtTime(0, t);
  w.setValueAtTime(0.7, t + 0.015);
  w.setValueAtTime(0, t + 0.075);
  w.setValueAtTime(0.55, t + 0.13);
  w.setValueAtTime(0, t + 0.175);
  w.setValueAtTime(0.85, t + 0.26);
  w.setValueAtTime(0, t + 0.42);

  // Pitch wobble: depth jumps in fast at the 11Hz LFO rate, holds
  // briefly, drops back to 0.
  v.setValueAtTime(0, t);
  v.setValueAtTime(0.45, t + 0.04);
  v.setValueAtTime(0, t + 0.42);
}

// Eddie's actual time-words from his Trifecta review + alley one-liner
// (audited against current text). Common words like "now" / "then" /
// "once" appear in other rats' text too — those are silent fires
// thanks to the per-rat opt-in guard at the top of each processor.
const TIME_WORDS = [
  'event',
  'now',
  'season',
  'seconds',
  'then',
  'once',
  'forever',
  'minutes',
  'years',
  'timelines',
];

export const KEYWORD_PROCESSORS = {
  ketamine: kHole,
};
for (const word of TIME_WORDS) {
  KEYWORD_PROCESSORS[word] = timeGlitch;
}

export function matchProcessor(word) {
  if (typeof word !== 'string') return null;
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
  return KEYWORD_PROCESSORS[normalized] || null;
}
