/**
 * src/audio/spatial.js — venue map position → stereo pan.
 *
 * Phase 2 spatial panning (ASSETS.md §8): each venue's rat voice
 * and ambient bed sit in the stereo field where its pin sits on
 * the map. Pan derives from venues.js mapCoordinates.x, normalized
 * across the actual pin spread (not the full 0–100 canvas) so the
 * westmost pin (JMZ platform) and the eastmost (Mood Ring) reach
 * ±PAN_SPREAD symmetrically and everything else lands
 * proportionally between. Site-wide layers (JMZ rumble, traffic,
 * train passes) stay centered — they are the ground the panned
 * voices sit on. Coordinate tuning in venues.js re-derives the
 * field automatically.
 */
import { venues } from '../content/venues.js';

// Hard left/right reads as synthetic on headphones; 0.65 keeps
// every voice anchored inside the field while staying clearly
// placeable.
const PAN_SPREAD = 0.65;

const xs = Object.values(venues)
  .map((v) => v.mapCoordinates?.x)
  .filter((x) => typeof x === 'number');
const X_CENTER = (Math.min(...xs) + Math.max(...xs)) / 2;
const X_HALF_RANGE = Math.max((Math.max(...xs) - Math.min(...xs)) / 2, 1);

export function panForVenue(venueId) {
  const x = venues[venueId]?.mapCoordinates?.x;
  if (typeof x !== 'number') return 0;
  return ((x - X_CENTER) / X_HALF_RANGE) * PAN_SPREAD;
}
