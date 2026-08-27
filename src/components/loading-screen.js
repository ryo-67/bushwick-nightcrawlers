import { LOADING_NARRATIVE } from '../content/loading-narrative.js';
import * as engine from '../audio/engine.js';

const HAS_ENTERED_KEY = 'bushwick.hasEntered';

const CARD_ADVANCE_MS = 3500;
const STATUS_CYCLE_MS = 2500;
const TYPEWRITER_TOTAL_MS = 400;
const FADE_OUT_MS = 700;
const RAT_MIN_INTERVAL_MS = 8000;
const RAT_MAX_INTERVAL_MS = 12000;
const RAT_DURATION_MS = 6000;
// Widths (px) of the scuttle crew; heights follow the viewBox
// aspect. A run picks 1..3 of these, leader first.
const RAT_WIDTHS = [28, 22, 25];
// "Rat" by Danil Polshin, the Noun Project (CC BY 3.0),
// https://thenounproject.com/icon/rat-8308195/ — traced from the
// published PNG into a single path so it stays inline and tints
// via `currentColor`. Faces right (the LTR run direction; RTL
// flips it via scaleX). The eye is a hole in the path (fill-rule
// evenodd), so the page bg shows through. Attribution lives in
// the About page credits.
const RAT_VIEWBOX = '39 142 438 224';
const RAT_PATH_D =
  'M70 338.02C100.69 309.5 103.69 306.89 118.91 295.43L131.33 286.08L134.23 287.79C145.3 294.31 148.89 312.26 141.32 323.23C138.29 327.64 138.23 327.5 147.97 338.37C156.08 347.42 159.06 352.31 159.88 357.89C160.54 362.46 160.57 362.48 162.36 360.41L164.17 358.32L167.07 361.23C170.51 364.66 172 364.14 172 359.49L172 356.1L176.25 358.03C183.41 361.28 184.98 359.76 181.08 353.36L179.16 350.21L183.1 350.74C189.21 351.56 187.39 349.28 174.68 340.2C158.03 328.3 156.63 326.25 162.49 322.41C167.19 319.33 211.99 307.15 212.86 308.72C213.28 309.47 217.87 311.67 223.06 313.62C235.63 318.34 243.25 322.49 245.89 326.06C248.53 329.64 249.77 329.77 250.57 326.56C251.11 324.44 251.51 324.24 253.66 325.06C256.93 326.31 257 326.29 257 324.17C257 322.71 257.6 322.43 260.02 322.79C262.97 323.22 263.02 323.17 261.95 320.37C258.96 312.51 251.43 309.08 232.62 307.04C217.41 305.38 217.46 305.32 239.03 298.03C269.92 287.59 286.9 293.53 305.91 321.42C309.69 326.96 315.13 334.43 317.99 338C320.86 341.57 324.08 346.22 325.16 348.32C327.33 352.57 329.34 352.73 329.82 348.67C330.21 345.36 331.01 345.32 333.97 348.47C336.76 351.44 338 350.93 338 346.83C338 343.81 338.03 343.79 340.46 345.38C344.16 347.81 345.05 347.45 343.86 344.03C342.18 339.21 335.34 333.08 330.84 332.36C328.39 331.97 326.21 330.81 324.99 329.26C319.41 322.17 314.54 305.58 316.65 300.85C317.52 298.91 318.89 300.12 332.04 314.4C344.91 328.39 346.61 329.89 347.73 328.35C348.43 327.4 349 326.01 349 325.27C349 324.25 349.47 324.18 350.93 324.96C354.11 326.66 355.27 326.22 354.76 323.5C354.34 321.3 354.63 321 357.14 321C360.64 321 360.97 318.67 357.75 316.6C356.51 315.8 352.92 314.49 349.76 313.67C338.54 310.78 332.97 305.21 330.77 294.69C327.75 280.19 335.33 277.97 379.5 280.44C415.74 282.46 455.4 272.36 468.54 257.75C476.45 248.94 474.47 243.17 458.99 229.93C434.8 209.25 406.82 191.64 390 186.52C380.44 183.6 380.34 183.53 379.6 178.88C374.86 149.28 339.9 146.75 332.92 175.5C332.25 178.25 331.62 180.62 331.51 180.76C331.41 180.9 321.46 176.7 309.41 171.44C252.05 146.38 232.56 142.26 204.11 149.16C157.35 160.51 121 208.11 121 258L121 264.65L110.75 273.2C79.45 299.29 41.32 346.71 39.25 362.14L38.68 366.45L42.09 363.62C43.96 362.06 56.52 350.54 70 338.02ZM396.5 235.5C385.59 231.64 383.02 217.69 392.82 215.54C398.76 214.23 409.02 217.87 414.75 223.31C420.08 228.37 418.6 231.44 409.1 235.05C403.09 237.34 401.83 237.38 396.5 235.5Z';
// Hard cap on buffer-load wait. If onReady never fires (network or
// engine pathology), unblock the user at this mark with the ready
// message anyway. Six seconds matches the prompt's worst-case escape.
const PRELOAD_FALLBACK_MS = 6000;

export class LoadingScreen {
  constructor(root, { onEnter } = {}) {
    this.root = root;
    this.onEnter = onEnter;
    this.el = null;
    this.statusEl = null;
    this.ctaBtn = null;

    this.cardEls = [];
    this.cardIndex = -1;
    this.audioReady = false;
    this.entered = false;
    this.isReturning = this.checkReturning();

    this.advanceTimer = null;
    this.statusTimer = null;
    this.statusMsgIndex = 0;
    this.preloadFallbackTimer = null;
    this.ratTimer = null;
    this.ratClearTimer = null;
    this.ratDirection = -1;
    this.typewriterTimers = [];

    this.advanceClickHandler = null;
    this.escHandler = null;
  }

  init() {
    if (this.isReturning) {
      this.renderReturning();
    } else {
      this.renderInitial();
    }
    this.subscribePreload();
  }

  checkReturning() {
    try {
      return localStorage.getItem(HAS_ENTERED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  markEntered() {
    try {
      localStorage.setItem(HAS_ENTERED_KEY, 'true');
    } catch {
      // localStorage unavailable (private mode) — non-fatal
    }
  }

  // ---- DOM construction ----

  renderInitial() {
    const el = document.createElement('div');
    el.className = 'loading-screen';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'loading-title');
    el.dataset.state = 'initial';

    el.appendChild(this.buildNoise());
    el.appendChild(
      this.buildHeader({ withTitle: true, ctaLabel: LOADING_NARRATIVE.cta })
    );

    const cards = document.createElement('div');
    cards.className = 'loading-cards';
    LOADING_NARRATIVE.cards.forEach((card, idx) => {
      const cardEl = this.buildCard(card, idx);
      cards.appendChild(cardEl);
      this.cardEls.push(cardEl);
    });
    el.appendChild(cards);
    // buildHeader ran refreshCta before cardEls existed (empty list
    // reads as "on last card"); re-sync now so the button opens in
    // its skip state while the cards play.
    this.refreshCta();

    el.appendChild(this.buildRat());

    // Tap anywhere on the overlay (outside the header button)
    // advances cards. A card that was just dragged sets
    // dragJustEnded on itself; we honor that flag so a
    // drag-release click doesn't double as an advance trigger.
    this.advanceClickHandler = (e) => {
      if (e.target.closest('.loading-cta')) return;
      const card = e.target.closest('.loading-card');
      if (card && card.dataset.dragJustEnded === 'true') return;
      this.advanceCard();
    };
    el.addEventListener('click', this.advanceClickHandler);

    this.escHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.skipToLastCard();
      }
    };
    document.addEventListener('keydown', this.escHandler);

    this.root.appendChild(el);
    this.el = el;

    this.startStatusCycle();
    this.scheduleRat();
    // First card reveal happens in the next frame so the initial
    // mount paints with all cards in `hidden` state, then the first
    // transitions in cleanly.
    requestAnimationFrame(() => this.advanceCard());
  }

  renderReturning() {
    const el = document.createElement('div');
    el.className = 'loading-screen is-returning';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'loading-title');
    el.dataset.state = 'returning';

    el.appendChild(this.buildNoise());
    // V31: same header as the first-visit variant — title top-left,
    // status + button top-right. The greeting alone holds the
    // center (a large duplicate title there read as clutter once
    // the header title returned).
    el.appendChild(
      this.buildHeader({
        withTitle: true,
        ctaLabel: LOADING_NARRATIVE.returningCta,
      })
    );

    const center = document.createElement('div');
    center.className = 'loading-returning';

    const greeting = document.createElement('p');
    greeting.className = 'loading-greeting';
    greeting.textContent = LOADING_NARRATIVE.returningGreeting;
    center.appendChild(greeting);

    el.appendChild(center);

    el.appendChild(this.buildRat());

    this.root.appendChild(el);
    this.el = el;

    this.startStatusCycle();
    this.scheduleRat();
  }

  buildNoise() {
    const noise = document.createElement('div');
    noise.className = 'loading-noise';
    noise.setAttribute('aria-hidden', 'true');
    return noise;
  }

  buildHeader({ withTitle = true, ctaLabel }) {
    // V29: the header owns the whole top chrome — title left, and
    // a right-side group of status message + THE button. Skip is a
    // state of that button (see refreshCta), not a separate
    // control: skip → (waiting) → enter-CTA as the screen
    // progresses. The returning variant reuses this header without
    // the title (its title is the centerpiece mid-screen).
    const header = document.createElement('header');
    header.className = 'loading-header';

    if (withTitle) {
      const title = document.createElement('h1');
      title.className = 'loading-title';
      title.id = 'loading-title';
      title.textContent = LOADING_NARRATIVE.title;
      header.appendChild(title);
    }

    const group = document.createElement('div');
    group.className = 'loading-header-status';

    const status = document.createElement('p');
    status.className = 'loading-status';
    status.setAttribute('aria-live', 'polite');
    group.appendChild(status);
    this.statusEl = status;

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'loading-cta';
    cta.disabled = true;
    this.ctaLabel = ctaLabel;
    cta.addEventListener('click', (e) => {
      e.stopPropagation();
      if (cta.classList.contains('is-ready')) {
        this.handleEnter();
      } else if (cta.classList.contains('is-skip')) {
        this.skipToLastCard();
      }
    });
    group.appendChild(cta);
    this.ctaBtn = cta;

    header.appendChild(group);
    this.refreshCta();
    return header;
  }

  buildCard(card, idx) {
    const cardEl = document.createElement('article');
    cardEl.className = 'loading-card';
    cardEl.dataset.cardIndex = String(idx);
    cardEl.dataset.state = 'hidden';
    // Drag offsets are folded into the transform; default 0 until the
    // user moves the card via pointer drag.
    cardEl.style.setProperty('--drag-x', '0px');
    cardEl.style.setProperty('--drag-y', '0px');

    const labelEl = document.createElement('header');
    labelEl.className = 'loading-card-label';
    labelEl.textContent = card.label;
    cardEl.appendChild(labelEl);

    const body = document.createElement('div');
    body.className = 'loading-card-body';
    for (const line of card.body) {
      const p = document.createElement('p');
      // Pull-quote treatment: lines that open with a straight or curly
      // double-quote are the source-quoted ones. The card-3 line
      // '"perhaps offering a Yelp review for passing comrades."' gets
      // italic + indent + green left-border treatment via .is-quote.
      const trimmed = line.trim();
      if (trimmed.startsWith('"') || trimmed.startsWith('“')) {
        p.classList.add('is-quote');
      }
      p.textContent = line;
      body.appendChild(p);
    }
    cardEl.appendChild(body);

    this.makeCardDraggable(cardEl);
    return cardEl;
  }

  // Pointer drag: tap-without-movement still advances (the existing
  // overlay click handler runs on the synthetic click that fires
  // after pointerup). A drag past the threshold sets dragJustEnded
  // so the overlay handler bails out, leaving the card at its new
  // offset. Dragging is gated on data-state='visible' so reveal-time
  // pointer slips don't displace cards mid-animation.
  makeCardDraggable(cardEl) {
    let dragging = false;
    let dragMoved = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let baseDeltaX = 0;
    let baseDeltaY = 0;

    const DRAG_THRESHOLD_PX = 5;

    const onPointerDown = (e) => {
      if (cardEl.dataset.state !== 'visible') return;
      if (this.entered) return;

      dragging = true;
      dragMoved = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;

      // Resume from the card's current drag offsets so successive
      // drags accumulate rather than snapping back to origin.
      const xRaw = cardEl.style.getPropertyValue('--drag-x') || '0px';
      const yRaw = cardEl.style.getPropertyValue('--drag-y') || '0px';
      baseDeltaX = parseFloat(xRaw) || 0;
      baseDeltaY = parseFloat(yRaw) || 0;

      try {
        cardEl.setPointerCapture(pointerId);
      } catch {
        // setPointerCapture can throw on older Safari; harmless.
      }

      cardEl.style.zIndex = String(this.bumpCardZIndex());
    };

    const onPointerMove = (e) => {
      if (!dragging || e.pointerId !== pointerId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (
        !dragMoved &&
        (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX)
      ) {
        dragMoved = true;
        cardEl.classList.add('is-dragging');
      }

      if (dragMoved) {
        cardEl.style.setProperty('--drag-x', `${baseDeltaX + dx}px`);
        cardEl.style.setProperty('--drag-y', `${baseDeltaY + dy}px`);
      }
    };

    const onPointerUp = (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      dragging = false;

      try {
        cardEl.releasePointerCapture(pointerId);
      } catch {
        // already released — fine
      }
      pointerId = null;

      if (dragMoved) {
        cardEl.classList.remove('is-dragging');
        // Block the synthetic click that fires after pointerup so
        // the advance handler doesn't run after a drag. Cleared in
        // the next task tick — by then the click event has already
        // dispatched (click fires within the same task as pointerup
        // on every browser tested), so a follow-up tap-no-drag still
        // advances normally.
        cardEl.dataset.dragJustEnded = 'true';
        setTimeout(() => {
          delete cardEl.dataset.dragJustEnded;
        }, 0);
      }
    };

    cardEl.addEventListener('pointerdown', onPointerDown);
    cardEl.addEventListener('pointermove', onPointerMove);
    cardEl.addEventListener('pointerup', onPointerUp);
    cardEl.addEventListener('pointercancel', onPointerUp);
  }

  bumpCardZIndex() {
    if (typeof this._cardZCounter !== 'number') this._cardZCounter = 10;
    this._cardZCounter += 1;
    return this._cardZCounter;
  }

  buildRat() {
    // A small crew of rats (path + license: see RAT_PATH_D). Each
    // svg is one rat; runRat() picks how many join a pass and
    // staggers/varies them so the crossing reads as scuttling, not
    // a marquee. The inner <g class="rat-body"> carries the bob
    // animation separately from the svg's translate keyframes.
    const wrap = document.createElement('div');
    wrap.className = 'loading-rat';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.dataset.direction = 'ltr';
    wrap.innerHTML = RAT_WIDTHS.map(
      (w) => `
      <svg viewBox="${RAT_VIEWBOX}" width="${w}" preserveAspectRatio="xMidYMax meet">
        <g class="rat-body">
          <path fill="currentColor" fill-rule="evenodd" d="${RAT_PATH_D}"/>
        </g>
      </svg>`
    ).join('');
    return wrap;
  }

  // ---- card sequence ----

  advanceCard() {
    const total = this.cardEls.length;
    if (this.cardIndex >= total - 1) return;
    this.cardIndex += 1;

    if (this.advanceTimer) {
      clearTimeout(this.advanceTimer);
      this.advanceTimer = null;
    }

    const cardEl = this.cardEls[this.cardIndex];
    cardEl.dataset.state = 'visible';
    if (this.el) this.el.dataset.state = `card-${this.cardIndex + 1}`;

    if (this.cardIndex < total - 1) {
      this.advanceTimer = setTimeout(() => this.advanceCard(), CARD_ADVANCE_MS);
    } else {
      this.refreshCta();
    }
  }

  skipToLastCard() {
    if (this.advanceTimer) {
      clearTimeout(this.advanceTimer);
      this.advanceTimer = null;
    }
    for (let i = this.cardIndex + 1; i < this.cardEls.length; i++) {
      this.cardEls[i].dataset.state = 'visible';
    }
    this.cardIndex = this.cardEls.length - 1;
    if (this.el) this.el.dataset.state = `card-${this.cardIndex + 1}`;
    this.refreshCta();
  }

  // ---- loading status ----

  startStatusCycle() {
    const messages = LOADING_NARRATIVE.loadingMessages;
    if (!messages || messages.length === 0) return;
    this.statusMsgIndex = 0;
    this.typeMessage(messages[this.statusMsgIndex]);
    this.statusTimer = setInterval(() => {
      this.statusMsgIndex = (this.statusMsgIndex + 1) % messages.length;
      this.typeMessage(messages[this.statusMsgIndex]);
    }, STATUS_CYCLE_MS);

    this.preloadFallbackTimer = setTimeout(() => {
      if (!this.audioReady) this.setAudioReady();
    }, PRELOAD_FALLBACK_MS);
  }

  typeMessage(msg) {
    if (!this.statusEl) return;
    for (const t of this.typewriterTimers) clearTimeout(t);
    this.typewriterTimers = [];
    this.statusEl.textContent = '';
    if (!msg) return;
    const stepMs = Math.max(8, Math.floor(TYPEWRITER_TOTAL_MS / msg.length));
    for (let i = 0; i < msg.length; i++) {
      const t = setTimeout(() => {
        if (this.statusEl) this.statusEl.textContent = msg.slice(0, i + 1);
      }, i * stepMs);
      this.typewriterTimers.push(t);
    }
  }

  // ---- audio readiness ----

  subscribePreload() {
    // Loading screen owns the preload kickoff. engine.preload is
    // idempotent — calling it from main.js too returns the same
    // promise. Errors fall through to the same setAudioReady so the
    // user can still try Enter (in which case engine.start() will
    // surface the actual error if it persists).
    engine
      .preload()
      .then(() => {
        if (!this.audioReady) this.setAudioReady();
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Audio preload failed:', e);
        if (!this.audioReady) this.setAudioReady();
      });
  }

  setAudioReady() {
    this.audioReady = true;
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
    if (this.preloadFallbackTimer) {
      clearTimeout(this.preloadFallbackTimer);
      this.preloadFallbackTimer = null;
    }
    this.typeMessage(LOADING_NARRATIVE.readyMessage);
    this.refreshCta();

    // "The rats are ready" gets a visual beat: a crew scuttles
    // across immediately instead of waiting out the idle interval.
    // Skip if a run is already mid-crossing.
    const ratEl = this.el?.querySelector('.loading-rat');
    if (ratEl && !ratEl.classList.contains('is-running')) {
      if (this.ratTimer) clearTimeout(this.ratTimer);
      this.runRat();
    }
  }

  refreshCta() {
    if (!this.ctaBtn) return;
    // Three states of the one header button:
    //   skip    — cards still playing: acts as "skip →"
    //   waiting — on the last card but audio not loaded: shows the
    //             CTA label, disabled/dim
    //   ready   — enterable: accent + pulse
    const onLastCard = this.isReturning || this.cardIndex >= this.cardEls.length - 1;
    const ready = this.audioReady && onLastCard;
    const skippable = !ready && !onLastCard;
    this.ctaBtn.disabled = !ready && !skippable;
    this.ctaBtn.classList.toggle('is-ready', ready);
    this.ctaBtn.classList.toggle('is-skip', skippable);
    this.ctaBtn.textContent = skippable ? 'skip →' : this.ctaLabel;
  }

  // ---- rat silhouette scheduling ----

  scheduleRat() {
    const range = RAT_MAX_INTERVAL_MS - RAT_MIN_INTERVAL_MS;
    const delay = RAT_MIN_INTERVAL_MS + Math.random() * range;
    this.ratTimer = setTimeout(() => this.runRat(), delay);
  }

  runRat() {
    const ratEl = this.el?.querySelector('.loading-rat');
    if (!ratEl) return;
    this.ratDirection = -this.ratDirection;
    ratEl.dataset.direction = this.ratDirection > 0 ? 'ltr' : 'rtl';

    // Scuttle crew: 1..3 rats per pass. Followers start on a
    // stagger and each rat gets its own crossing tempo and bob
    // rhythm, so a group reads as animals following each other
    // rather than a sprite strip. Inline longhands override the
    // stylesheet's animation shorthand.
    const svgs = Array.from(ratEl.querySelectorAll('svg'));
    const count = 1 + Math.floor(Math.random() * svgs.length);
    let longest = 0;
    svgs.forEach((svg, i) => {
      const included = i < count;
      svg.style.display = included ? '' : 'none';
      if (!included) return;
      const delay = i === 0 ? 0 : Math.round(i * 320 + Math.random() * 600);
      // Reduced motion: fixed slow crossing (matches the old 9s
      // stylesheet accommodation, which inline durations would
      // otherwise override); the bob is disabled in CSS.
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 9000
        : Math.round(RAT_DURATION_MS * (0.85 + Math.random() * 0.35));
      svg.style.animationDelay = `${delay}ms`;
      svg.style.animationDuration = `${duration}ms`;
      svg.style.setProperty('--bob-duration', `${200 + Math.round(Math.random() * 120)}ms`);
      svg.style.setProperty('--bob-delay', `-${Math.round(Math.random() * 200)}ms`);
      longest = Math.max(longest, delay + duration);
    });

    // Force a reflow so the next class addition restarts the animation.
    ratEl.classList.remove('is-running');
    void ratEl.offsetWidth;
    ratEl.classList.add('is-running');

    this.ratClearTimer = setTimeout(() => {
      ratEl.classList.remove('is-running');
      this.scheduleRat();
    }, longest + 100);
  }

  // ---- entry transition ----

  handleEnter() {
    if (this.entered) return;
    if (this.ctaBtn?.disabled) return;
    this.entered = true;
    this.markEntered();
    if (this.el) this.el.dataset.state = 'entering';

    if (typeof this.onEnter === 'function') {
      try {
        this.onEnter();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('LoadingScreen onEnter handler threw:', e);
      }
    }

    setTimeout(() => this.unmount(), FADE_OUT_MS);
  }

  unmount() {
    if (this.advanceTimer) clearTimeout(this.advanceTimer);
    if (this.statusTimer) clearInterval(this.statusTimer);
    if (this.preloadFallbackTimer) clearTimeout(this.preloadFallbackTimer);
    if (this.ratTimer) clearTimeout(this.ratTimer);
    if (this.ratClearTimer) clearTimeout(this.ratClearTimer);
    for (const t of this.typewriterTimers) clearTimeout(t);
    this.typewriterTimers = [];
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
  }
}
