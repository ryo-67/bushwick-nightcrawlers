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
    this.clear();
  }

  get element() {
    return this.canvas;
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
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = ACTIVE_STROKE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const len = values.length;
    if (len === 0) {
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
    } else {
      for (let i = 0; i < len; i += 1) {
        const x = (i / (len - 1)) * width;
        const y = ((1 - values[i]) / 2) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
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
