export class Subtitles {
  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'subtitles';
    this.element.setAttribute('aria-live', 'polite');
  }

  render(text) {
    this.element.textContent = text;
  }

  clear() {
    this.element.textContent = '';
  }
}
