export class Subtitles {
  constructor(text) {
    this.element = document.createElement('div');
    this.element.className = 'subtitles';
    this.element.setAttribute('aria-live', 'polite');
    this.render(text);
  }

  render(text) {
    this.element.textContent = text;
  }
}
