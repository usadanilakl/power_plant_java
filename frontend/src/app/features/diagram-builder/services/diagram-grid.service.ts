import { Injectable, signal } from '@angular/core';

@Injectable()
export class DiagramGridService {
  readonly gridVisible = signal(true);
  readonly snapEnabled = signal(false);
  readonly gridSize = signal(20);

  drawGrid(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    scale: number
  ): void {
    if (!this.gridVisible()) return;

    const size = this.gridSize();
    ctx.save();

    const dotRadius = Math.max(0.5, 1 / scale);
    ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';

    for (let x = 0; x <= canvasWidth; x += size) {
      for (let y = 0; y <= canvasHeight; y += size) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  snapPosition(x: number, y: number): { x: number; y: number } {
    if (!this.snapEnabled()) return { x, y };
    const size = this.gridSize();
    return {
      x: Math.round(x / size) * size,
      y: Math.round(y / size) * size,
    };
  }

  snapDimension(value: number): number {
    if (!this.snapEnabled()) return value;
    const size = this.gridSize();
    return Math.max(size, Math.round(value / size) * size);
  }

  toggleGrid(): void {
    this.gridVisible.update(v => !v);
  }

  toggleSnap(): void {
    this.snapEnabled.update(v => !v);
  }

  setGridSize(size: number): void {
    this.gridSize.set(Math.max(5, size));
  }
}
