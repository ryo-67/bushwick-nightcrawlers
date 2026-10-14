/**
 * src/components/about-rats.js — the scuttle crew closes the About
 * page, crossing a footer strip on the loading screen's rhythm (see
 * rat-crew.js). Loaded only by about.html.
 */
import { buildRatCrew, runRatCrew } from './rat-crew.js';

const MIN_INTERVAL_MS = 7000;
const MAX_INTERVAL_MS = 12000;

const footer = document.createElement('footer');
footer.className = 'about-rat-footer';
footer.setAttribute('aria-hidden', 'true');
const strip = buildRatCrew();
footer.appendChild(strip);
document.body.appendChild(footer);

let direction = -1;

function runCrew() {
  direction = -direction;
  const longest = runRatCrew(strip, direction);
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
