import { LoadingScreen } from './components/loading-screen.js';
import { Modal } from './components/modal.js';
import { rats } from './content/rats.js';
import { venues } from './content/venues.js';
import { reviews } from './content/reviews.js';
import { alleyOneLiners } from './content/alley-oneliners.js';
import * as engine from './audio/engine.js';
import { ratProfiles } from './audio/rat-profiles.js';
import { RatGenerator } from './audio/rat-generator.js';
import { getMode, setMode } from './audio/playback-mode.js';
import * as beds from './audio/beds.js';
import {
  getVolume,
  getMuted,
  setVolume,
  setMuted,
  VOLUME_MIN_DB,
  VOLUME_MAX_DB,
} from './audio/master-controls.js';

function ctaCopyForVenue(venue) {
  if (venue.id === 'alley') return 'step into the alley';
  if (venue.id === 'rash') return 'pay respects';
  return 'read reviews';
}

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
    cta.textContent = ctaCopyForVenue(venue);
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
let pendingAlleyReveal = false;

// Read the video's natural dimensions and lock the pin-layer to the
// same aspect ratio. Pin percentages are relative to the layer; the
// layer must match the map exactly or pins drift off venues.
// Falls back to a defensive setTimeout in case loadedmetadata never
// fires (rare, but the static aspect-ratio in CSS won't catch any
// future map.mp4 with a different ratio).
function syncPinLayerToMapDimensions() {
  const video = document.querySelector('.map-bg');
  const layer = document.querySelector('.pin-layer');
  if (!video || !layer) return;

  function apply() {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w > 0 && h > 0) {
      layer.style.aspectRatio = `${w} / ${h}`;
    }
  }

  if (video.readyState >= 1) {
    apply();
  } else {
    video.addEventListener('loadedmetadata', apply, { once: true });
    setTimeout(apply, 100);
  }
}

function setupPinPositions() {
  // Apply mapCoordinates from venues.js as inline top/left on each
  // static pin in index.html. venues.js is the single source of
  // truth for pin placement; tuning a pin is a one-file change.
  for (const pin of document.querySelectorAll('.pin')) {
    const venue = venues[pin.dataset.pinId];
    if (!venue || !venue.mapCoordinates) continue;
    const { x, y } = venue.mapCoordinates;
    pin.style.left = `${x}%`;
    pin.style.top = `${y}%`;
  }
}

function getAlleyPin() {
  return document.querySelector('.pin[data-pin-id="alley"]');
}

function setupAlleyPinReveal() {
  const alleyPin = getAlleyPin();
  if (!alleyPin) return;

  // Returning visitor: alley already unlocked, render visible immediately.
  // First-time / partial visitor: hide until threshold crosses.
  if (engine.hasVisitedAllReviewVenues()) {
    alleyPin.classList.remove('is-hidden');
  } else {
    alleyPin.classList.add('is-hidden');
  }

  // Listener arms the reveal; the actual fade-in is deferred to modal-close
  // so the user is looking at the map when it happens.
  window.addEventListener('bushwick:all-venues-visited', () => {
    pendingAlleyReveal = true;
  });
}

function revealAlleyPin() {
  const alleyPin = getAlleyPin();
  if (!alleyPin) return;
  alleyPin.classList.remove('is-hidden');
  // Force reflow so the next class addition triggers the animation
  // even if both class changes happen in the same frame.
  void alleyPin.offsetWidth;
  alleyPin.classList.add('is-revealing');
  alleyPin.addEventListener(
    'animationend',
    () => alleyPin.classList.remove('is-revealing'),
    { once: true }
  );
}

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
  // Modal-side rat reference is reset; the previous rat (if any)
  // continues playing in the engine's registry as a background voice.
  currentRatGen = null;
  currentRatGenVenueId = null;

  // Kick off venue bed (no-op for unmapped venues).
  if (engine.isReady()) {
    beds.startVenueBed(venueId).catch(() => {});
  } else {
    engine.onReady(() => {
      if (modalRef?.isOpen() && modalRef.currentVenueId === venueId) {
        beds.startVenueBed(venueId).catch(() => {});
      }
    });
  }

  // jmz-platform: fire an immediate train pass so visiting the
  // platform reliably triggers a "train arriving" event. The
  // site-wide intermittent train schedule keeps running in parallel
  // for ambient feel under any pin. Recheck modal state after
  // engine ready so we don't fire a pass after the user navigated
  // away.
  if (venueId === 'jmz-platform') {
    if (engine.isReady()) {
      beds.triggerTrainPass();
    } else {
      engine.onReady(() => {
        if (modalRef?.isOpen() && modalRef.currentVenueId === 'jmz-platform') {
          beds.triggerTrainPass();
        }
      });
    }
  }

  // Alley: no review-card path. Sync the mini-card visuals to
  // whatever's currently in the registry (returning visitors might
  // have rats still playing from before).
  if (venueId === 'alley') {
    syncAlleyCardStates();
    return;
  }

  const review = ctx?.review;
  if (!review) return; // rash — no rat generator

  // Mark this venue as visited (review-bearing only).
  engine.markVisited(venueId);

  const profile = ratProfiles[review.reviewerId];
  if (!profile) return;

  // Factory so we can rebuild the rat after a pause (since pause
  // unregisters and disposes — there's no resume).
  function makeRatGen() {
    const rg = new RatGenerator(profile, review.text, review.reviewerId, modalRef);
    rg.onComplete = () => {
      engine.unregisterRat(review.reviewerId);
      if (currentRatGen === rg && modalRef?.isOpen()) {
        modalRef.setPlayState('idle');
        modalRef.oscilloscope?.stop();
        currentRatGen = null;
      }
    };
    return rg;
  }

  currentRatGen = makeRatGen();
  currentRatGenVenueId = venueId;

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
    if (!engine.isReady()) return;
    if (currentRatGen?.isPlaying()) {
      // Pause: unregister + fade out. Modal flips back to idle.
      engine.unregisterRat(review.reviewerId);
      modalRef.oscilloscope?.stop();
      modalRef.setPlayState('idle');
      currentRatGen = null;
    } else {
      if (!currentRatGen) currentRatGen = makeRatGen();
      modalRef.oscilloscope?.attach(engine.getRatGain());
      modalRef.oscilloscope?.start();
      engine.registerRat(review.reviewerId, currentRatGen);
      currentRatGen.start();
      modalRef.setPlayState('playing');
    }
  };
  playBtn.addEventListener('click', playClickHandler);
}

function spawnAlleyOneLiner(reviewerId) {
  if (!engine.isReady()) return;
  const oneLiner = alleyOneLiners.find((o) => o.reviewerId === reviewerId);
  if (!oneLiner) return;
  const profile = ratProfiles[reviewerId];
  if (!profile) return;
  // Null modal — alley voices don't drive word highlighting (the
  // alley modal has no word-span DOM; the cards are static text).
  // The rat's own onComplete handles unregister; the engine's
  // displacement logic handles same-id click-while-playing.
  const ratGen = new RatGenerator(profile, oneLiner.text, reviewerId, null);
  ratGen.onComplete = () => engine.unregisterRat(reviewerId);
  engine.registerRat(reviewerId, ratGen);
  ratGen.start();
}

function syncAlleyCardStates() {
  if (!modalRef?.setAlleyCardStates) return;
  const ranks = engine.getActiveRatRanks();
  const rankMap = {};
  for (const { reviewerId, rank } of ranks) rankMap[reviewerId] = rank;
  modalRef.setAlleyCardStates(rankMap);
}

function handleModalClose() {
  // Cumulative voicing: do NOT stop or unregister currentRatGen.
  // It continues in the engine's registry as a background voice
  // until natural completion or cap eviction.
  currentRatGen = null;
  currentRatGenVenueId = null;
  playClickHandler = null;
  modalRef?.oscilloscope?.dispose();
  beds.stopActiveBed();

  if (pendingAlleyReveal) {
    pendingAlleyReveal = false;
    revealAlleyPin();
  }
}

function setupHeaderAudioControls() {
  const slider = document.querySelector('.header-volume');
  const muteBtn = document.querySelector('.header-mute');
  if (!slider || !muteBtn) return;

  function updateSliderFill() {
    const v = parseFloat(slider.value);
    const pct = ((v - VOLUME_MIN_DB) / (VOLUME_MAX_DB - VOLUME_MIN_DB)) * 100;
    slider.style.setProperty('--fill', `${pct}%`);
  }

  slider.value = String(getVolume());
  updateSliderFill();
  slider.addEventListener('input', () => {
    setVolume(parseFloat(slider.value));
    updateSliderFill();
  });

  function syncMuteVisual() {
    muteBtn.setAttribute('aria-pressed', getMuted() ? 'true' : 'false');
  }

  syncMuteVisual();
  muteBtn.addEventListener('click', () => {
    setMuted(!getMuted());
    syncMuteVisual();
  });
}

// Reset button copy alternatives (Shoro can swap in by editing the
// element text in index.html — no code change needed):
//   - "forget the rats you've met"  (in-world, default)
//   - "step back into the alley fresh"  (in-world, longer)
//   - "new to the neighborhood"  (in-world, Yelp pastiche)
//   - "reset progress"  (functional)
//   - "clear visit log"  (functional)
function setupHeaderReset() {
  const btn = document.querySelector('.header-reset');
  if (!btn) return;
  btn.addEventListener('click', () => {
    try {
      const keys = Object.keys(localStorage).filter(
        (k) =>
          k.startsWith('bushwick.visited.') ||
          k === 'bushwick.hasEntered' ||
          k === 'bushwick.alleyHintSeen' ||
          k.startsWith('bushwick.reaction.') ||
          k.startsWith('bushwick.reactionCount.')
      );
      for (const k of keys) localStorage.removeItem(k);
    } catch {
      // localStorage unavailable — reload anyway
    }
    window.location.reload();
  });
}

function setupHeaderModeToggle() {
  const buttons = Array.from(document.querySelectorAll('.header-mode'));
  if (buttons.length === 0) return;
  function refresh() {
    const mode = getMode();
    for (const b of buttons) {
      b.classList.toggle('is-active', b.dataset.mode === mode);
      b.setAttribute('aria-pressed', b.dataset.mode === mode ? 'true' : 'false');
    }
  }
  for (const b of buttons) {
    b.addEventListener('click', () => {
      setMode(b.dataset.mode);
      refresh();
    });
  }
  refresh();
}

document.addEventListener('DOMContentLoaded', () => {
  const loading = new LoadingScreen(document.body, {
    onEnter: () => {
      // Gesture-bound: must be called synchronously from inside the
      // Enter button click handler. engine.start() captures
      // Tone.start() sync internally; the await chain after that is
      // safe to detach from the gesture frame.
      engine.start().catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Audio engine failed to start:', e);
      });
    },
  });
  loading.init();

  const modalRoot = document.getElementById('modal-root');
  modalRef = new Modal(
    modalRoot,
    { rats, venues, reviews, alleyOneLiners },
    {
      onOpen: handleModalOpen,
      onClose: handleModalClose,
      onAlleyCardClick: spawnAlleyOneLiner,
    }
  );

  // Engine fires this after every register / unregister. Modal
  // updates its alley mini-card border opacities from the rank map.
  // Listener stays subscribed for the page lifetime; the modal-side
  // bail-out (only update when alley is open) keeps it cheap.
  engine.onActiveRatsChange(() => {
    if (modalRef?.isOpen() && modalRef.currentVenueId === 'alley') {
      syncAlleyCardStates();
    }
  });

  syncPinLayerToMapDimensions();
  setupPinPositions();
  const tooltip = setupPinTooltip();
  setupHeaderModeToggle();
  setupHeaderAudioControls();
  setupHeaderReset();
  setupAlleyPinReveal();

  const mapWrapper = document.querySelector('.map-wrapper') || document.body;
  mapWrapper.addEventListener('click', (event) => {
    const pin = event.target.closest?.('.pin');
    if (!pin) return;
    const pinId = pin.dataset.pinId;
    if (!pinId) return;
    tooltip.hide();
    modalRef.open(pinId);
  });

  // Audio engine bootstrap is owned by the loading screen — it calls
  // engine.start() inside the Enter button click handler. No global
  // gesture listeners; the loading screen overlay intercepts the
  // first user gesture by construction.
});

document.addEventListener('keydown', (event) => {
  const pin = event.target.closest?.('.pin');
  if (!pin) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    pin.click();
  }
});
