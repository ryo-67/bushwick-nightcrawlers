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
    this.skipBtn = null;
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
    el.appendChild(this.buildHeader({ withSkip: true }));

    const cards = document.createElement('div');
    cards.className = 'loading-cards';
    LOADING_NARRATIVE.cards.forEach((card, idx) => {
      const cardEl = this.buildCard(card, idx);
      cards.appendChild(cardEl);
      this.cardEls.push(cardEl);
    });
    el.appendChild(cards);

    el.appendChild(this.buildRat());
    el.appendChild(this.buildFooter({ ctaLabel: LOADING_NARRATIVE.cta }));

    // Tap anywhere on the overlay (outside CTA / skip) advances cards.
    this.advanceClickHandler = (e) => {
      if (e.target.closest('.loading-cta')) return;
      if (e.target.closest('.loading-skip')) return;
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
    el.appendChild(this.buildHeader({ withSkip: false }));

    const center = document.createElement('div');
    center.className = 'loading-returning';

    const greeting = document.createElement('p');
    greeting.className = 'loading-greeting';
    greeting.textContent = LOADING_NARRATIVE.returningGreeting;
    center.appendChild(greeting);

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'loading-cta';
    cta.disabled = true;
    cta.textContent = LOADING_NARRATIVE.returningCta;
    cta.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleEnter();
    });
    center.appendChild(cta);
    this.ctaBtn = cta;
    el.appendChild(center);

    el.appendChild(this.buildRat());
    el.appendChild(this.buildFooter({ ctaLabel: null }));

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

  buildHeader({ withSkip }) {
    const header = document.createElement('header');
    header.className = 'loading-header';

    const title = document.createElement('h1');
    title.className = 'loading-title';
    title.id = 'loading-title';
    title.textContent = LOADING_NARRATIVE.title;
    header.appendChild(title);

    if (withSkip) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = 'loading-skip';
      skip.textContent = 'skip →';
      skip.addEventListener('click', (e) => {
        e.stopPropagation();
        this.skipToLastCard();
      });
      header.appendChild(skip);
      this.skipBtn = skip;
    }
    return header;
  }

  buildCard(card, idx) {
    const cardEl = document.createElement('article');
    cardEl.className = 'loading-card';
    cardEl.dataset.cardIndex = String(idx);
    cardEl.dataset.state = 'hidden';

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
    return cardEl;
  }

  buildRat() {
    // Inline placeholder silhouette per the prompt; a real illustration
    // can replace this asset later. Using `currentColor` lets the
    // newsprint tint flow from the parent container.
    const wrap = document.createElement('div');
    wrap.className = 'loading-rat';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.dataset.direction = 'ltr';
    wrap.innerHTML = `
      <svg viewBox="0 0 40 16" width="40" height="16" preserveAspectRatio="xMidYMid meet">
        <path d="M2 12 Q4 8 8 8 L20 8 Q26 8 30 6 Q34 4 36 4 L38 4 L38 6 L36 6 Q34 6 32 8 L24 10 L20 12 L8 12 Q4 12 2 12 Z" fill="currentColor" opacity="0.6"/>
        <path d="M38 4 Q40 4 40 6" stroke="currentColor" stroke-width="0.5" fill="none" opacity="0.6"/>
        <circle cx="34" cy="5" r="0.5" class="loading-rat-eye"/>
      </svg>
    `;
    return wrap;
  }

  buildFooter({ ctaLabel }) {
    const footer = document.createElement('footer');
    footer.className = 'loading-footer';

    const status = document.createElement('p');
    status.className = 'loading-status';
    status.setAttribute('aria-live', 'polite');
    footer.appendChild(status);
    this.statusEl = status;

    if (ctaLabel) {
      const cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'loading-cta';
      cta.disabled = true;
      cta.textContent = ctaLabel;
      cta.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleEnter();
      });
      footer.appendChild(cta);
      this.ctaBtn = cta;
    }
    return footer;
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
  }

  refreshCta() {
    if (!this.ctaBtn) return;
    const onLastCard = this.isReturning || this.cardIndex >= this.cardEls.length - 1;
    const ready = this.audioReady && onLastCard;
    this.ctaBtn.disabled = !ready;
    this.ctaBtn.classList.toggle('is-ready', ready);
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
    // Force a reflow so the next class addition restarts the animation.
    ratEl.classList.remove('is-running');
    void ratEl.offsetWidth;
    ratEl.classList.add('is-running');

    this.ratClearTimer = setTimeout(() => {
      ratEl.classList.remove('is-running');
      this.scheduleRat();
    }, RAT_DURATION_MS + 100);
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
