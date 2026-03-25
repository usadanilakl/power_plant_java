import { Injectable, signal } from '@angular/core';
import { AnchorPoint, DiagramConnection, DiagramPlacement } from '../models/diagram-placement.model';
import { DiagramRenderService } from './diagram-render.service';

export interface ConnectionDrawState {
  sourceAnchor: AnchorPoint;
  currentX: number;
  currentY: number;
}

@Injectable()
export class DiagramConnectionService {
  readonly isDrawingConnection = signal(false);
  private drawState: ConnectionDrawState | null = null;

  constructor(private renderService: DiagramRenderService) {}

  startConnection(anchor: AnchorPoint): void {
    this.drawState = {
      sourceAnchor: anchor,
      currentX: anchor.x,
      currentY: anchor.y,
    };
    this.isDrawingConnection.set(true);
  }

  updateConnection(canvasX: number, canvasY: number): void {
    if (this.drawState) {
      this.drawState.currentX = canvasX;
      this.drawState.currentY = canvasY;
    }
  }

  finishConnection(targetAnchor: AnchorPoint): DiagramConnection | null {
    if (!this.drawState) return null;

    const { sourceAnchor } = this.drawState;

    // Don't connect shape to itself
    if (sourceAnchor.placementId === targetAnchor.placementId) {
      this.cancelConnection();
      return null;
    }

    this.drawState = null;
    this.isDrawingConnection.set(false);

    return {
      id: 0,
      sourcePlacementId: sourceAnchor.placementId,
      targetPlacementId: targetAnchor.placementId,
      sourceAnchor: sourceAnchor.position,
      targetAnchor: targetAnchor.position,
      lineStyle: 'solid',
      lineWidth: 2,
      color: '#888888',
    };
  }

  cancelConnection(): void {
    this.drawState = null;
    this.isDrawingConnection.set(false);
  }

  drawPreview(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this.drawState) return;

    const { sourceAnchor, currentX, currentY } = this.drawState;

    ctx.save();
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(sourceAnchor.x, sourceAnchor.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw source anchor indicator
    ctx.beginPath();
    ctx.arc(sourceAnchor.x, sourceAnchor.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#4fc3f7';
    ctx.fill();

    ctx.restore();
  }

  getDrawState(): ConnectionDrawState | null {
    return this.drawState;
  }
}
