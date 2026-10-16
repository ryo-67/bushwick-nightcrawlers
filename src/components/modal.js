import { Oscilloscope } from './oscilloscope.js';
import { RAT_PATH_D, RAT_VIEWBOX } from './rat-silhouette.js';
import { buildRedactedPhoto } from './redacted-photo.js';
import { KEYS, readFlag, writeFlag, readLocal, writeLocal } from '../storage.js';
import { getReactionCounts, postReaction } from './reactions-client.js';
import { prefersReducedMotion } from '../device.js';
import { splitTokens, isSpace } from '../audio/normalize.js';

// Alley modal framing line — describes the alley's social function,
// not its location. Edit this single line to change the framing copy.
const ALLEY_MEET_FRAMING = 'where the rats meet';
// Modern Yelp's reaction set, in the site's lowercase voice — the
// reactions are real visitors reaching across the fourth wall, so
// the options read as human responses to a rat's review ('oh no'
// carrying most of the weight). Shaky hand-line icons in 24×24
// viewBoxes.
const REACTIONS = [
  {
    type: 'helpful',
    label: 'helpful',
    // Lightbulb.
    icon: '<path d="M12 3.3 C15.6 3.2 18.3 5.9 18.2 9.2 C18.2 11.4 17 12.8 15.9 14.1 C15.3 14.8 15 15.6 14.9 16.4 L9.2 16.3 C9.1 15.5 8.8 14.8 8.2 14.1 C7.1 12.8 5.9 11.4 5.9 9.1 C5.9 5.8 8.5 3.4 12 3.3 Z M9.7 19.1 L14.4 19 M10.4 21.3 L13.7 21.2"/>',
  },
  {
    type: 'thanks',
    label: 'leave crumb',
    labelActive: 'left a crumb',
    // A crumb: irregular morsel with specks.
    icon: '<path d="M4.8 16.2 C2.9 13.8 3.5 10.4 5.9 8.4 L10.9 4.4 C13.4 2.5 17 3.1 18.8 5.6 C20 7.2 20.2 9.3 19.4 11.1 C20.9 11.8 21.8 13.4 21.5 15.2 C21.1 17.7 18.7 19.4 16.2 19.1 L8.9 18.2 C7.3 18 5.8 17.4 4.8 16.2 Z M9.8 9.5 L9.9 9.6 M14.1 8.2 L14.2 8.3 M12.5 13.8 L12.6 13.9"/>',
  },
  {
    type: 'love',
    label: 'love this',
    // Heart.
    icon: '<path d="M12 20.6 C6.6 16.4 3.1 13.2 3.2 9.3 C3.3 6.7 5.3 4.7 7.7 4.8 C9.5 4.9 11 6 12 7.6 C13 6 14.5 4.9 16.3 4.8 C18.7 4.7 20.8 6.8 20.7 9.4 C20.6 13.3 17.4 16.5 12 20.6 Z"/>',
  },
  {
    type: 'ohno',
    label: 'oh no',
    // Worried face: raised brows, small o mouth.
    icon: '<path d="M12 3.5 C16.7 3.4 20.5 7.3 20.4 12 C20.3 16.7 16.6 20.5 12 20.4 C7.4 20.3 3.6 16.6 3.7 12 C3.8 7.4 7.4 3.6 12 3.5 Z M8.3 9.7 L9.9 9.8 M14.1 9.6 L15.7 9.7 M12 14.4 C13.2 14.4 13.4 16.8 12 16.8 C10.7 16.8 10.9 14.4 12 14.4 Z"/>',
  },
];

// Praying hands for the Rash tombstone's pay-respects button —
// two pressed palms, fingers up, with the emoji's little light rays.
// Same shaky hand-line dialect as the reaction icons above.
const PRAY_ICON_PATH =
  '<path d="M11.6 3.6 C11.6 7.2 10 9.2 8.4 11.2 C7 13 6.6 15.4 7.4 17.6 L8.6 20.4 ' +
  'M12.4 3.6 C12.4 7.2 14 9.2 15.6 11.2 C17 13 17.4 15.4 16.6 17.6 L15.4 20.4 ' +
  'M6 6.6 L7.2 7.6 M18 6.6 L16.8 7.6"/>';

const RESPECTS = {
  type: 'respects',
  label: 'pay respects',
  labelActive: 'respects paid',
  icon: PRAY_ICON_PATH,
};

// Yelp-style boxed stars: a row of filled squares with the star
// knocked out (see .star CSS — the wobble lives there). Used by
// the per-review rating row and the venue aggregate line.
export function buildStarRow(rating, { small = false } = {}) {
  const stars = document.createElement('span');
  stars.className = small ? 'star-rating star-rating-small' : 'star-rating';
  stars.setAttribute('aria-label', `${rating} out of 5 stars`);
  for (let i = 0; i < 5; i += 1) {
    const star = document.createElement('span');
    star.className = i < rating ? 'star' : 'star star-empty';
    star.setAttribute('aria-hidden', 'true');
    stars.appendChild(star);
  }
  return stars;
}

// SoundCloud-embed-style transport icons for the waveform player.
const PLAY_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
  '<path d="M8.2 5.4 L19 12 L8.2 18.6 Z" fill="currentColor"/></svg>';
const PAUSE_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
  '<path d="M7.4 5.6h3.6v12.8H7.4z M13.2 5.6h3.6v12.8h-3.6z" fill="currentColor"/></svg>';

// The play button's three states. The card builds it 'loading';
// main.js moves it to 'idle' once the audio engine is up.
const PLAY_STATES = {
  loading: { disabled: true, icon: PLAY_ICON, label: 'Play review (audio loading)', title: 'audio loading…' },
  idle: { disabled: false, icon: PLAY_ICON, label: 'Play review', title: '' },
  playing: { disabled: false, icon: PAUSE_ICON, label: 'Pause review', title: '' },
};

function renderPlayButton(btn, state) {
  const { disabled, icon, label, title } = PLAY_STATES[state];
  btn.disabled = disabled;
  btn.innerHTML = icon;
  btn.setAttribute('aria-label', label);
  btn.title = title;
}

// Compact tallies: 999 → then 1k, 1.1k, 12k, 1m, 1.1b… One
// decimal below 10 units, floor above. Optimism about the rat
// internet, encoded for completeness.
export function formatCount(n) {
  if (n < 1000) return String(n);
  const units = [
    [1e9, 'b'],
    [1e6, 'm'],
    [1e3, 'k'],
  ];
  for (const [div, suffix] of units) {
    if (n >= div) {
      const v = n / div;
      if (v >= 10) return `${Math.floor(v)}${suffix}`;
      const one = (Math.floor(v * 10) / 10).toFixed(1).replace(/\.0$/, '');
      return `${one}${suffix}`;
    }
  }
  return String(n);
}

function reactionIconSvg(pathMarkup) {
  return (
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" ' +
    'fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    pathMarkup +
    '</svg>'
  );
}

// First-visit hint above the alley mini-cards. Auto-dismisses on
// first card click OR after the timeout, whichever first. Persisted
// so subsequent alley-modal opens skip the hint entirely.
const ALLEY_HINT_TIMEOUT_MS = 8000;
const ALLEY_HINT_FADE_MS = 800;
const ALLEY_HINT_TEXT = 'tap any card to add the rat to the alley.';

function hasSeenAlleyHint() {
  return readFlag(KEYS.alleyHintSeen);
}

function markAlleyHintSeen() {
  writeFlag(KEYS.alleyHintSeen, true);
}

function readHasReacted(reviewId, type) {
  return readFlag(KEYS.reacted(reviewId, type));
}

function writeHasReacted(reviewId, type, value) {
  writeFlag(KEYS.reacted(reviewId, type), value);
}

function readCount(reviewId, type) {
  const n = parseInt(readLocal(KEYS.reactionCount(reviewId, type)), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function writeCount(reviewId, type, count) {
  writeLocal(KEYS.reactionCount(reviewId, type), count);
}

// Shared social counts. The server (api/reactions.js) is
// the source of truth when it answers — every visitor sees the
// accumulated tallies. localStorage keeps exactly two jobs:
// remembering whether YOU reacted (the no-account dedup), and
// serving as the count store when the API is absent (local dev on
// the static server, or a store outage).
//
// One row per review (or memorial): its chips share the count state
// and switch from local to shared counts together when the server
// first answers.
function createReactionRow(targetId) {
  const row = { shared: false, counts: {}, countEls: new Map() };
  row.count = (type) => (row.shared ? row.counts[type] ?? 0 : readCount(targetId, type));
  row.render = () => {
    for (const [type, el] of row.countEls) setCountText(el, row.count(type));
  };
  row.adopt = (counts) => {
    row.shared = true;
    Object.assign(row.counts, counts);
    row.render();
  };
  return row;
}

function setCountText(el, n) {
  const text = formatCount(n);
  el.textContent = text;
  // Reserve whole-character width so 0↔1 (or 9↔10 within the same
  // length) can't resize the chip.
  el.style.minWidth = `${text.length}ch`;
}

// One reaction chip: icon, state-swapped label, count. Toggles your
// own reaction; with the server reachable it bumps the shared count
// optimistically, then reconciles with the server's tally.
function buildReactionChip(row, targetId, { type, label, labelActive, icon }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'review-reaction';

  const iconEl = document.createElement('span');
  iconEl.className = 'reaction-icon';
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.innerHTML = reactionIconSvg(icon);
  btn.appendChild(iconEl);

  const labelEl = document.createElement('span');
  labelEl.className = 'reaction-label';
  btn.appendChild(labelEl);

  const countEl = document.createElement('span');
  countEl.className = 'reaction-count';
  btn.appendChild(countEl);
  row.countEls.set(type, countEl);
  setCountText(countEl, row.count(type));

  // State-swapped copy (e.g. "leave crumb" → "left a crumb"). The
  // hidden ::after (reading data-alt) always carries the OPPOSITE
  // state's copy, so the box width is max(both labels) in real
  // pixels and toggling can't reflow the row.
  const renderState = (active) => {
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    labelEl.textContent = active && labelActive ? labelActive : label;
    labelEl.dataset.alt = active ? label : labelActive || label;
  };
  renderState(readHasReacted(targetId, type));

  btn.addEventListener('click', () => {
    const nextActive = !readHasReacted(targetId, type);
    const step = nextActive ? 1 : -1;
    writeHasReacted(targetId, type, nextActive);
    renderState(nextActive);

    if (row.shared) {
      row.counts[type] = Math.max(0, (row.counts[type] ?? 0) + step);
      row.render();
      // A refusal (rate limit / outage) leaves the optimistic value
      // for this session; the next fetch reconciles.
      postReaction(targetId, type, step).then(row.adopt).catch(() => {});
    } else {
      writeCount(targetId, type, Math.max(0, readCount(targetId, type) + step));
      row.render();
    }
  });
  return btn;
}

// A row of reaction chips for one target: starts on local counts and
// adopts the shared tallies when the API answers.
function buildReactionBar(targetId, specs, className) {
  const element = document.createElement('div');
  element.className = className;
  const row = createReactionRow(targetId);
  for (const spec of specs) element.appendChild(buildReactionChip(row, targetId, spec));
  getReactionCounts(targetId).then(row.adopt).catch(() => {});
  return { element, row };
}

// Returns all reviews for a venue in reviews.js insertion order
// (primary first by convention — reviews.js was authored that way).
export function findReviewsForVenue(venueId, reviews) {
  return Object.values(reviews).filter((r) => r.venueId === venueId);
}

function buildVenuePhoto(venue) {
  if (!venue.photoPath) {
    return venue.photoRedacted
      ? buildRedactedPhoto(venue.photoRedacted, 'modal-venue-photo')
      : null;
  }
  const wrap = document.createElement('figure');
  wrap.className = 'modal-venue-photo';
  const img = document.createElement('img');
  img.src = venue.photoPath;
  img.alt = '';
  img.loading = 'lazy';
  img.addEventListener('error', () => wrap.remove());
  wrap.appendChild(img);
  return wrap;
}

// Splits with splitTokens, as RatGenerator's tokenize() does, so span i
// is the word the voice schedules as i. Returns the spans in order.
function appendReviewBodyWithWordSpans(parent, text) {
  const words = [];
  for (const token of splitTokens(text)) {
    if (isSpace(token)) {
      parent.appendChild(document.createTextNode(token));
      continue;
    }
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = token;
    parent.appendChild(span);
    words.push(span);
  }
  return words;
}

export class Modal {
  constructor(root, content, hooks = {}) {
    this.root = root;
    this.content = content;
    this.onOpen = hooks.onOpen || null;
    this.onClose = hooks.onClose || null;
    this.onAlleyCardClick = hooks.onAlleyCardClick || null;
    this.currentVenueId = null;
    this.currentReviewerId = null;
    this.currentVenueReviews = null;
    this.currentReviewIndex = 0;
    this.previousFocus = null;
    this.oscilloscope = null;
    this.alleyHintTimer = null;
    // The current review's word spans, and the one lit by the voice.
    this.wordEls = null;
    this.activeWordEl = null;
    this.bind();
  }

  bind() {
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) this.close();
    });

    document.addEventListener('keydown', (event) => {
      if (!this.isOpen()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
        return;
      }
      // Arrow keys page through reviews when the venue has several.
      if (this.currentVenueReviews && this.currentVenueReviews.length >= 2) {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          this.switchReviewBy(1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          this.switchReviewBy(-1);
        }
      }
    });
  }

  isOpen() {
    return this.root.dataset.state === 'open';
  }

  open(venueId) {
    const venue = this.content.venues[venueId];
    if (!venue) return;

    this.previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.currentVenueId = venueId;

    const allReviews = findReviewsForVenue(venue.id, this.content.reviews);
    const review = allReviews[0] || null;
    const reviewer = review ? this.content.rats[review.reviewerId] : null;
    this.currentVenueReviews = allReviews;
    this.currentReviewIndex = 0;
    this.currentReviewerId = review ? review.reviewerId : null;

    this.root.replaceChildren();

    // The card follows the venue's kind (see venues.js).
    const card = {
      review: () => this.buildReviewCard(venue, reviewer, review, allReviews),
      gathering: () => this.buildAlleyCard(venue),
      memorial: () => this.buildTombstoneCard(venue),
    }[venue.kind]();
    this.root.appendChild(card);

    this.root.dataset.state = 'open';
    this.root.setAttribute('aria-hidden', 'false');

    Array.from(document.body.children).forEach((child) => {
      if (child !== this.root) child.setAttribute('inert', '');
    });

    const close = card.querySelector('.modal-close');
    close?.focus();

    this.onOpen?.(venueId, { review, reviewer });
  }

  close() {
    if (!this.isOpen()) return;

    this.onClose?.();

    this.root.dataset.state = 'closed';
    this.root.setAttribute('aria-hidden', 'true');
    this.root.replaceChildren();

    Array.from(document.body.children).forEach((child) => {
      child.removeAttribute('inert');
    });

    this.disposeOscilloscope();
    clearTimeout(this.alleyHintTimer);
    this.wordEls = null;
    this.activeWordEl = null;
    this.currentVenueId = null;
    this.currentReviewerId = null;
    this.currentVenueReviews = null;
    this.currentReviewIndex = 0;

    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }

  // The oscilloscope is only a Tone.Waveform analyser on the mix, so
  // disposing it on close is fine (unlike the rats' audio nodes).
  disposeOscilloscope() {
    this.oscilloscope?.dispose();
    this.oscilloscope = null;
  }

  setPlayState(state) {
    const btn = this.root.querySelector('.play-button');
    if (btn) renderPlayButton(btn, state);
  }

  // Gated by reviewerId so cumulative-voicing background rats can't
  // hit the currently-displayed review's word spans. Stale callbacks
  // from a closed-modal rat (or a rat from a previous modal instance)
  // pass a reviewerId that no longer matches and no-op out.
  // The word spans are kept from populateReviewContent, so each
  // Tone.Draw callback swaps one class instead of querying the DOM.
  highlightWord(index, fromReviewerId) {
    if (fromReviewerId !== this.currentReviewerId) return;
    this.activeWordEl?.classList.remove('is-active');
    this.activeWordEl = this.wordEls?.[index] ?? null;
    this.activeWordEl?.classList.add('is-active');
  }

  clearHighlights(fromReviewerId) {
    if (fromReviewerId !== this.currentReviewerId) return;
    this.activeWordEl?.classList.remove('is-active');
    this.activeWordEl = null;
  }

  // Page-switch: UI only. Does NOT touch audio state — any playing rat
  // continues in the engine's registry; the new review's PLAY button,
  // when pressed, registers a new rat alongside per cumulative voicing.
  switchReview(newIndex) {
    if (!this.currentVenueReviews) return;
    if (newIndex === this.currentReviewIndex) return;
    if (newIndex < 0 || newIndex >= this.currentVenueReviews.length) return;

    // Clear highlights from the OUTGOING review BEFORE swapping the id.
    // The clearHighlights gate matches against this.currentReviewerId,
    // so the call must happen while it still references the old reviewer.
    this.clearHighlights(this.currentReviewerId);

    this.currentReviewIndex = newIndex;
    const newReview = this.currentVenueReviews[newIndex];
    const newReviewer = this.content.rats[newReview.reviewerId];
    this.currentReviewerId = newReview.reviewerId;

    const venue = this.content.venues[this.currentVenueId];
    const container = this.root.querySelector('.review-content');
    if (container && venue && newReviewer) {
      this.populateReviewContent(container, venue, newReviewer, newReview);
    }

    // Update pagination counter text. The reviewer name is intentionally
    // NOT shown here — the counter is the only navigation surface, so
    // cameo reveals stay surprising until the card renders.
    const counter = this.root.querySelector('.pagination-counter');
    if (counter) {
      counter.textContent = `${newIndex + 1} of ${this.currentVenueReviews.length}`;
    }

    // Re-fire onOpen so main.js rebinds the PLAY button + audio
    // wiring to the new review. handleModalOpen is idempotent for
    // same-venue calls (markVisited / startVenueBed both no-op) and
    // intentionally releases its modal-side ratGen reference, letting
    // any previously-playing rat continue in the engine registry.
    this.onOpen?.(this.currentVenueId, { review: newReview, reviewer: newReviewer });
  }

  switchReviewBy(delta) {
    if (!this.currentVenueReviews) return;
    const len = this.currentVenueReviews.length;
    if (len < 2) return;
    // Wrap negatives correctly: ((-1 % 2) + 2) % 2 === 1
    const next = ((this.currentReviewIndex + delta) % len + len) % len;
    this.switchReview(next);
  }

  buildCardShell(ariaLabel) {
    const card = document.createElement('div');
    card.className = 'modal-card';
    this.root.setAttribute('aria-label', ariaLabel);
    return card;
  }

  // Build a sticky-header h1 wrapping the title text, the close
  // button, and (on mobile) a drag-handle affordance. Each builder
  // calls this instead of constructing the headline inline so the
  // structure stays consistent across the review / alley /
  // tombstone variants. Caller is responsible for appending the
  // returned node to the card.
  buildModalHeadline(titleText) {
    const headline = document.createElement('h1');
    headline.className = 'modal-venue-headline';

    const handle = document.createElement('div');
    handle.className = 'modal-sheet-handle';
    handle.setAttribute('aria-hidden', 'true');
    headline.appendChild(handle);

    const row = document.createElement('div');
    row.className = 'modal-venue-headline-row';
    const text = document.createElement('span');
    text.className = 'modal-venue-headline-text';
    text.textContent = titleText;
    row.appendChild(text);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'modal-close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.addEventListener('click', () => this.close());
    row.appendChild(close);

    headline.appendChild(row);
    return headline;
  }

  buildReviewPagination(allReviews) {
    const wrap = document.createElement('div');
    wrap.className = 'review-pagination';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Review navigation');

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'pagination-arrow';
    prev.dataset.direction = 'prev';
    prev.setAttribute('aria-label', 'Previous review');
    prev.textContent = '←';
    prev.addEventListener('click', () => this.switchReviewBy(-1));

    const counter = document.createElement('span');
    counter.className = 'pagination-counter';
    counter.setAttribute('aria-live', 'polite');
    counter.textContent = `${this.currentReviewIndex + 1} of ${allReviews.length}`;

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'pagination-arrow';
    next.dataset.direction = 'next';
    next.setAttribute('aria-label', 'Next review');
    next.textContent = '→';
    next.addEventListener('click', () => this.switchReviewBy(1));

    wrap.append(prev, counter, next);
    return wrap;
  }

  buildReviewCard(venue, reviewer, review, allReviews) {
    const card = this.buildCardShell(`Review of ${venue.displayName} by ${reviewer.displayName}`);

    const headline = this.buildModalHeadline(venue.displayName);
    card.appendChild(headline);

    // No venue aggregate — with at most two reviews per venue
    // an average reads as filler, not information.
    const reviewContent = document.createElement('div');
    reviewContent.className = 'review-content';
    card.appendChild(reviewContent);
    this.populateReviewContent(reviewContent, venue, reviewer, review);

    // Pagination lives at the END of the reviews, Yelp-style, as a
    // bar pinned to the card's visible bottom edge (sticky within
    // the card scroll context) — consistent with the page footer's
    // bar treatment. Mobile CSS lifts it to the top of the sheet.
    if (allReviews.length >= 2) {
      card.appendChild(this.buildReviewPagination(allReviews));
    }

    return card;
  }

  populateReviewContent(container, venue, reviewer, review) {
    // The old review's analyser goes before its DOM is replaced.
    this.disposeOscilloscope();
    container.replaceChildren();

    const reviewerBlock = document.createElement('header');
    reviewerBlock.className = 'reviewer-block';

    const selfie = document.createElement('img');
    selfie.className = 'rat-selfie';
    selfie.src = reviewer.selfiePath;
    selfie.alt = '';
    selfie.loading = 'lazy';
    reviewerBlock.appendChild(selfie);

    const info = document.createElement('div');
    info.className = 'reviewer-info';

    const meta = document.createElement('div');
    meta.className = 'reviewer-meta';

    // Name / handle / stars stacked in the meta cluster, with the
    // play + oscilloscope player beneath it (see .reviewer-info).
    // The date lives in the meta line under the review, alongside
    // the squeaks count.
    const name = document.createElement('h2');
    name.className = 'reviewer-name';
    name.textContent = reviewer.displayName;
    meta.appendChild(name);

    const handle = document.createElement('p');
    handle.className = 'reviewer-handle';
    handle.textContent = reviewer.handle;
    meta.appendChild(handle);

    const ratingRow = document.createElement('div');
    ratingRow.className = 'review-rating';
    ratingRow.appendChild(buildStarRow(review.rating));
    meta.appendChild(ratingRow);

    // No per-review location line — every rat is from
    // Bushwick; repeating it under each name was filler.
    if (reviewer.elite) {
      // Yelp Elite badge, house style: gold rat mark + year chip
      // (ASSETS §1.5 called for exactly this silhouette).
      const elite = document.createElement('span');
      elite.className = 'reviewer-elite';
      elite.innerHTML =
        `<svg viewBox="${RAT_VIEWBOX}" width="18" height="9" aria-hidden="true">` +
        `<path d="${RAT_PATH_D}" fill="currentColor" fill-rule="evenodd"/></svg>` +
        `<span>elite &rsquo;26</span>`;
      meta.appendChild(elite);
    }

    info.appendChild(meta);

    // SoundCloud-embed-style player — the waveform canvas is
    // the player surface, with an icon play/pause button overlaid
    // at its left edge.
    const oscPlayer = document.createElement('div');
    oscPlayer.className = 'osc-player';

    this.oscilloscope = new Oscilloscope();
    oscPlayer.appendChild(this.oscilloscope.element);

    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'play-button';
    renderPlayButton(play, 'loading');
    oscPlayer.appendChild(play);

    info.appendChild(oscPlayer);

    reviewerBlock.appendChild(info);
    container.appendChild(reviewerBlock);

    const body = document.createElement('p');
    body.className = 'review-body';
    this.wordEls = appendReviewBodyWithWordSpans(body, review.text);
    this.activeWordEl = null;
    const wordCount = this.wordEls.length;
    container.appendChild(body);

    // One combined meta line under the review.
    const metaRow = document.createElement('p');
    metaRow.className = 'review-meta-row';
    const metaLine = document.createElement('span');
    metaLine.className = 'review-date';
    metaLine.textContent = `${review.date} · Translated from ${formatCount(wordCount)} squeaks`;
    metaRow.appendChild(metaLine);
    container.appendChild(metaRow);

    container.appendChild(this.buildReactions(review));
  }

  buildReactions(review) {
    const reviewId = review.reviewerId;
    const { element: reactions, row } = buildReactionBar(reviewId, REACTIONS, 'review-reactions');

    // The report analogue — Yelp's "Report review", in city terms.
    // No public tally; the count lands server-side all the same.
    // Clicking again takes the report back.
    const report = document.createElement('button');
    report.type = 'button';
    report.className = 'review-report';
    report.dataset.alt = 'report to 311';
    const renderReport = (reported) => {
      report.textContent = reported ? 'reported' : 'report to 311';
      report.classList.toggle('is-active', reported);
      report.setAttribute('aria-pressed', reported ? 'true' : 'false');
    };
    renderReport(readHasReacted(reviewId, 'report'));
    report.addEventListener('click', () => {
      const next = !readHasReacted(reviewId, 'report');
      writeHasReacted(reviewId, 'report', next);
      renderReport(next);
      if (row.shared) postReaction(reviewId, 'report', next ? 1 : -1).catch(() => {});
    });

    // Report rides the chip row itself — far right, vertically
    // centered against the chips. (No tally line — the counts live
    // in the chips.)
    reactions.appendChild(report);
    return reactions;
  }

  buildAlleyCard(venue) {
    const card = this.buildCardShell(`${venue.displayName} — ${ALLEY_MEET_FRAMING}`);
    card.classList.add('alley-modal');

    // Title bar: headline + close + (mobile) drag handle, a direct
    // child of the card so the mobile sheet's position:sticky pins
    // it across the full scroll range. Photo + framing live in
    // .alley-header below and scroll with the card list, one scroll
    // context at every width.
    const name = this.buildModalHeadline(venue.displayName);
    card.appendChild(name);

    const header = document.createElement('div');
    header.className = 'alley-header';

    const photo = buildVenuePhoto(venue);
    if (photo) header.appendChild(photo);

    const framing = document.createElement('p');
    framing.className = 'venue-framing';
    framing.textContent = ALLEY_MEET_FRAMING;
    header.appendChild(framing);

    card.appendChild(header);

    const oneLiners = this.content.alleyOneLiners || [];

    // First-visit hint sits as a sibling between .alley-header and
    // .alley-cards, with its own margins, so it reads as a divider
    // rather than a caption on either zone. FLIP reorder iterates
    // `.alley-card` only, so the hint stays put during sorting.
    if (!hasSeenAlleyHint()) {
      const hint = document.createElement('p');
      hint.className = 'alley-cards-hint';
      hint.textContent = ALLEY_HINT_TEXT;
      card.appendChild(hint);

      let dismissed = false;
      const dismissHint = () => {
        if (dismissed) return;
        dismissed = true;
        markAlleyHintSeen();
        hint.classList.add('is-fading');
        setTimeout(() => hint.remove(), ALLEY_HINT_FADE_MS + 50);
      };

      // Cleared on close, so a hint closed early isn't marked seen.
      this.alleyHintTimer = setTimeout(dismissHint, ALLEY_HINT_TIMEOUT_MS);
      card.addEventListener('click', (e) => {
        if (e.target.closest('.alley-card')) dismissHint();
      });
    }

    const cards = document.createElement('div');
    cards.className = 'alley-cards';
    for (const oneLiner of oneLiners) {
      const reviewer = this.content.rats[oneLiner.reviewerId];
      if (!reviewer) continue;
      cards.appendChild(this.buildAlleyMiniCard(oneLiner, reviewer));
    }
    card.appendChild(cards);

    return card;
  }

  buildAlleyMiniCard(oneLiner, reviewer) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'alley-card';
    btn.dataset.reviewerId = oneLiner.reviewerId;
    btn.setAttribute(
      'aria-label',
      `Play ${reviewer.displayName}'s alley one-liner`
    );

    const selfie = document.createElement('img');
    selfie.className = 'alley-card-selfie';
    selfie.src = reviewer.selfiePath;
    selfie.alt = '';
    selfie.loading = 'lazy';
    selfie.addEventListener('error', () => {
      selfie.style.display = 'none';
    });
    btn.appendChild(selfie);

    const body = document.createElement('div');
    body.className = 'alley-card-body';

    const name = document.createElement('div');
    name.className = 'alley-card-name';
    name.textContent = reviewer.displayName;
    body.appendChild(name);

    const stars = document.createElement('div');
    stars.className = 'alley-card-stars';
    stars.setAttribute('aria-label', `${oneLiner.rating} out of 5 stars`);
    stars.textContent = '★'.repeat(oneLiner.rating);
    body.appendChild(stars);

    const text = document.createElement('div');
    text.className = 'alley-card-text';
    text.textContent = oneLiner.text;
    body.appendChild(text);

    btn.appendChild(body);

    // Speaker glyph affordance: dim by default, bright on hover,
    // solid when the card's rat is active in the registry. Lives
    // in the corner so it doesn't compete with the body content.
    const speaker = document.createElement('span');
    speaker.className = 'alley-card-speaker';
    speaker.setAttribute('aria-hidden', 'true');
    speaker.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M3 6h2l3-3v10l-3-3H3z" fill="currentColor"/>
      <path d="M11 5q2 3 0 6" stroke="currentColor" stroke-width="1" fill="none"/>
    </svg>`;
    btn.appendChild(speaker);

    btn.addEventListener('click', () => {
      this.onAlleyCardClick?.(oneLiner.reviewerId);
    });

    return btn;
  }

  // Called by main.js whenever the engine's active-rats registry
  // changes. rankMap: { [reviewerId]: rank }, rank 0 = foreground.
  // Cards not in the map return to idle state. FLIP-animates the
  // mini-cards into a new visual order: active cards first by rank
  // ascending, inactive cards trail in original document order.
  setAlleyCardStates(rankMap) {
    const container = this.root.querySelector('.alley-cards');
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.alley-card'));

    for (const cardEl of cards) {
      const id = cardEl.dataset.reviewerId;
      const rank = rankMap[id];
      if (typeof rank === 'number') {
        cardEl.dataset.rank = String(rank);
        cardEl.classList.add('is-active');
      } else {
        delete cardEl.dataset.rank;
        cardEl.classList.remove('is-active');
      }
    }

    this.reorderAlleyCards(container, cards, rankMap);
  }

  // FLIP reorder. Captures current visual rects (works correctly even
  // mid-flight from a previous reorder, since getBoundingClientRect
  // reads live transforms), reorders the DOM, applies inverse
  // transforms in one frame, then plays the transition back to
  // identity in the next frame. Bails on no-op reorders so calls that
  // change rank attributes without changing card order don't trigger
  // a transition.
  reorderAlleyCards(container, cards, rankMap) {
    if (cards.length === 0) return;

    const beforeRects = new Map();
    for (const cardEl of cards) {
      beforeRects.set(cardEl, cardEl.getBoundingClientRect());
    }

    const originalIndex = new Map();
    cards.forEach((c, i) => originalIndex.set(c, i));

    const sorted = [...cards].sort((a, b) => {
      const aRank = rankMap[a.dataset.reviewerId];
      const bRank = rankMap[b.dataset.reviewerId];
      const aActive = typeof aRank === 'number';
      const bActive = typeof bRank === 'number';
      if (aActive && bActive) return aRank - bRank;
      if (aActive) return -1;
      if (bActive) return 1;
      return originalIndex.get(a) - originalIndex.get(b);
    });

    let changed = false;
    for (let i = 0; i < cards.length; i += 1) {
      if (cards[i] !== sorted[i]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;

    for (const cardEl of sorted) container.appendChild(cardEl);

    if (prefersReducedMotion()) return;

    for (const cardEl of sorted) {
      const before = beforeRects.get(cardEl);
      if (!before) continue;
      const after = cardEl.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (dx === 0 && dy === 0) continue;
      cardEl.classList.add('is-flipping');
      cardEl.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    // Two rAFs: first commits the inverted transform without painting
    // a transition; second removes the class so the transition runs
    // back to identity. One rAF is sometimes coalesced by the browser
    // and the inverse phase doesn't take effect — two is the reliable
    // pattern for FLIP across Chromium / WebKit / Firefox.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        for (const cardEl of sorted) {
          cardEl.classList.remove('is-flipping');
          cardEl.style.transform = '';
        }
      });
    });
  }

  buildTombstoneCard(venue) {
    const card = this.buildCardShell(`${venue.displayName} (closed)`);
    // Tombstone variant: short content (photo + closure label +
    // optional epitaph), so the mobile sheet sizes to content
    // rather than filling the viewport. Hook via the modifier class —
    // mobile CSS overrides height/max-height for this class.
    card.classList.add('modal-card-tombstone');

    const name = this.buildModalHeadline(venue.displayName);
    // The review anatomy, dead. Empty aggregate rides the
    // headline row itself — title, stars, close — so the header
    // reads as one line on every breakpoint.
    const rating = document.createElement('span');
    rating.className = 'tombstone-rating';
    rating.appendChild(buildStarRow(0, {}));
    const headlineRow = name.querySelector('.modal-venue-headline-row');
    headlineRow.insertBefore(rating, headlineRow.querySelector('.modal-close'));
    card.appendChild(name);

    const photo = buildVenuePhoto(venue);
    if (photo) {
      // The closure label as a stamp across the photo's corner —
      // condemnation-notice red, tilted like the peeks.
      const stamp = document.createElement('span');
      stamp.className = 'tombstone-closed-stamp';
      stamp.textContent = venue.closedNote;
      photo.appendChild(stamp);
      card.appendChild(photo);
    } else {
      const closed = document.createElement('p');
      closed.className = 'venue-closed-note';
      closed.textContent = venue.closedNote;
      card.appendChild(closed);
    }

    // Optional epitaph (Rash currently the only tombstone). Array
    // of strings → one <p> per paragraph; the last paragraph
    // renders at full opacity (the punchline closer), others at
    // 0.85 — see .tombstone-epitaph p:last-child in styles.css.
    if (Array.isArray(venue.tombstoneEpitaph) && venue.tombstoneEpitaph.length) {
      const epitaph = document.createElement('div');
      epitaph.className = 'tombstone-epitaph';
      for (const para of venue.tombstoneEpitaph) {
        const p = document.createElement('p');
        p.textContent = para;
        epitaph.appendChild(p);
      }
      card.appendChild(epitaph);
    }

    card.appendChild(this.buildRespects(venue.id));

    return card;
  }

  // The tombstone's single reaction — a literal pay-respects
  // button, keyed by venue id ('rash') since there's no reviewer.
  buildRespects(memorialId) {
    return buildReactionBar(memorialId, [RESPECTS], 'review-reactions tombstone-respects').element;
  }
}
