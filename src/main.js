import { HeadphonesTag } from './components/headphones-tag.js';
import { Modal } from './components/modal.js';
import { rats } from './content/rats.js';
import { venues } from './content/venues.js';
import { reviews } from './content/reviews.js';

document.addEventListener('DOMContentLoaded', () => {
  const tag = new HeadphonesTag(document.body);
  tag.init();

  const modalRoot = document.getElementById('modal-root');
  const modal = new Modal(modalRoot, { rats, venues, reviews });

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
