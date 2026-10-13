/**
 * redacted-photo.js — stand-in for a venue with no usable photo.
 *
 * A blacked-out evidence frame: a column of redaction bars where the
 * photo would be, the closure-stamp red label across it, and a
 * whisper of a caption in the corner. Copy lives in venues.js
 * (`photoRedacted: { stamp, note }`) so it's edited with the rest of
 * the venue content.
 */

// Relative bar widths (percent of the frame's inner width). Fixed,
// not random: the redaction reads the same on every hover.
const BAR_WIDTHS = [86, 62, 91, 48, 77, 69, 88, 41, 73];

export function buildRedactedPhoto({ stamp, note }, className) {
  const frame = document.createElement('div');
  frame.className = `redacted-photo ${className}`;
  frame.setAttribute('role', 'img');
  frame.setAttribute('aria-label', [stamp, note].filter(Boolean).join(' — '));

  const bars = document.createElement('div');
  bars.className = 'redacted-photo-bars';
  bars.setAttribute('aria-hidden', 'true');
  for (const width of BAR_WIDTHS) {
    const bar = document.createElement('span');
    bar.style.width = `${width}%`;
    bars.appendChild(bar);
  }
  frame.appendChild(bars);

  if (stamp) {
    const label = document.createElement('span');
    label.className = 'redacted-photo-stamp';
    label.setAttribute('aria-hidden', 'true');
    label.textContent = stamp;
    frame.appendChild(label);
  }

  if (note) {
    const caption = document.createElement('span');
    caption.className = 'redacted-photo-note';
    caption.setAttribute('aria-hidden', 'true');
    caption.textContent = note;
    frame.appendChild(caption);
  }

  return frame;
}
