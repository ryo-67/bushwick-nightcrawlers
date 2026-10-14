/**
 * src/audio/ramp.js — click-free parameter ramps.
 *
 * Cancels anything already scheduled, pins the current value at
 * "now", then ramps linearly to the target. Starting from the live
 * value is what keeps an interrupted fade from jumping.
 */

export function rampParam(param, target, seconds) {
  const now = window.Tone.now();
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(target, now + seconds);
}
