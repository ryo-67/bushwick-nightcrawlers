export class Oscilloscope {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'oscilloscope';
    this.canvas.width = 640;
    this.canvas.height = 120;
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    this.clear();
  }

  get element() {
    return this.canvas;
  }

  clear() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.strokeStyle = 'rgba(10, 10, 10, 0.35)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();
  }
}
