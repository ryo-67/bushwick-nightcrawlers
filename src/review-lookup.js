/**
 * src/review-lookup.js — finding a venue's reviews. Shared by the
 * browser (pins, review cards) and the build (reviews.html), so it
 * imports nothing.
 */

export function findReviewsForVenue(venueId, reviews) {
  return Object.values(reviews).filter((r) => r.venueId === venueId);
}
