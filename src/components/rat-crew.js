/**
 * src/components/rat-crew.js — the scuttle crew: a small group of
 * rats that runs across a strip now and then. Shared by the loading
 * screen and the About page footer, so both crews move alike; the
 * motion itself is the .loading-rat styles and ratScuttle keyframes
 * in styles.css.
 */
import { RAT_PATH_D, RAT_VIEWBOX } from './rat-silhouette.js';
import { prefersReducedMotion } from '../device.js';

const RAT_WIDTHS = [28, 22, 25];
const RUN_MS = 6000;
// Reduced motion: a fixed slow crossing (inline durations would
// otherwise override the stylesheet's accommodation); the bob is
// disabled in CSS.
const REDUCED_MOTION_RUN_MS = 9000;

// One svg per rat (path + license: see rat-silhouette.js). The inner
// <g class="rat-body"> carries the bob separately from the svg's
// crossing keyframes.
export function buildRatCrew() {
  const strip = document.createElement('div');
  strip.className = 'loading-rat';
  strip.setAttribute('aria-hidden', 'true');
  strip.dataset.direction = 'ltr';
  strip.innerHTML = RAT_WIDTHS.map(
    (w) => `
    <svg viewBox="${RAT_VIEWBOX}" width="${w}" preserveAspectRatio="xMidYMax meet">
      <g class="rat-body">
        <path fill="currentColor" fill-rule="evenodd" d="${RAT_PATH_D}"/>
      </g>
    </svg>`
  ).join('');
  return strip;
}

// Sends 1..3 rats across in the given direction (1 = left to right,
// -1 = right to left). Followers start on a stagger and each rat gets
// its own tempo and bob rhythm, so the group reads as animals
// following each other rather than a sprite strip. Returns how long
// the pass takes, in ms; the caller removes .is-running after it.
function runRatCrew(strip, direction) {
  strip.dataset.direction = direction > 0 ? 'ltr' : 'rtl';
  const svgs = Array.from(strip.querySelectorAll('svg'));
  const count = 1 + Math.floor(Math.random() * svgs.length);
  const reduce = prefersReducedMotion();
  let longest = 0;
  svgs.forEach((svg, i) => {
    const included = i < count;
    svg.style.display = included ? '' : 'none';
    if (!included) return;
    const delay = i === 0 ? 0 : Math.round(i * 320 + Math.random() * 600);
    const duration = reduce
      ? REDUCED_MOTION_RUN_MS
      : Math.round(RUN_MS * (0.85 + Math.random() * 0.35));
    svg.style.animationDelay = `${delay}ms`;
    svg.style.animationDuration = `${duration}ms`;
    svg.style.setProperty('--bob-duration', `${200 + Math.round(Math.random() * 120)}ms`);
    svg.style.setProperty('--bob-delay', `-${Math.round(Math.random() * 200)}ms`);
    longest = Math.max(longest, delay + duration);
  });

  // Force a reflow so re-adding the class restarts the animation.
  strip.classList.remove('is-running');
  void strip.offsetWidth;
  strip.classList.add('is-running');
  return longest;
}

// Runs the crew on a loop: a pass after firstDelayMs (default: a
// random interval), then a random minMs–maxMs pause after each pass,
// alternating direction. runNow() sends a crew immediately unless one
// is mid-crossing; stop() cancels whatever is pending.
export function startRatCrewLoop(strip, { minMs, maxMs, firstDelayMs }) {
  let direction = -1;
  let timer = null;
  const randomPause = () => minMs + Math.random() * (maxMs - minMs);

  function run() {
    direction = -direction;
    const longest = runRatCrew(strip, direction);
    timer = setTimeout(() => {
      strip.classList.remove('is-running');
      timer = setTimeout(run, randomPause());
    }, longest + 100);
  }

  timer = setTimeout(run, firstDelayMs ?? randomPause());
  return {
    runNow() {
      if (strip.classList.contains('is-running')) return;
      clearTimeout(timer);
      run();
    },
    stop() {
      clearTimeout(timer);
    },
  };
}
