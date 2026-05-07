import { Oscilloscope } from './oscilloscope.js';
import { Subtitles } from './subtitles.js';

const REVIEWER_LOCATION = 'Bushwick, Brooklyn';
const ALLEY_FRAMING = 'the alley between Mr Kiwi and the JMZ';
const RASH_CLOSED_NOTE = '[closed February 2026]';
const REACTIONS = ['Helpful', 'Funny', 'Cool'];

function formatDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function findReviewForVenue(venueId, reviews) {
  return Object.values(reviews).find((r) => r.venueId === venueId) || null;
}

export class Modal {
  constructor(root, content) {
    this.root = root;
    this.content = content;
    this.currentVenueId = null;
    this.previousFocus = null;
    this.oscilloscope = null;
    this.subtitles = null;
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

    const review = findReviewForVenue(venue.id, this.content.reviews);
    const reviewer = review ? this.content.rats[review.reviewerId] : null;

    this.root.replaceChildren();

    let card;
    if (venue.id === 'alley') {
      card = this.buildAmbientCard(venue);
    } else if (venue.reviewerId === null) {
      card = this.buildTombstoneCard(venue);
    } else if (reviewer && review) {
      card = this.buildReviewCard(venue, reviewer, review);
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
  }

  close() {
    if (!this.isOpen()) return;

    this.root.dataset.state = 'closed';
    this.root.setAttribute('aria-hidden', 'true');
    this.root.replaceChildren();

    Array.from(document.body.children).forEach((child) => {
      child.removeAttribute('inert');
    });

    this.oscilloscope = null;
    this.subtitles = null;
    this.currentVenueId = null;

    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
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

  buildReviewCard(venue, reviewer, review) {
    const card = this.buildCardShell(`Review of ${venue.displayName} by ${reviewer.displayName}`);

    const reviewerBlock = document.createElement('header');
    reviewerBlock.className = 'reviewer-block';

    const selfie = document.createElement('img');
    selfie.className = 'rat-selfie';
    selfie.src = reviewer.selfiePath;
    selfie.alt = '';
    selfie.loading = 'lazy';
    reviewerBlock.appendChild(selfie);

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

    reviewerBlock.appendChild(meta);
    card.appendChild(reviewerBlock);

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
    date.textContent = formatDate();
    ratingRow.appendChild(date);

    card.appendChild(ratingRow);

    const venueName = document.createElement('span');
    venueName.className = 'review-venue-name';
    venueName.textContent = venue.displayName;
    card.appendChild(venueName);

    const body = document.createElement('p');
    body.className = 'review-body';
    body.textContent = review.text;
    card.appendChild(body);

    const squeaks = document.createElement('p');
    squeaks.className = 'review-squeaks';
    squeaks.textContent = `${review.text.length} squeaks`;
    card.appendChild(squeaks);

    const reactions = document.createElement('div');
    reactions.className = 'review-reactions';
    REACTIONS.forEach((label) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'review-reaction';
      btn.textContent = `${label} 0`;
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      btn.tabIndex = -1;
      reactions.appendChild(btn);
    });
    card.appendChild(reactions);

    this.oscilloscope = new Oscilloscope();
    card.appendChild(this.oscilloscope.element);

    this.subtitles = new Subtitles(review.text);
    card.appendChild(this.subtitles.element);

    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'play-button';
    play.disabled = true;
    play.title = 'audio loading…';
    play.setAttribute('aria-label', 'Play review (audio loading)');
    play.textContent = 'Play';
    card.appendChild(play);

    return card;
  }

  buildAmbientCard(venue) {
    const card = this.buildCardShell(`${venue.displayName} (ambient)`);

    const name = document.createElement('h2');
    name.className = 'venue-name-large';
    name.textContent = venue.displayName;
    card.appendChild(name);

    const framing = document.createElement('p');
    framing.className = 'venue-framing';
    framing.textContent = ALLEY_FRAMING;
    card.appendChild(framing);

    this.oscilloscope = new Oscilloscope();
    card.appendChild(this.oscilloscope.element);

    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'play-button';
    play.disabled = true;
    play.title = 'audio loading…';
    play.setAttribute('aria-label', 'Play ambient (audio loading)');
    play.textContent = 'Play';
    card.appendChild(play);

    return card;
  }

  buildTombstoneCard(venue) {
    const card = this.buildCardShell(`${venue.displayName} (closed)`);

    const name = document.createElement('h2');
    name.className = 'venue-name-large';
    name.textContent = venue.displayName;
    card.appendChild(name);

    const closed = document.createElement('p');
    closed.className = 'venue-closed-note';
    closed.textContent = RASH_CLOSED_NOTE;
    card.appendChild(closed);

    return card;
  }
}
