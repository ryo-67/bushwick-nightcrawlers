/**
 * src/components/about-rats.js — the scuttle crew closes the About
 * page. Self-contained: builds a footer strip and reuses the
 * loading screen's .loading-rat classes and ratScuttle keyframes
 * (styles.css), so the About page's rats move exactly like the
 * loading screen's. Loaded only by about.html.
 */
import { RAT_PATH_D, RAT_VIEWBOX } from './rat-silhouette.js';

const RAT_WIDTHS = [28, 22, 25];
const MIN_INTERVAL_MS = 7000;
const MAX_INTERVAL_MS = 12000;
const RUN_MS = 6000;

const footer = document.createElement('footer');
footer.className = 'about-rat-footer';
footer.setAttribute('aria-hidden', 'true');

const strip = document.createElement('div');
strip.className = 'loading-rat';
strip.dataset.direction = 'ltr';
strip.innerHTML = RAT_WIDTHS.map(
  (w) => `
  <svg viewBox="${RAT_VIEWBOX}" width="${w}" preserveAspectRatio="xMidYMax meet">
    <g class="rat-body">
      <path fill="currentColor" fill-rule="evenodd" d="${RAT_PATH_D}"/>
    </g>
  </svg>`
).join('');
footer.appendChild(strip);
document.body.appendChild(footer);

let direction = -1;

function runCrew() {
  direction = -direction;
  strip.dataset.direction = direction > 0 ? 'ltr' : 'rtl';

  const svgs = Array.from(strip.querySelectorAll('svg'));
  const count = 1 + Math.floor(Math.random() * svgs.length);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let longest = 0;
  svgs.forEach((svg, i) => {
    const included = i < count;
    svg.style.display = included ? '' : 'none';
    if (!included) return;
    const delay = i === 0 ? 0 : Math.round(i * 320 + Math.random() * 600);
    const duration = reduce
      ? 9000
      : Math.round(RUN_MS * (0.85 + Math.random() * 0.35));
    svg.style.animationDelay = `${delay}ms`;
    svg.style.animationDuration = `${duration}ms`;
    svg.style.setProperty('--bob-duration', `${200 + Math.round(Math.random() * 120)}ms`);
    svg.style.setProperty('--bob-delay', `-${Math.round(Math.random() * 200)}ms`);
    longest = Math.max(longest, delay + duration);
  });

  strip.classList.remove('is-running');
  void strip.offsetWidth;
  strip.classList.add('is-running');

  setTimeout(() => {
    strip.classList.remove('is-running');
    schedule();
  }, longest + 100);
}

function schedule() {
  const delay =
    MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
  setTimeout(runCrew, delay);
}

// First crossing arrives quickly so readers who reach the bottom
// actually see it; later ones keep the loading screen's rhythm.
setTimeout(runCrew, 1800);
