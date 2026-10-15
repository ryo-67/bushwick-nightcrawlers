/**
 * scripts/render-reviews.js — every review as plain HTML, for
 * reviews.html. The map only shows reviews in cards built by
 * JavaScript, which most crawlers (search and AI) never run; this
 * gives them the same text. One section per review venue, in map
 * order, each with an anchor (reviews.html#<venue id>). The text comes
 * from src/content/ unchanged.
 */

const path = require('path');
const { pathToFileURL } = require('url');

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// The content files are ES modules.
function load(root, file) {
  return import(pathToFileURL(path.join(root, file)).href);
}

function renderReview(review, rat) {
  const meta = `${rat.handle} · ${review.rating} out of 5 stars · ${review.date}`;
  return [
    `  <h3>${escapeHtml(rat.displayName)}</h3>`,
    `  <p class="footnote">${escapeHtml(meta)}</p>`,
    `  <p>${escapeHtml(review.text)}</p>`,
  ];
}

async function renderReviewList(root) {
  const [{ venues }, { reviews }, { rats }, { findReviewsForVenue }] = await Promise.all([
    load(root, 'src/content/venues.js'),
    load(root, 'src/content/reviews.js'),
    load(root, 'src/content/rats.js'),
    load(root, 'src/review-lookup.js'),
  ]);
  const sections = Object.values(venues)
    .filter((venue) => venue.kind === 'review')
    .map((venue) => [
      `<section class="about-section" id="${venue.id}">`,
      `  <h2>${escapeHtml(venue.displayName)}</h2>`,
      ...findReviewsForVenue(venue.id, reviews).flatMap((review) =>
        renderReview(review, rats[review.reviewerId])
      ),
      '</section>',
    ]);
  return sections.map((lines) => lines.join('\n')).join('\n\n');
}

module.exports = { renderReviewList };
