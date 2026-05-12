/**
 * src/debug/viewport-readout.js — V21 diagnostic overlay.
 *
 * Activated by `?debug=viewport` on the URL. Attaches a fixed
 * top-left readout inside the active modal-card showing layout
 * viewport, visual viewport, modal/card bounding rects, computed
 * heights, and safe-area inset values. Updates live on window
 * resize and visualViewport resize/scroll while the modal is open.
 *
 * Purpose: capture device-real measurements (iPhone Safari)
 * Shoro can screenshot from their phone, so V22 fixes the modal
 * bottom-bleed regression from evidence rather than guesses.
 *
 * Production path (no `?debug=viewport`): the install() function
 * bails on the first line; zero DOM nodes added, zero listeners
 * attached, zero visual change. Module is safe to ship as-is.
 *
 * Tap the readout to dismiss for the current session.
 */

const PARAM_NAME = 'debug';
const PARAM_VALUE = 'viewport';
const READOUT_ID = 'v21-viewport-readout';

let readoutEl = null;
let observer = null;
let dismissed = false;
const listeners = [];

function isEnabled() {
  return new URLSearchParams(location.search).get(PARAM_NAME) === PARAM_VALUE;
}

// Read env(safe-area-inset-*) via a probe element. CSS env() values
// are not directly exposed to JS; we resolve them by setting them
// on a hidden element's padding and reading getComputedStyle.
function readSafeAreaInset(which) {
  const probe = document.createElement('div');
  probe.style.cssText = `position:fixed;visibility:hidden;padding:env(safe-area-inset-${which})`;
  document.body.appendChild(probe);
  const value = parseFloat(getComputedStyle(probe).paddingTop);
  probe.remove();
  return Number.isFinite(value) ? value : 0;
}

function fmt(n) {
  return typeof n === 'number' ? Math.round(n * 100) / 100 : n;
}

function buildReadoutEl() {
  const el = document.createElement('div');
  el.id = READOUT_ID;
  el.style.cssText = [
    'position:absolute',
    'top:8px',
    'left:8px',
    'right:8px',
    'z-index:9999',
    'background:rgba(0,0,0,0.85)',
    'color:#b8ff00',
    'font-family:ui-monospace,SF Mono,Menlo,monospace',
    'font-size:11px',
    'line-height:1.4',
    'padding:8px 10px',
    'border:1px solid #b8ff00',
    'border-radius:4px',
    'pointer-events:auto',
    'user-select:text',
    '-webkit-user-select:text',
    'white-space:pre',
  ].join(';');
  el.addEventListener('click', () => {
    dismissed = true;
    teardown();
  });
  return el;
}

function snapshot() {
  const modal = document.getElementById('modal-root');
  const card = document.querySelector('.modal-card');
  const body = document.body;
  const main = document.querySelector('main');
  const vv = window.visualViewport;
  const modalRect = modal?.getBoundingClientRect();
  const cardRect = card?.getBoundingClientRect();
  return {
    innerH: window.innerHeight,
    innerW: window.innerWidth,
    vv_h: vv ? vv.height : null,
    vv_offT: vv ? vv.offsetTop : null,
    vv_scale: vv ? vv.scale : null,
    modal_top: modalRect ? modalRect.top : null,
    modal_bot: modalRect ? modalRect.bottom : null,
    card_top: cardRect ? cardRect.top : null,
    card_bot: cardRect ? cardRect.bottom : null,
    modal_h_css: modal ? getComputedStyle(modal).height : null,
    card_h_css: card ? getComputedStyle(card).height : null,
    body_h_css: getComputedStyle(body).height,
    main_h_css: main ? getComputedStyle(main).height : null,
    sai_top: readSafeAreaInset('top'),
    sai_bot: readSafeAreaInset('bottom'),
  };
}

function render() {
  if (!readoutEl) return;
  const s = snapshot();
  readoutEl.textContent = [
    `innerH/W:     ${s.innerH} / ${s.innerW}`,
    `vv h/offT/sc: ${fmt(s.vv_h)} / ${fmt(s.vv_offT)} / ${fmt(s.vv_scale)}`,
    `modal t/b:    ${fmt(s.modal_top)} / ${fmt(s.modal_bot)}`,
    `card  t/b:    ${fmt(s.card_top)} / ${fmt(s.card_bot)}`,
    `gap modal→vp: ${s.innerH - (s.modal_bot ?? 0)}`,
    `gap card→vp:  ${s.innerH - (s.card_bot ?? 0)}`,
    `gap card→mdl: ${(s.modal_bot ?? 0) - (s.card_bot ?? 0)}`,
    `modal h css:  ${s.modal_h_css}`,
    `card  h css:  ${s.card_h_css}`,
    `body  h css:  ${s.body_h_css}`,
    `main  h css:  ${s.main_h_css}`,
    `safe-area t/b:${s.sai_top} / ${s.sai_bot}`,
    '(tap to dismiss)',
  ].join('\n');
}

function attachListeners() {
  const onChange = () => render();
  window.addEventListener('resize', onChange);
  listeners.push(() => window.removeEventListener('resize', onChange));
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onChange);
    window.visualViewport.addEventListener('scroll', onChange);
    listeners.push(() => {
      window.visualViewport.removeEventListener('resize', onChange);
      window.visualViewport.removeEventListener('scroll', onChange);
    });
  }
}

function detachListeners() {
  while (listeners.length) listeners.pop()();
}

function mountIntoCurrentModal() {
  if (dismissed) return;
  const card = document.querySelector('.modal-card');
  if (!card) return;
  if (card.querySelector('#' + READOUT_ID)) return;
  readoutEl = buildReadoutEl();
  card.appendChild(readoutEl);
  render();
}

function teardown() {
  if (readoutEl?.parentNode) readoutEl.parentNode.removeChild(readoutEl);
  readoutEl = null;
  detachListeners();
}

// Watch #modal-root for state changes; when a modal opens, mount.
// When it closes, teardown.
function startObserving() {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;
  observer = new MutationObserver(() => {
    const open = modalRoot.dataset.state === 'open';
    if (open) {
      // The card is added inside the modal-root on open. Defer one
      // frame so the card exists before we query for it.
      requestAnimationFrame(() => {
        mountIntoCurrentModal();
        attachListeners();
      });
    } else {
      teardown();
    }
  });
  observer.observe(modalRoot, { attributes: true, attributeFilter: ['data-state'], childList: true });
}

export function install() {
  if (!isEnabled()) return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving, { once: true });
  } else {
    startObserving();
  }
}
