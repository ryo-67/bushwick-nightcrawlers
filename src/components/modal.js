import { Oscilloscope } from './oscilloscope.js';

const REVIEWER_LOCATION = 'Bushwick, Brooklyn';
const ALLEY_FRAMING = 'the alley between Mr Kiwi and the JMZ';
const RASH_CLOSED_NOTE = '[closed February 2026]';
const REACTIONS = [
  { type: 'helpful', label: 'Helpful' },
  { type: 'funny', label: 'Funny' },
  { type: 'cool', label: 'Cool' },
];

function reactedKey(reviewId, type) {
  return `bushwick.reaction.${reviewId}.${type}`;
}

function countKey(reviewId, type) {
  return `bushwick.reactionCount.${reviewId}.${type}`;
}

function readHasReacted(reviewId, type) {
  try {
    return localStorage.getItem(reactedKey(reviewId, type)) === 'true';
  } catch {
    return false;
  }
}

function writeHasReacted(reviewId, type, value) {
  try {
    localStorage.setItem(reactedKey(reviewId, type), value ? 'true' : 'false');
  } catch {
    // localStorage unavailable — state lost on next open
  }
}

function readCount(reviewId, type) {
  try {
    const raw = localStorage.getItem(countKey(reviewId, type));
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeCount(reviewId, type, count) {
  try {
    localStorage.setItem(countKey(reviewId, type), String(count));
  } catch {
    // localStorage unavailable
  }
}

// Returns all reviews for a venue in reviews.js insertion order
// (primary first by convention — reviews.js was authored that way).
function findReviewsForVenue(venueId, reviews) {
  return Object.values(reviews).filter((r) => r.venueId === venueId);
}

function buildVenuePhoto(venue) {
  if (!venue.photoPath) return null;
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

function appendReviewBodyWithWordSpans(parent, text) {
  const tokens = text.split(/(\s+)/);
  let wordIndex = 0;
  tokens.forEach((token) => {
    if (token === '') return;
    if (/^\s+$/.test(token)) {
      parent.appendChild(document.createTextNode(token));
      return;
    }
    const span = document.createElement('span');
    span.className = 'word';
    span.dataset.index = String(wordIndex);
    span.textContent = token;
    parent.appendChild(span);
    wordIndex += 1;
  });
  return wordIndex;
}

export class Modal {
  constructor(root, content, hooks = {}) {
    this.root = root;
    this.content = content;
    this.onOpen = hooks.onOpen || null;
    this.onClose = hooks.onClose || null;
    this.currentVenueId = null;
    this.currentReviewerId = null;
    this.currentVenueReviews = null;
    this.currentReviewIndex = 0;
    this.previousFocus = null;
    this.oscilloscope = null;
    this.bind();
  }

  bind() {
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) this.close();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen()) {
        event.preventDefault();
        this.close();
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

    let card;
    if (venue.id === 'alley') {
      card = this.buildAmbientCard(venue);
    } else if (venue.reviewerId === null) {
      card = this.buildTombstoneCard(venue);
    } else if (reviewer && review) {
      card = this.buildReviewCard(venue, reviewer, review, allReviews);
    } else {
      card = this.buildTombstoneCard(venue);
    }
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

    this.oscilloscope = null;
    this.currentVenueId = null;
    this.currentReviewerId = null;
    this.currentVenueReviews = null;
    this.currentReviewIndex = 0;

    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }

  setPlayState(state) {
    const btn = this.root.querySelector('.play-button');
    if (!btn) return;
    if (state === 'loading') {
      btn.disabled = true;
      btn.textContent = 'Loading…';
      btn.title = 'audio loading…';
    } else if (state === 'idle') {
      btn.disabled = false;
      btn.textContent = 'Play';
      btn.title = '';
    } else if (state === 'playing') {
      btn.disabled = false;
      btn.textContent = 'Pause';
      btn.title = '';
    }
  }

  // Gated by reviewerId so cumulative-voicing background rats can't
  // hit the currently-displayed review's word spans. Stale callbacks
  // from a closed-modal rat (or a rat from a previous modal instance)
  // pass a reviewerId that no longer matches and no-op out.
  highlightWord(index, fromReviewerId) {
    if (fromReviewerId !== this.currentReviewerId) return;
    const active = this.root.querySelectorAll('.word.is-active');
    active.forEach((el) => el.classList.remove('is-active'));
    const target = this.root.querySelector(`.word[data-index="${index}"]`);
    if (target) target.classList.add('is-active');
  }

  clearHighlights(fromReviewerId) {
    if (fromReviewerId !== this.currentReviewerId) return;
    this.root
      .querySelectorAll('.word.is-active')
      .forEach((el) => el.classList.remove('is-active'));
  }

  // Tab-switch: UI only. Does NOT touch audio state — any playing rat
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

    // Update tab strip active state
    const tabs = this.root.querySelectorAll('.reviewer-tab');
    tabs.forEach((tab) => {
      const idx = parseInt(tab.dataset.reviewIndex, 10);
      const active = idx === newIndex;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    // Re-fire onOpen so main.js rebinds the PLAY button + audio
    // wiring to the new review. handleModalOpen is idempotent for
    // same-venue calls (markVisited / startVenueBed both no-op) and
    // intentionally releases its modal-side ratGen reference, letting
    // any previously-playing rat continue in the engine registry.
    this.onOpen?.(this.currentVenueId, { review: newReview, reviewer: newReviewer });
  }

  buildCardShell(ariaLabel) {
    const card = document.createElement('div');
    card.className = 'modal-card';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'modal-close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.addEventListener('click', () => this.close());
    card.appendChild(close);

    if (ariaLabel) this.root.setAttribute('aria-label', ariaLabel);
    return card;
  }

  buildPlayOscBlock(ariaLabel) {
    const wrap = document.createElement('div');
    wrap.className = 'play-osc-block';

    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'play-button';
    play.disabled = true;
    play.title = 'audio loading…';
    play.setAttribute('aria-label', ariaLabel);
    play.textContent = 'Play';
    wrap.appendChild(play);

    this.oscilloscope = new Oscilloscope();
    wrap.appendChild(this.oscilloscope.element);

    return wrap;
  }

  buildReviewerTabs(allReviews) {
    const wrap = document.createElement('div');
    wrap.className = 'reviewer-tabs';
    wrap.setAttribute('role', 'tablist');

    allReviews.forEach((rev, idx) => {
      const reviewer = this.content.rats[rev.reviewerId];
      if (!reviewer) return;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'reviewer-tab';
      tab.setAttribute('role', 'tab');
      tab.dataset.reviewIndex = String(idx);
      const isActive = idx === this.currentReviewIndex;
      if (isActive) tab.classList.add('is-active');
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.textContent = reviewer.displayName;
      tab.addEventListener('click', () => this.switchReview(idx));
      wrap.appendChild(tab);
    });

    return wrap;
  }

  buildReviewCard(venue, reviewer, review, allReviews = [review]) {
    const card = this.buildCardShell(`Review of ${venue.displayName} by ${reviewer.displayName}`);

    const headline = document.createElement('h1');
    headline.className = 'modal-venue-headline';
    headline.textContent = venue.displayName;
    card.appendChild(headline);

    if (allReviews.length >= 2) {
      card.appendChild(this.buildReviewerTabs(allReviews));
    }

    const reviewContent = document.createElement('div');
    reviewContent.className = 'review-content';
    card.appendChild(reviewContent);
    this.populateReviewContent(reviewContent, venue, reviewer, review);

    return card;
  }

  populateReviewContent(container, venue, reviewer, review) {
    // Dispose any existing oscilloscope before its DOM is replaced —
    // otherwise the Tone.Waveform analyser leaks across tab switches.
    if (this.oscilloscope) {
      try {
        this.oscilloscope.dispose();
      } catch {
        // already disposed
      }
      this.oscilloscope = null;
    }
    container.replaceChildren();

    const ratingRow = document.createElement('div');
    ratingRow.className = 'review-rating';

    const stars = document.createElement('span');
    stars.className = 'star-rating';
    stars.setAttribute('aria-label', `${review.rating} out of 5 stars`);
    for (let i = 0; i < 5; i += 1) {
      const star = document.createElement('span');
      star.className = i < review.rating ? 'star' : 'star star-empty';
      star.setAttribute('aria-hidden', 'true');
      stars.appendChild(star);
    }
    ratingRow.appendChild(stars);

    const date = document.createElement('span');
    date.className = 'review-date';
    date.textContent = review.date;
    ratingRow.appendChild(date);

    container.appendChild(ratingRow);

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

    const name = document.createElement('h2');
    name.className = 'reviewer-name';
    name.textContent = reviewer.displayName;
    meta.appendChild(name);

    const handle = document.createElement('p');
    handle.className = 'reviewer-handle';
    handle.textContent = reviewer.handle;
    meta.appendChild(handle);

    const location = document.createElement('p');
    location.className = 'reviewer-location';
    location.textContent = REVIEWER_LOCATION;
    meta.appendChild(location);

    if (reviewer.elite) {
      const elite = document.createElement('span');
      elite.className = 'reviewer-elite';
      elite.textContent = 'Elite';
      meta.appendChild(elite);
    }

    info.appendChild(meta);
    info.appendChild(this.buildPlayOscBlock('Play review (audio loading)'));

    reviewerBlock.appendChild(info);
    container.appendChild(reviewerBlock);

    const body = document.createElement('p');
    body.className = 'review-body';
    const wordCount = appendReviewBodyWithWordSpans(body, review.text);
    container.appendChild(body);

    const squeaks = document.createElement('p');
    squeaks.className = 'review-squeaks';
    squeaks.textContent = `${wordCount} squeaks`;
    container.appendChild(squeaks);

    container.appendChild(this.buildReactions(review));
  }

  buildReactions(review) {
    const reviewId = review.reviewerId;
    const reactions = document.createElement('div');
    reactions.className = 'review-reactions';
    REACTIONS.forEach(({ type, label }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'review-reaction';
      const initialCount = readCount(reviewId, type);
      const initialActive = readHasReacted(reviewId, type);
      btn.textContent = `${label} ${initialCount}`;
      if (initialActive) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.setAttribute('aria-pressed', 'false');
      }
      btn.addEventListener('click', () => {
        const wasActive = readHasReacted(reviewId, type);
        const currentCount = readCount(reviewId, type);
        const nextCount = wasActive ? Math.max(0, currentCount - 1) : currentCount + 1;
        const nextActive = !wasActive;
        writeCount(reviewId, type, nextCount);
        writeHasReacted(reviewId, type, nextActive);
        btn.textContent = `${label} ${nextCount}`;
        btn.classList.toggle('is-active', nextActive);
        btn.setAttribute('aria-pressed', nextActive ? 'true' : 'false');
      });
      reactions.appendChild(btn);
    });
    return reactions;
  }

  buildAmbientCard(venue) {
    const card = this.buildCardShell(`${venue.displayName} (ambient)`);

    const name = document.createElement('h1');
    name.className = 'modal-venue-headline';
    name.textContent = venue.displayName;
    card.appendChild(name);

    const photo = buildVenuePhoto(venue);
    if (photo) card.appendChild(photo);

    const framing = document.createElement('p');
    framing.className = 'venue-framing';
    framing.textContent = ALLEY_FRAMING;
    card.appendChild(framing);

    return card;
  }

  buildTombstoneCard(venue) {
    const card = this.buildCardShell(`${venue.displayName} (closed)`);

    const name = document.createElement('h1');
    name.className = 'modal-venue-headline';
    name.textContent = venue.displayName;
    card.appendChild(name);

    const photo = buildVenuePhoto(venue);
    if (photo) card.appendChild(photo);

    const closed = document.createElement('p');
    closed.className = 'venue-closed-note';
    closed.textContent = RASH_CLOSED_NOTE;
    card.appendChild(closed);

    return card;
  }
}
