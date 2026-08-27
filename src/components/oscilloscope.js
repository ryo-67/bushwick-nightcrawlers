/**
 * src/components/oscilloscope.js — live waveform visualization.
 *
 * Construction is cheap: just the canvas, idle baseline. The audio
 * tap is wired later via attach(toneNode), once the engine has a
 * ratGain to expose.
 *
 * Lifecycle:
 *   attach(toneNode) — connects toneNode → Tone.Waveform analyser.
 *                      Idempotent. Re-attaching swaps the source.
 *   start()          — begins the requestAnimationFrame draw loop.
 *   stop()           — cancels RAF, draws flat baseline.
 *   dispose()        — stops, disposes the analyser, drops the
 *                      attached-node reference. Call on modal close.
 */

const ACTIVE_STROKE = 'rgba(184, 255, 0, 0.85)';
const IDLE_STROKE = 'rgba(197, 191, 174, 0.4)';

// V47: adaptive normalization replaces the fixed amplitude scale.
// The analyser taps a point in the chain whose level varies with
// master gain and the rat's recency-ladder rank — any fixed
// multiplier is either flat for quiet rats or pinned for loud
// ones. Instead the draw normalizes against a slow-decaying
// running peak, so the loudest recent squeak reaches HEADROOM of
// the strip regardless of chain gain, and true silence stays flat
// (PEAK_FLOOR stops the normalizer from amplifying the noise
// floor to full scale).
const HEADROOM = 0.78;
// Expansion curve on the normalized level: >1 suppresses mid
// levels relative to peaks, so spikes stand sharply off the
// valleys instead of everything rendering as similar humps.
const SHAPE_EXP = 1.6;
const PEAK_DECAY = 0.998; // per frame (~60fps): adapts over ~5s
const PEAK_FLOOR = 0.01;

// V46: envelope rendering. A raw 1024-sample trace of pitched USV
// content packs hundreds of oscillations into the strip — visual
// noise with illegible peaks. Instead the buffer is folded into
// BUCKETS peak-amplitude columns and drawn as a smooth mirrored
// envelope, so the strip shows a few readable humps per squeak.
const BUCKETS = 64;
// Meter ballistics: rise fast so onsets land on the beat, fall
// slowly so the shape decays instead of flickering frame-to-frame.
const EASE_RISE = 0.85;
const EASE_FALL = 0.1;
const ACTIVE_FILL = 'rgba(184, 255, 0, 0.16)';

export class Oscilloscope {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'oscilloscope';
    this.canvas.width = 640;
    this.canvas.height = 120;
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    this.analyser = null;
    this.rafId = null;
    this.attachedNode = null;
    // Eased display levels, one per envelope bucket (see draw()).
    this.levels = new Float32Array(BUCKETS);
    // Running raw peak for the adaptive normalizer.
    this.runningPeak = PEAK_FLOOR;
    // 'voice' (full drama) or 'ambient' (idle murmur of the master
    // bus — see setSourceMode).
    this.modeScale = 1;
    this.clear();
  }

  get element() {
    return this.canvas;
  }

  // V60: 'voice' draws at full scale; 'ambient' caps the envelope
  // low so the idle scope reads as the corner murmuring, not a
  // performance. Resets the normalizer — the two sources sit at
  // very different levels.
  setSourceMode(mode) {
    const scale = mode === 'ambient' ? 0.22 : 1;
    if (scale !== this.modeScale) {
      this.modeScale = scale;
      this.runningPeak = PEAK_FLOOR;
      this.levels.fill(0);
    }
  }

  attach(toneNode) {
    if (!toneNode) return;
    if (toneNode === this.attachedNode) return;
    const Tone = window.Tone;
    if (!this.analyser) {
      this.analyser = new Tone.Waveform(1024);
    }
    if (this.attachedNode) {
      try {
        this.attachedNode.disconnect(this.analyser);
      } catch {
        // already disconnected — fine
      }
    }
    toneNode.connect(this.analyser);
    this.attachedNode = toneNode;
  }

  start() {
    if (this.rafId !== null) return;
    const tick = () => {
      this.draw();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.levels.fill(0);
    this.runningPeak = PEAK_FLOOR;
    this.clear();
  }

  draw() {
    if (!this.analyser) {
      this.clear();
      return;
    }
    const values = this.analyser.getValue();
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const mid = height / 2;
    const len = values.length;

    // Fold samples into per-bucket peaks, update the adaptive
    // normalizer, and ease the displayed level toward each target
    // (fast rise, slow fall).
    const per = Math.max(1, Math.floor(len / BUCKETS));
    const bucketPeaks = new Float32Array(BUCKETS);
    let framePeak = 0;
    for (let b = 0; b < BUCKETS; b += 1) {
      let peak = 0;
      const start = b * per;
      const end = Math.min(len, start + per);
      for (let i = start; i < end; i += 1) {
        const a = Math.abs(values[i]);
        if (a > peak) peak = a;
      }
      bucketPeaks[b] = peak;
      if (peak > framePeak) framePeak = peak;
    }
    this.runningPeak = Math.max(
      framePeak,
      this.runningPeak * PEAK_DECAY,
      PEAK_FLOOR
    );
    const norm = HEADROOM / this.runningPeak;
    for (let b = 0; b < BUCKETS; b += 1) {
      const target = Math.pow(Math.min(1, bucketPeaks[b] * norm), SHAPE_EXP) * this.modeScale;
      const cur = this.levels[b];
      this.levels[b] = cur + (target - cur) * (target > cur ? EASE_RISE : EASE_FALL);
    }

    // Mirrored envelope: smooth top edge left→right, straight
    // vertical cap at the right, smooth bottom edge right→left,
    // vertical cap back at the left (via closePath). The caps
    // matter: bridging top→bottom with a curve draws rounded
    // corner blobs at the strip's ends. Silence eases back to the
    // flat midline.
    const xAt = (b) => (b / (BUCKETS - 1)) * width;
    const yTop = (b) => mid - this.levels[b] * (mid - 2);
    const yBot = (b) => mid + this.levels[b] * (mid - 2);
    const last = BUCKETS - 1;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(xAt(0), yTop(0));
    for (let b = 1; b < BUCKETS; b += 1) {
      const xc = (xAt(b - 1) + xAt(b)) / 2;
      const yc = (yTop(b - 1) + yTop(b)) / 2;
      ctx.quadraticCurveTo(xAt(b - 1), yTop(b - 1), xc, yc);
    }
    ctx.lineTo(xAt(last), yTop(last));
    ctx.lineTo(xAt(last), yBot(last));
    for (let b = BUCKETS - 2; b >= 0; b -= 1) {
      const xc = (xAt(b + 1) + xAt(b)) / 2;
      const yc = (yBot(b + 1) + yBot(b)) / 2;
      ctx.quadraticCurveTo(xAt(b + 1), yBot(b + 1), xc, yc);
    }
    ctx.lineTo(xAt(0), yBot(0));
    ctx.closePath();
    ctx.fillStyle = ACTIVE_FILL;
    ctx.fill();
    ctx.strokeStyle = ACTIVE_STROKE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  clear() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.strokeStyle = IDLE_STROKE;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();
  }

  dispose() {
    this.stop();
    if (this.attachedNode && this.analyser) {
      try {
        this.attachedNode.disconnect(this.analyser);
      } catch {
        // already disconnected
      }
    }
    if (this.analyser) {
      try {
        this.analyser.dispose();
      } catch {
        // already disposed
      }
      this.analyser = null;
    }
    this.attachedNode = null;
  }
}
