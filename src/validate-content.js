/**
 * src/validate-content.js — checks at startup that the content files
 * agree with each other, so a mistake in venues.js, reviews.js,
 * rats.js, alley-oneliners.js or rat-profiles.js shows up as a clear
 * console error instead of an odd card or a dead play button. The
 * rest of the code relies on these holding and doesn't re-check them.
 */
import { venues } from './content/venues.js';
import { reviews } from './content/reviews.js';
import { rats } from './content/rats.js';
import { alleyOneLiners } from './content/alley-oneliners.js';
import { ratProfiles } from './audio/rat-profiles.js';

const KINDS = new Set(['review', 'gathering', 'memorial']);

export function validateContent() {
  const problems = [];
  const reviewVenueIds = new Set();

  for (const review of Object.values(reviews)) {
    const venue = venues[review.venueId];
    if (venue?.kind !== 'review') {
      problems.push(`review by ${review.reviewerId} names "${review.venueId}", which isn't a review venue`);
    }
    if (!rats[review.reviewerId]) problems.push(`review rat "${review.reviewerId}" is missing from rats.js`);
    if (!ratProfiles[review.reviewerId]) {
      problems.push(`review rat "${review.reviewerId}" has no voice in rat-profiles.js`);
    }
    reviewVenueIds.add(review.venueId);
  }

  for (const oneLiner of alleyOneLiners) {
    if (!rats[oneLiner.reviewerId]) problems.push(`alley one-liner rat "${oneLiner.reviewerId}" is missing from rats.js`);
    if (!ratProfiles[oneLiner.reviewerId]) {
      problems.push(`alley one-liner rat "${oneLiner.reviewerId}" has no voice in rat-profiles.js`);
    }
  }

  for (const venue of Object.values(venues)) {
    if (!KINDS.has(venue.kind)) problems.push(`venue "${venue.id}" has unknown kind "${venue.kind}"`);
    if (venue.kind === 'review' && !reviewVenueIds.has(venue.id)) {
      problems.push(`review venue "${venue.id}" has no review in reviews.js`);
    }
    if (venue.unlockAfterVisits && !venue.lockedMessage) problems.push(`gated venue "${venue.id}" has no lockedMessage`);
    if (venue.kind === 'memorial' && !venue.closedNote) problems.push(`memorial "${venue.id}" has no closedNote`);
  }

  for (const problem of problems) console.error(`Content: ${problem}`);
}
