import { Injectable, signal } from '@angular/core';
import { DiagramElement, DiagramSymbolShape, DiagramToolType } from '../models/diagram-shape.model';
import { PIDSymbol } from '../../../shared/image/refactored/services/pid-symbols.service';

export interface TransformState {
  scale: number;
  pointX: number;
  pointY: number;
}

interface DrawingState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

@Injectable()
export class DiagramDrawingService {
  readonly activeTool = signal<DiagramToolType>('select');
  readonly selectedSymbol = signal<PIDSymbol | null>(null);
  private drawingState: DrawingState | null = null;

  setTool(tool: DiagramToolType): void {
    this.activeTool.set(tool);
    if (tool !== 'place-symbol') {
      this.selectedSymbol.set(null);
    }
  }

  selectSymbol(symbol: PIDSymbol): void {
    this.selectedSymbol.set(symbol);
    this.activeTool.set('place-symbol');
  }

  // --- Coordinate conversion ---

  clientToCanvasCoords(
    clientX: number,
    clientY: number,
    canvasRect: DOMRect,
    transform: TransformState
  ): { x: number; y: number } {
    const relX = clientX - canvasRect.left;
    const relY = clientY - canvasRect.top;
    return {
      x: (relX - transform.pointX) / transform.scale,
      y: (relY - transform.pointY) / transform.scale,
    };
  }

  // --- Drawing lifecycle ---

  startDrawing(canvasX: number, canvasY: number): void {
    this.drawingState = {
      startX: canvasX,
      startY: canvasY,
      currentX: canvasX,
      currentY: canvasY,
    };
  }

  updateDrawing(canvasX: number, canvasY: number): void {
    if (this.drawingState) {
      this.drawingState.currentX = canvasX;
      this.drawingState.currentY = canvasY;
    }
  }

  finishDrawing(): DiagramElement | null {
    if (!this.drawingState) return null;

    const { startX, startY, currentX, currentY } = this.drawingState;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    this.drawingState = null;

    if (width < 5 && height < 5) return null;

    const tool = this.activeTool();
    const symbol = this.selectedSymbol();

    switch (tool) {
      case 'draw-rectangle':
        return {
          id: 0, type: 'rectangle',
          x, y, width, height,
          color: '#ffffff', lineWidth: 2,
        };
      case 'draw-circle':
        return {
          id: 0, type: 'circle',
          x, y, width, height,
          color: '#ffffff', lineWidth: 2,
        };
      case 'draw-line':
        return {
          id: 0, type: 'line',
          x, y, width, height,
          startX,
          startY,
          endX: currentX,
          endY: currentY,
          color: '#ffffff',
          lineWidth: 2,
        };
      case 'place-symbol':
        if (!symbol) return null;
        // Maintain aspect ratio
        const aspectRatio = symbol.originalWidth / symbol.originalHeight;
        const symWidth = Math.max(width, height * aspectRatio);
        const symHeight = symWidth / aspectRatio;
        return {
          id: 0, type: 'symbol',
          x, y,
          width: symWidth, height: symHeight,
          color: '#ffffff', lineWidth: 2,
          symbolId: symbol.id,
          svgPath: symbol.svgPath,
          originalWidth: symbol.originalWidth,
          originalHeight: symbol.originalHeight,
        } as DiagramSymbolShape;
      case 'draw-text':
        return {
          id: 0, type: 'text',
          x, y, width: 100, height: 20,
          text: 'Text', fontSize: 14,
          color: '#ffffff',
        } as any;
      default:
        return null;
    }
  }

  // --- Preview drawing on temp canvas ---

  drawPreview(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (!this.drawingState) return;

    const { startX, startY, currentX, currentY } = this.drawingState;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);
    const tool = this.activeTool();

    ctx.save();
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);

    switch (tool) {
      case 'draw-rectangle':
      case 'place-symbol':
      case 'draw-text':
        ctx.strokeRect(x, y, w, h);
        break;
      case 'draw-circle':
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'draw-line':
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        break;
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  isDrawingTool(): boolean {
    const tool = this.activeTool();
    return tool !== 'select' && tool !== 'draw-connection';
  }

  isDrawing(): boolean {
    return this.drawingState !== null;
  }

  cancelDrawing(): void {
    this.drawingState = null;
  }
}
