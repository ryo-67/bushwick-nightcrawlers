import { HeadphonesTag } from './components/headphones-tag.js';
import { Modal } from './components/modal.js';
import { rats } from './content/rats.js';
import { venues } from './content/venues.js';
import { reviews } from './content/reviews.js';

function buildPinTooltips() {
  document.querySelectorAll('.pin').forEach((pin) => {
    const id = pin.dataset.pinId;
    const venue = venues[id];
    if (!venue) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'pin-tooltip';
    tooltip.setAttribute('aria-hidden', 'true');

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

    pin.appendChild(tooltip);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const tag = new HeadphonesTag(document.body);
  tag.init();

  const modalRoot = document.getElementById('modal-root');
  const modal = new Modal(modalRoot, { rats, venues, reviews });

  buildPinTooltips();

  const mapWrapper = document.querySelector('.map-wrapper') || document.body;
  mapWrapper.addEventListener('click', (event) => {
    const pin = event.target.closest?.('.pin');
    if (!pin) return;
    const pinId = pin.dataset.pinId;
    if (!pinId) return;
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
