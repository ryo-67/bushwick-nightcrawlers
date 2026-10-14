/**
 * src/components/about-rats.js — the scuttle crew closes the About
 * page, crossing a footer strip on the loading screen's rhythm (see
 * rat-crew.js). Loaded only by about.html.
 */
import { buildRatCrew, startRatCrewLoop } from './rat-crew.js';

const footer = document.createElement('footer');
footer.className = 'about-rat-footer';
footer.setAttribute('aria-hidden', 'true');
const strip = buildRatCrew();
footer.appendChild(strip);
document.body.appendChild(footer);

// The first crossing arrives quickly so readers who reach the bottom
// actually see it.
startRatCrewLoop(strip, { minMs: 7000, maxMs: 12000, firstDelayMs: 1800 });
