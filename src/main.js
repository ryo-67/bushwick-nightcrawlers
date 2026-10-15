import { LoadingScreen } from './components/loading-screen.js';
import { Modal, buildStarRow, formatCount } from './components/modal.js';
import { findReviewsForVenue } from './review-lookup.js';
import { buildRedactedPhoto } from './components/redacted-photo.js';
import { getReactionCounts, onReactionCounts } from './components/reactions-client.js';
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
  getVolumePercent,
  getMuted,
  setVolumePercent,
  setMuted,
} from './audio/master-controls.js';
import { install as installViewportReadout } from './debug/viewport-readout.js';
import { forgetVisitor, readSession, writeSession, SESSION_ENTERED } from './storage.js';
import { isTouchScreen } from './device.js';
import { validateContent } from './validate-content.js';

// No-op unless `?debug=viewport` is on the URL. See module header
// in src/debug/viewport-readout.js for details.
installViewportReadout();

// Content mistakes surface as console errors here, not as odd UI later.
validateContent();

// The peek card's call to action, by what the pin opens.
const CTA_BY_KIND = {
  review: 'read reviews',
  gathering: 'step into the alley',
  memorial: 'pay respects',
};

function ctaCopyForVenue(venue) {
  return CTA_BY_KIND[venue.kind] ?? CTA_BY_KIND.review;
}

const VIEWPORT_MARGIN = 12;

function setupPinTooltip() {
  const tooltip = document.createElement('div');
  tooltip.className = 'pin-tooltip';
  tooltip.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tooltip);

  let currentPin = null;

  function populate(venue) {
    tooltip.replaceChildren();

    // Locked pin: show only the gating message, no photo / no CTA.
    // Same copy as the mobile tap toast so messaging is consistent.
    if (isLocked(venue)) {
      tooltip.classList.add('pin-tooltip-locked');
      const msg = document.createElement('div');
      msg.className = 'pin-tooltip-locked-message';
      msg.textContent = venue.lockedMessage;
      tooltip.appendChild(msg);
      return;
    }
    tooltip.classList.remove('pin-tooltip-locked');

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
    } else if (venue.photoRedacted) {
      tooltip.appendChild(
        buildRedactedPhoto(venue.photoRedacted, 'pin-tooltip-photo')
      );
    }

    // Teaser peek — title stacked over the venue aggregate
    // (stars · review count), with the CTA chip centered against
    // the whole stack on the right. Nothing that spoils the
    // reviewer.
    const nameRow = document.createElement('div');
    nameRow.className = 'pin-tooltip-name-row';
    const titleStack = document.createElement('div');
    titleStack.className = 'pin-tooltip-title-stack';
    const name = document.createElement('div');
    name.className = 'pin-tooltip-name';
    name.textContent = venue.displayName;
    titleStack.appendChild(name);

    const venueReviews = findReviewsForVenue(venue.id, reviews);
    if (venueReviews.length) {
      const avg =
        venueReviews.reduce((sum, r) => sum + r.rating, 0) /
        venueReviews.length;
      const rating = document.createElement('div');
      rating.className = 'pin-tooltip-rating';
      rating.appendChild(buildStarRow(Math.round(avg), { small: true }));
      const count = document.createElement('span');
      count.className = 'pin-tooltip-review-count';
      count.textContent = `· ${formatCount(venueReviews.length)} ${
        venueReviews.length === 1 ? 'review' : 'reviews'
      }`;
      rating.appendChild(count);
      titleStack.appendChild(rating);
    }
    nameRow.appendChild(titleStack);

    const cta = document.createElement('div');
    cta.className = 'pin-tooltip-cta';
    cta.textContent = ctaCopyForVenue(venue);
    nameRow.appendChild(cta);
    tooltip.appendChild(nameRow);

    const primary = venueReviews[0];
    if (primary) {
      // Tally whisper: only rendered once real reactions exist.
      const tally = document.createElement('div');
      tally.className = 'pin-tooltip-tally';
      tally.style.display = 'none';
      tooltip.appendChild(tally);
      fetchPeekTally(primary.reviewerId).then((n) => {
        if (n > 0 && tally.isConnected) {
          tally.textContent = `${formatCount(n)} ${n === 1 ? 'human' : 'humans'} found this helpful`;
          tally.style.display = '';
          if (currentPin) position(currentPin);
        }
      });
    }

  }

  // Session cache for peek tallies — one fetch per reviewer, and
  // silence (0) when the API is absent. Fresh counts from anywhere
  // (the modal's fetch, or the reply to your own reaction) replace
  // the cached tally.
  const peekTallies = new Map();
  onReactionCounts((reviewerId, counts) => {
    peekTallies.set(reviewerId, Promise.resolve(counts.helpful || 0));
  });
  function fetchPeekTally(reviewerId) {
    if (peekTallies.has(reviewerId)) return peekTallies.get(reviewerId);
    const p = getReactionCounts(reviewerId)
      .then((counts) => counts.helpful || 0)
      .catch(() => 0);
    peekTallies.set(reviewerId, p);
    return p;
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
    const M = VIEWPORT_MARGIN;

    // Above the pin when it fits. Otherwise below, unless below runs
    // off the bottom and there's more room above, in which case pin
    // it to the top margin.
    const above = pinRect.top - ttRect.height - M;
    const below = pinRect.bottom + M;
    const belowOverflows = below + ttRect.height > vh - M;
    const moreRoomAbove = pinRect.top > vh - pinRect.bottom;
    let top = below;
    if (above >= M) top = above;
    else if (belowOverflows && moreRoomAbove) top = M;

    // Centred on the pin, kept inside the side margins.
    const left = Math.min(Math.max(pinCenterX - ttRect.width / 2, M), vw - ttRect.width - M);

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  // Deterministic per-venue tilt for the hover peek: hash the venue
  // id into one of a curated set of angles (mixed left and right
  // leans) so the paste-up feels hand-placed but stable per venue.
  const PEEK_ANGLES = [-2.2, 1.6, -1.4, 2.3, -0.8, 1.1];
  function peekAngleFor(pinId) {
    let sum = 0;
    for (let i = 0; i < pinId.length; i += 1) sum += pinId.charCodeAt(i);
    return PEEK_ANGLES[sum % PEEK_ANGLES.length];
  }

  function show(pin) {
    if (isTouchScreen()) return;
    const venue = venues[pin.dataset.pinId];
    if (!venue) return;
    currentPin = pin;
    tooltip.style.setProperty('--peek-rotate', `${peekAngleFor(venue.id)}deg`);
    populate(venue);
    // Force the drop-in to replay on every hover — without the
    // reflow, re-hovering the same pin resumes from an interrupted
    // exit transition and the settle barely registers.
    tooltip.classList.remove('is-visible');
    void tooltip.offsetWidth;
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

// A venue with unlockAfterVisits (the alley) is always on the map but
// greyed out until that many review venues have been opened; then it
// unlocks with a subtle pulsing glow. Its lockedMessage is shared by
// the desktop hover tooltip and the mobile tap toast.
function isLocked(venue) {
  return !!venue?.unlockAfterVisits && engine.visitedReviewVenueCount() < venue.unlockAfterVisits;
}

const GATED_VENUES = Object.values(venues).filter((v) => v.unlockAfterVisits);

function updateLockedPins() {
  for (const venue of GATED_VENUES) {
    const pin = document.querySelector(`.pin[data-pin-id="${venue.id}"]`);
    if (!pin) continue;
    const newState = isLocked(venue) ? 'locked' : 'unlocked';
    const prevState = pin.dataset.lockState;
    if (prevState === newState) continue;
    pin.dataset.lockState = newState;

    // First unlock this session: a one-shot flag CSS reads to play
    // the burst animation, cleared once it's done (1.2s). Reloads
    // find the pin unlocked without the flag, so only the steady
    // pulse runs. (The lock itself is a two-image swap, colour vs
    // grey, not a CSS filter.)
    if (prevState === 'locked' && newState === 'unlocked') {
      pin.dataset.justUnlocked = 'true';
      setTimeout(() => delete pin.dataset.justUnlocked, 1300);
    }
  }
}

function hideLockedToast() {
  const toast = document.querySelector('.alley-locked-toast');
  if (!toast || toast.dataset.state !== 'visible') return;
  toast.dataset.state = 'hidden';
  clearTimeout(toast._hideTimer);
}

function showLockedToast(venue) {
  let toast = document.querySelector('.alley-locked-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'alley-locked-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = venue.lockedMessage;
  toast.dataset.state = 'visible';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.dataset.state = 'hidden';
  }, 3600);
}

function setupPinPositions() {
  // Apply mapCoordinates from venues.js as inline top/left on each
  // static pin in index.html. venues.js is the single source of
  // truth for pin placement; tuning a pin is a one-file change.
  // Also attach a venue-name label per pin — hidden on desktop via
  // CSS, shown on mobile only. The gathering pin (the alley) is
  // excluded; its locked/unlocked styling carries the meaning there.
  for (const pin of document.querySelectorAll('.pin')) {
    const venue = venues[pin.dataset.pinId];
    if (!venue || !venue.mapCoordinates) continue;
    const { x, y } = venue.mapCoordinates;
    pin.style.left = `${x}%`;
    pin.style.top = `${y}%`;

    if (venue.kind !== 'gathering' && !pin.querySelector('.pin-label')) {
      const label = document.createElement('span');
      label.className = 'pin-label';
      label.textContent = venue.displayName;
      // Optional per-venue position override (top / left / right);
      // venues default to 'bottom' if no labelPosition is set.
      if (venue.labelPosition) {
        label.dataset.position = venue.labelPosition;
      }
      pin.appendChild(label);
    }
  }
}

// Pannable map: the map overflows the wrapper horizontally (tall
// wrappers: phones, tablet portrait) or vertically (wide wrappers:
// desktop; the map's top-left anchoring keeps that crop scrollable),
// and the wrapper scrolls. Center the view on the venue-cluster
// centroid on both axes so the first paint shows the action area
// rather than a map corner. Gated on actual overflow, not a breakpoint, so it
// tracks whatever the CSS decides. Pannability is tracked PER AXIS:
// crossing the aspect threshold (tablet rotation, window reshape)
// swaps which axis overflows, and the browser silently zeroes the
// collapsed axis's scroll — so a swap must re-center even though
// "some axis was already pannable" before and after. Resizes that
// keep the same axis don't re-fire; that would yank a position the
// visitor chose.
let mapPanAxes = { x: false, y: false };

// Once the visitor pans the map themselves (drag, wheel,
// touch), resizes stop yanking their position back to the cluster.
// Until then, every resize re-centers — a window reshape must not
// leave the pins drifting off-viewport in stale scroll pixels.
let mapUserPanned = false;

// Initial-view target: the Myrtle-Broadway intersection cluster
// (JMZ platform, Trifecta, Mr. Kiwi, Market Hotel, the alley) —
// the piece's anchor corner; mean of those pins' venues.js
// coordinates. Deliberately NOT the 10-venue centroid: the
// eastern pins (Mood Ring, Bossa Nova, Caffeine Underground)
// would drag the opening frame off the intersection. X sits a
// couple notches west of the cluster mean (0.26) so the
// JMZ-platform pin clears the left edge with comfortable air on
// a 375px phone.
const MAP_HOME_X = 0.22;
const MAP_HOME_Y = 0.58;

function centerMapOnVenueCluster() {
  const wrapper = document.querySelector('.map-wrapper');
  if (!wrapper) return;

  requestAnimationFrame(() => {
    const sw = wrapper.scrollWidth;
    const sh = wrapper.scrollHeight;
    const cw = wrapper.clientWidth;
    const ch = wrapper.clientHeight;
    const panX = sw > cw;
    const panY = sh > ch;
    const axisFlipped =
      (panX && !mapPanAxes.x) || (panY && !mapPanAxes.y);
    mapPanAxes = { x: panX, y: panY };
    if (!panX && !panY) return;
    // Re-center on every clipped layout until the visitor pans
    // themselves; after that, only an axis flip re-centers (the
    // browser zeroes the collapsed axis's scroll on a flip, so the
    // old position is meaningless anyway).
    if (mapUserPanned && !axisFlipped) return;
    const centerX = sw * MAP_HOME_X - cw / 2;
    const centerY = sh * MAP_HOME_Y - ch / 2;
    wrapper.scrollTo({
      left: Math.max(0, centerX),
      top: Math.max(0, centerY),
      behavior: 'instant',
    });
  });
}

// Click-and-drag panning for mouse users. Touch keeps native
// overflow scrolling (this handler ignores non-mouse pointers); the
// 4px threshold keeps plain pin clicks intact, and a real drag
// suppresses the click that would otherwise fire on release over a
// pin.
function setupMapDragPan() {
  const wrapper = document.querySelector('.map-wrapper');
  if (!wrapper) return;
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  wrapper.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = wrapper.scrollLeft;
    startTop = wrapper.scrollTop;
    // Blocks native image/video drag ghosts and text selection;
    // does not cancel the subsequent click.
    e.preventDefault();
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && Math.abs(dx) + Math.abs(dy) > 4) {
      moved = true;
      mapUserPanned = true;
      wrapper.classList.add('is-panning');
    }
    if (moved) {
      wrapper.scrollLeft = startLeft - dx;
      wrapper.scrollTop = startTop - dy;
    }
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    wrapper.classList.remove('is-panning');
    if (moved) {
      // Swallow exactly the click generated by this drag's release.
      wrapper.addEventListener(
        'click',
        (e) => {
          e.stopPropagation();
          e.preventDefault();
        },
        { capture: true, once: true }
      );
    }
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // Wheel and touch panning also count as the visitor taking over.
  wrapper.addEventListener('wheel', () => { mapUserPanned = true; }, { passive: true });
  wrapper.addEventListener('touchmove', () => { mapUserPanned = true; }, { passive: true });
}

// Runs fn now if the audio engine is up; otherwise once it is, but
// only if this venue's modal is still the one open by then.
function whenReadyWhileOpen(venueId, fn) {
  if (engine.isReady()) {
    fn();
    return;
  }
  engine.onReady(() => {
    if (modalRef?.isOpen() && modalRef.currentVenueId === venueId) fn();
  });
}

function handleModalOpen(venueId, ctx) {
  // Modal-side rat reference is reset; the previous rat (if any)
  // continues playing in the engine's registry as a background voice.
  currentRatGen = null;

  // If the user tapped a locked pin and saw the toast, then
  // immediately tapped a different (unlocked) pin, the toast is
  // now stale — dismiss it so it doesn't linger over the new
  // modal.
  hideLockedToast();

  // Kick off the venue bed (a venue without one just fades out the
  // previous bed).
  whenReadyWhileOpen(venueId, () => beds.startVenueBed(venueId).catch(() => {}));

  const venue = venues[venueId];

  // trainOnOpen (the JMZ platform): fire an immediate train pass so
  // visiting reliably triggers a "train arriving" event. The
  // site-wide intermittent schedule keeps running in parallel.
  if (venue.trainOnOpen) whenReadyWhileOpen(venueId, beds.triggerTrainPass);

  // Gathering (the alley): no review-card path. Sync the mini-card
  // visuals to whatever's currently in the registry (returning
  // visitors might have rats still playing from before).
  if (venue.kind === 'gathering') {
    syncAlleyCardStates();
    return;
  }

  // Memorials have no review and no rat.
  if (venue.kind !== 'review') return;

  const { review } = ctx;
  engine.markVisited(venueId);
  const profile = ratProfiles[review.reviewerId];

  // Factory so we can rebuild the rat after a pause (since pause
  // unregisters and disposes — there's no resume).
  function makeRatGen() {
    const rg = new RatGenerator(
      profile,
      review.text,
      review.reviewerId,
      modalRef,
      venueId
    );
    rg.onComplete = () => {
      engine.unregisterRat(review.reviewerId);
      if (currentRatGen === rg && modalRef?.isOpen()) {
        modalRef.setPlayState('idle');
        startAmbientScope();
        currentRatGen = null;
      }
    };
    return rg;
  }

  // Reopening a card whose rat is still speaking this review picks
  // that rat back up: the button shows it playing, highlighting
  // carries on from the word it's on, and it returns to the front of
  // the mix. (The same rat speaking its alley one-liner doesn't count.)
  const running = engine.getActiveRat(review.reviewerId);
  if (running?.reviewText === review.text) {
    currentRatGen = running;
    engine.bringRatForward(review.reviewerId);
    modalRef.setPlayState('playing');
    startVoiceScope();
  } else {
    currentRatGen = makeRatGen();
    // The card's play button starts in 'loading'; it becomes playable
    // as soon as the engine is up (now, if it already is).
    whenReadyWhileOpen(venueId, () => modalRef.setPlayState('idle'));
    // The scope is never dead air — idle, it taps the master
    // bus and murmurs with the live ambient corner (rumble, traffic,
    // any still-talking rats). Play refocuses it on this rat's voice.
    startAmbientScope();
  }

  const playBtn = modalRef.root.querySelector('.play-button');
  if (!playBtn) return;
  playBtn.addEventListener('click', () => {
    if (!engine.isReady()) return;
    if (currentRatGen?.isPlaying()) {
      // Pause: unregister + fade out. Modal flips back to idle;
      // the scope returns to the ambient murmur.
      engine.unregisterRat(review.reviewerId);
      startAmbientScope();
      modalRef.setPlayState('idle');
      currentRatGen = null;
    } else {
      if (!currentRatGen) currentRatGen = makeRatGen();
      startVoiceScope();
      engine.registerRat(review.reviewerId, currentRatGen);
      currentRatGen.start();
      modalRef.setPlayState('playing');
    }
  });
}

// Idle scope = the corner's live signal at murmur scale. Safe to
// call before the audio engine starts (the analyser just reads
// zeros and draws the flat baseline).
function startAmbientScope() {
  const osc = modalRef?.oscilloscope;
  if (!osc || !window.Tone) return;
  osc.setSourceMode('ambient');
  osc.attach(window.Tone.getDestination());
  osc.start();
}

// Playing scope = the rats' voice bus at full scale.
function startVoiceScope() {
  const osc = modalRef?.oscilloscope;
  if (!osc) return;
  osc.setSourceMode('voice');
  osc.attach(engine.getRatGain());
  osc.start();
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
  const ratGen = new RatGenerator(
    profile,
    oneLiner.text,
    reviewerId,
    null,
    oneLiner.venueId
  );
  ratGen.onComplete = () => engine.unregisterRat(reviewerId);
  engine.registerRat(reviewerId, ratGen);
  ratGen.start();
}

function syncAlleyCardStates() {
  modalRef?.setAlleyCardStates(engine.getActiveRatRanks());
}

function handleModalClose() {
  // Cumulative voicing: do NOT stop or unregister currentRatGen.
  // It continues in the engine's registry as a background voice
  // until natural completion or cap eviction.
  currentRatGen = null;
  beds.stopActiveBed();

  // Refresh gated pins: visiting a venue may have just crossed an
  // unlock threshold. data-lock-state drives the pin's locked/unlocked
  // CSS; the tooltip re-checks isLocked() on the next hover.
  updateLockedPins();
}

function setupFooterAudioControls() {
  const slider = document.querySelector('.footer-volume');
  const muteBtn = document.querySelector('.footer-mute');
  if (!slider || !muteBtn) return;

  // The slider runs 0–100, so its value is the fill percentage.
  function updateSliderFill() {
    slider.style.setProperty('--fill', `${slider.value}%`);
  }

  slider.value = String(getVolumePercent());
  updateSliderFill();
  slider.addEventListener('input', () => {
    setVolumePercent(slider.valueAsNumber);
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
function setupFooterReset() {
  const btn = document.querySelector('.footer-reset');
  if (!btn) return;
  btn.addEventListener('click', () => {
    // Clears progress (and the session flag, so the reload shows the
    // first-visit loading screen) but keeps volume, mute and mode.
    forgetVisitor();
    window.location.reload();
  });
}

function setupFooterModeToggle() {
  const buttons = Array.from(document.querySelectorAll('.footer-mode'));
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
  // Audio + map-video boot. Used by the loading-screen onEnter
  // callback AND by the session-resume gesture handler (when the
  // user navigates back from /about and the loading screen is
  // skipped). Both paths need a user gesture for Tone.start();
  // the gesture chain is preserved by calling this synchronously
  // inside the click/keydown/touchstart handler.
  const bootAudioAndVideo = () => {
    engine.start().catch((e) => {
      console.error('Audio engine failed to start:', e);
      // V74: if the engine still allows another load attempt, the
      // next gesture (a pin, the footer, a key) retries — Tone.start()
      // stays inside that gesture's handler.
      if (engine.canRetryStart()) armGestureBoot();
    });
    document.querySelector('.map-bg')?.play().catch(() => {});
  };

  // One-shot: boot audio/video on the next click, keydown, or
  // touchstart (capture phase, so it runs before the target's own
  // handler). Used for mid-session returns and for V74 retries.
  function armGestureBoot() {
    const start = (event) => {
      // Links marked data-no-audio-boot (the portfolio record link opens a new tab) leave the corner quiet;
      // the boot stays armed for the next gesture.
      if (event?.target?.closest?.('[data-no-audio-boot]')) return;
      document.removeEventListener('click', start, true);
      document.removeEventListener('keydown', start, true);
      document.removeEventListener('touchstart', start, true);
      bootAudioAndVideo();
    };
    document.addEventListener('click', start, true);
    document.addEventListener('keydown', start, true);
    document.addEventListener('touchstart', start, true);
  }

  // Audio + image preload runs on every map page mount, whether or
  // not the loading screen shows, so a skipped loading screen still
  // has its buffers decoded before the first pin click.
  // engine.preload() is idempotent — returns the same promise on
  // subsequent calls, so the loading screen's own subscribePreload
  // shares it.
  engine.preload().catch((e) => {
    console.error('Audio preload failed:', e);
  });

  // Loading screen visibility — three signals decide whether it
  // renders on this page load:
  //   1. Navigation type (performance.getEntriesByType('navigation')):
  //      - 'reload' (browser refresh) → show loading screen
  //      - 'back_forward' (browser back/forward) → skip
  //      - 'navigate' (typed URL, clicked link) → depend on signal #2
  //   2. sessionStorage 'intersection-entered' flag:
  //      - set → user already entered this session; skip on 'navigate'
  //      - unset → first time in this tab; show
  //   3. localStorage 'bushwick.hasEntered' (read inside the loading
  //      screen itself) picks cards vs returning variant.
  //
  // Net behavior:
  //   - Cold start (new tab): show loading screen (variant per
  //     localStorage — cards if first ever visit, returning otherwise)
  //   - Click Enter: sessionStorage flag set, audio boots
  //   - Browser refresh: navigation type 'reload', loading screen
  //     renders again as a cover for asset reload
  //   - About → /: navigation type 'navigate', sessionStorage flag
  //     present → skip
  //   - Back/forward between map and about: 'back_forward' → skip
  //   - Forget: clears both flags, reload, cards variant returns

  // Storage disabled (private mode) reads as "not entered", so the
  // loading screen shows on every navigation. Acceptable.
  const sessionEntered = readSession(SESSION_ENTERED) === '1';

  const navType = performance.getEntriesByType('navigation')[0]?.type ?? 'navigate';

  // Show loading screen on: reload always, OR on initial-navigate
  // when no session flag is set. Skip on: back_forward navigation,
  // OR on navigate when session flag is already set (internal nav).
  const shouldShowLoadingScreen =
    navType === 'reload' ||
    (navType === 'navigate' && !sessionEntered);

  if (shouldShowLoadingScreen) {
    // The opaque loading screen hides the map, so don't decode the
    // video behind it; Enter's bootAudioAndVideo() starts it.
    document.querySelector('.map-bg')?.pause();
    const loading = new LoadingScreen(document.body, {
      onEnter: () => {
        writeSession(SESSION_ENTERED, '1');
        bootAudioAndVideo();
      },
    });
    loading.init();
  } else {
    // Returning to the map mid-session: bind audio/video boot to
    // the next user gesture (any click, keydown, or touchstart).
    // Tone.start() needs a gesture and pre-loading the audio
    // context without one fails silently on iOS.
    armGestureBoot();
  }

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
  // Listener stays subscribed for the page lifetime; the gathering
  // check (only update while the alley is open) keeps it cheap.
  engine.onActiveRatsChange(() => {
    if (modalRef?.isOpen() && venues[modalRef.currentVenueId]?.kind === 'gathering') {
      syncAlleyCardStates();
    }
  });

  setupPinPositions();
  updateLockedPins();
  centerMapOnVenueCluster();
  // Reveal the map (styles.css fades it in). Scheduled after
  // centerMapOnVenueCluster's own frame callback, so the first
  // visible frame is already scrolled to the intersection.
  requestAnimationFrame(() => {
    document.querySelector('.map-wrapper')?.classList.add('is-placed');
  });
  // Debounced: mid-relayout resize ticks can transiently report the
  // wrapper as non-overflowing, which would register as an axis flip
  // and yank a user-chosen pan position on the next tick. Waiting
  // for the resize to settle sees only real states.
  let mapRecenterTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(mapRecenterTimer);
    mapRecenterTimer = setTimeout(centerMapOnVenueCluster, 150);
  });
  setupMapDragPan();
  const tooltip = setupPinTooltip();
  setupFooterModeToggle();
  setupFooterAudioControls();
  setupFooterReset();

  const mapWrapper = document.querySelector('.map-wrapper') || document.body;
  mapWrapper.addEventListener('click', (event) => {
    const pin = event.target.closest?.('.pin');
    if (!pin) return;
    const pinId = pin.dataset.pinId;
    if (!pinId) return;

    // Locked pin: don't open the modal. Touch screens get the gating
    // message as a toast; mouse users already see it in the hover
    // tooltip (setupPinTooltip).
    if (isLocked(venues[pinId])) {
      if (isTouchScreen()) {
        tooltip.hide();
        showLockedToast(venues[pinId]);
      }
      return;
    }

    tooltip.hide();
    modalRef.open(pinId);
  });

  // Audio boots inside a user gesture: the loading screen's Enter
  // when it shows, otherwise the next click/key/touch anywhere
  // (armGestureBoot), except links marked data-no-audio-boot.
});

document.addEventListener('keydown', (event) => {
  const pin = event.target.closest?.('.pin');
  if (!pin) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    pin.click();
  }
});
