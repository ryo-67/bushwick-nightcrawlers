import { HeadphonesTag } from './components/headphones-tag.js';

document.addEventListener('DOMContentLoaded', () => {
  const tag = new HeadphonesTag(document.body);
  tag.init();
});

document.addEventListener('keydown', (event) => {
  const pin = event.target.closest?.('.pin');
  if (!pin) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    pin.click();
  }
});
