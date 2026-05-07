import { HeadphonesTag } from './components/headphones-tag.js';

document.addEventListener('DOMContentLoaded', () => {
  const tag = new HeadphonesTag(document.body);
  tag.init();
});
