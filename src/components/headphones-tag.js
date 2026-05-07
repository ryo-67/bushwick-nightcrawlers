const STORAGE_KEY = 'bushwick.headphones.dismissed';

export class HeadphonesTag {
  constructor(root) {
    this.root = root;
    this.overlayEl = null;
    this.badgeEl = null;
  }

  init() {
    const dismissed = this.readDismissed();
    if (dismissed) {
      this.renderBadge();
    } else {
      this.renderOverlay();
    }
  }

  readDismissed() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  writeDismissed() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable (private mode, etc.) — silently degrade
    }
  }

  renderOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'headphones-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'headphones-overlay-title');

    const card = document.createElement('div');
    card.className = 'headphones-overlay-card';

    const title = document.createElement('h2');
    title.className = 'headphones-overlay-title';
    title.id = 'headphones-overlay-title';
    title.textContent = '🎧 Headphones recommended';

    const text = document.createElement('p');
    text.className = 'headphones-overlay-text';
    text.textContent = "This piece is built on detail. Speakers will work but you'll lose half of it.";

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'headphones-overlay-button';
    button.textContent = 'Got it';
    button.addEventListener('click', () => this.dismissOverlay());

    card.append(title, text, button);
    overlay.appendChild(card);
    this.root.appendChild(overlay);
    this.overlayEl = overlay;
  }

  dismissOverlay() {
    this.writeDismissed();
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
    this.renderBadge();
  }

  renderBadge() {
    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = 'headphones-badge';
    badge.setAttribute('aria-label', 'Headphones recommended. Dismiss for this session.');
    badge.textContent = '🎧 headphones recommended';
    badge.addEventListener('click', () => this.dismissBadge());
    this.root.appendChild(badge);
    this.badgeEl = badge;
  }

  dismissBadge() {
    if (this.badgeEl) {
      this.badgeEl.remove();
      this.badgeEl = null;
    }
  }
}
