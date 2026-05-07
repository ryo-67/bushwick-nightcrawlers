import { HeadphonesTag } from './components/headphones-tag.js';
import { Modal } from './components/modal.js';
import { rats } from './content/rats.js';
import { venues } from './content/venues.js';
import { reviews } from './content/reviews.js';
import * as engine from './audio/engine.js';
import { ratProfiles } from './audio/rat-profiles.js';
import { RatGenerator } from './audio/rat-generator.js';

const VIEWPORT_MARGIN = 12;

function setupPinTooltip() {
  const tooltip = document.createElement('div');
  tooltip.className = 'pin-tooltip';
  tooltip.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tooltip);

  let currentPin = null;

  function isPointerCoarse() {
    return window.matchMedia('(hover: none), (pointer: coarse)').matches;
  }

  function populate(venue) {
    tooltip.replaceChildren();

    if (venue.photoPath) {
      const img = document.createElement('img');
      img.className = 'pin-tooltip-photo';
      img.src = venue.photoPath;
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        img.style.display = 'none';
        if (currentPin) position(currentPin);
      });
      tooltip.appendChild(img);
    }

    const name = document.createElement('div');
    name.className = 'pin-tooltip-name';
    name.textContent = venue.displayName;
    tooltip.appendChild(name);

    const cta = document.createElement('div');
    cta.className = 'pin-tooltip-cta';
    cta.textContent = 'read reviews';
    tooltip.appendChild(cta);
  }

  function position(pin) {
    tooltip.style.left = '-9999px';
    tooltip.style.top = '-9999px';
    tooltip.classList.add('is-visible');

    const pinRect = pin.getBoundingClientRect();
    const ttRect = tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pinCenterX = pinRect.left + pinRect.width / 2;

    let top = pinRect.top - ttRect.height - VIEWPORT_MARGIN;
    let placement = 'above';
    if (top < VIEWPORT_MARGIN) {
      placement = 'below';
      top = pinRect.bottom + VIEWPORT_MARGIN;
    }
    if (placement === 'below' && top + ttRect.height > vh - VIEWPORT_MARGIN) {
      const aboveSpace = pinRect.top;
      const belowSpace = vh - pinRect.bottom;
      if (aboveSpace > belowSpace) {
        placement = 'above';
        top = Math.max(VIEWPORT_MARGIN, pinRect.top - ttRect.height - VIEWPORT_MARGIN);
      }
    }

    let left = pinCenterX - ttRect.width / 2;
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
    if (left + ttRect.width > vw - VIEWPORT_MARGIN) {
      left = vw - ttRect.width - VIEWPORT_MARGIN;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.dataset.placement = placement;
  }

  function show(pin) {
    if (isPointerCoarse()) return;
    const venue = venues[pin.dataset.pinId];
    if (!venue) return;
    currentPin = pin;
    populate(venue);
    position(pin);
  }

  function hide() {
    tooltip.classList.remove('is-visible');
    currentPin = null;
  }

  document.querySelectorAll('.pin').forEach((pin) => {
    pin.addEventListener('pointerenter', () => show(pin));
    pin.addEventListener('pointerleave', hide);
    pin.addEventListener('focus', () => show(pin));
    pin.addEventListener('blur', hide);
  });

  return { hide };
}

let modalRef = null;
let currentRatGen = null;
let currentRatGenVenueId = null;
let playClickHandler = null;

function syncPlayState() {
  if (!modalRef || !modalRef.isOpen()) return;
  if (!engine.isReady()) {
    modalRef.setPlayState('loading');
    return;
  }
  if (!currentRatGen) return;
  modalRef.setPlayState(currentRatGen.isPlaying() ? 'playing' : 'idle');
}

function handleModalOpen(venueId, ctx) {
  currentRatGen?.stop();
  currentRatGen = null;
  currentRatGenVenueId = null;

  const review = ctx?.review;
  if (!review) return; // alley/rash — no rat generator

  const profile = ratProfiles[review.reviewerId];
  if (!profile) return;

  currentRatGen = new RatGenerator(profile, review.text, modalRef);
  currentRatGenVenueId = venueId;
  currentRatGen.onComplete = () => {
    if (modalRef?.isOpen()) modalRef.setPlayState('idle');
  };

  syncPlayState();

  if (!engine.isReady()) {
    engine.onReady(() => {
      if (modalRef?.isOpen() && modalRef.currentVenueId === venueId) {
        modalRef.setPlayState('idle');
      }
    });
  }

  const playBtn = modalRef.root.querySelector('.play-button');
  if (!playBtn) return;
  playClickHandler = () => {
    if (!engine.isReady() || !currentRatGen) return;
    if (currentRatGen.isPlaying()) {
      currentRatGen.stop();
      modalRef.setPlayState('idle');
    } else {
      currentRatGen.start();
      modalRef.setPlayState('playing');
    }
  };
  playBtn.addEventListener('click', playClickHandler);
}

function handleModalClose() {
  currentRatGen?.stop();
  currentRatGen = null;
  currentRatGenVenueId = null;
  playClickHandler = null;
}

document.addEventListener('DOMContentLoaded', () => {
  const tag = new HeadphonesTag(document.body);
  tag.init();

  const modalRoot = document.getElementById('modal-root');
  modalRef = new Modal(modalRoot, { rats, venues, reviews }, {
    onOpen: handleModalOpen,
    onClose: handleModalClose,
  });

  const tooltip = setupPinTooltip();

  const mapWrapper = document.querySelector('.map-wrapper') || document.body;
  mapWrapper.addEventListener('click', (event) => {
    const pin = event.target.closest?.('.pin');
    if (!pin) return;
    const pinId = pin.dataset.pinId;
    if (!pinId) return;
    tooltip.hide();
    modalRef.open(pinId);
  });

  let bootstrapStarted = false;
  function bootstrapEngine() {
    if (bootstrapStarted) return;
    bootstrapStarted = true;
    engine.start().catch((e) => {
      // eslint-disable-next-line no-console
      console.error('Audio engine failed to start:', e);
    });
  }
  document.addEventListener('click', bootstrapEngine, true);
  document.addEventListener('keydown', bootstrapEngine, true);
  document.addEventListener('touchstart', bootstrapEngine, true);
});

document.addEventListener('keydown', (event) => {
  const pin = event.target.closest?.('.pin');
  if (!pin) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    pin.click();
  }
});
