import { HeadphonesTag } from './components/headphones-tag.js';
import { Modal } from './components/modal.js';
import { rats } from './content/rats.js';
import { venues } from './content/venues.js';
import { reviews } from './content/reviews.js';

const VIEWPORT_MARGIN = 12;

function setupPinTooltip() {
  const tooltip = document.createElement('div');
  tooltip.className = 'pin-tooltip';
  tooltip.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tooltip);

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
      img.addEventListener('error', () => img.remove());
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
    // Reveal at off-screen position to measure, then place.
    tooltip.style.left = '-9999px';
    tooltip.style.top = '-9999px';
    tooltip.classList.add('is-visible');

    const pinRect = pin.getBoundingClientRect();
    const ttRect = tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pinCenterX = pinRect.left + pinRect.width / 2;

    // Vertical: above by default; flip below if it would clip the top.
    let placement = 'above';
    let top = pinRect.top - ttRect.height - VIEWPORT_MARGIN;
    if (top < VIEWPORT_MARGIN) {
      placement = 'below';
      top = pinRect.bottom + VIEWPORT_MARGIN;
    }
    // If bottom-flip also clips off the bottom (very tall tooltip on tiny viewport),
    // clamp to whichever has more room.
    if (placement === 'below' && top + ttRect.height > vh - VIEWPORT_MARGIN) {
      const aboveSpace = pinRect.top;
      const belowSpace = vh - pinRect.bottom;
      if (aboveSpace > belowSpace) {
        placement = 'above';
        top = Math.max(VIEWPORT_MARGIN, pinRect.top - ttRect.height - VIEWPORT_MARGIN);
      }
    }

    // Horizontal: center on pin, then clamp to viewport.
    let left = pinCenterX - ttRect.width / 2;
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
    if (left + ttRect.width > vw - VIEWPORT_MARGIN) {
      left = vw - ttRect.width - VIEWPORT_MARGIN;
    }

    // Notch points at the pin's center, clamped inside the tooltip's edges.
    const notchPadding = 14;
    const notchX = Math.max(
      notchPadding,
      Math.min(ttRect.width - notchPadding, pinCenterX - left)
    );

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.dataset.placement = placement;
    tooltip.style.setProperty('--notch-x', `${notchX}px`);
  }

  function show(pin) {
    if (isPointerCoarse()) return;
    const venue = venues[pin.dataset.pinId];
    if (!venue) return;
    populate(venue);
    position(pin);
  }

  function hide() {
    tooltip.classList.remove('is-visible');
  }

  document.querySelectorAll('.pin').forEach((pin) => {
    pin.addEventListener('pointerenter', () => show(pin));
    pin.addEventListener('pointerleave', hide);
    pin.addEventListener('focus', () => show(pin));
    pin.addEventListener('blur', hide);
  });

  return { hide };
}

document.addEventListener('DOMContentLoaded', () => {
  const tag = new HeadphonesTag(document.body);
  tag.init();

  const modalRoot = document.getElementById('modal-root');
  const modal = new Modal(modalRoot, { rats, venues, reviews });

  const tooltip = setupPinTooltip();

  const mapWrapper = document.querySelector('.map-wrapper') || document.body;
  mapWrapper.addEventListener('click', (event) => {
    const pin = event.target.closest?.('.pin');
    if (!pin) return;
    const pinId = pin.dataset.pinId;
    if (!pinId) return;
    tooltip.hide();
    modal.open(pinId);
  });
});

document.addEventListener('keydown', (event) => {
  const pin = event.target.closest?.('.pin');
  if (!pin) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    pin.click();
  }
});
