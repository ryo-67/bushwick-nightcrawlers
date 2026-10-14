/**
 * src/device.js — what the visitor's device can do, as live media
 * queries (one MediaQueryList each, read on demand).
 */

const touchScreen = window.matchMedia('(hover: none), (pointer: coarse)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// No hover (a touch screen). Decided by input type, not width, so a
// wide tablet counts and a narrow desktop window doesn't.
export function isTouchScreen() {
  return touchScreen.matches;
}

export function prefersReducedMotion() {
  return reducedMotion.matches;
}
