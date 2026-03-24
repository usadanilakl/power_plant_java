import { Injectable, inject } from '@angular/core';
import { DiagramConnection, DiagramElement } from '../../models/diagram-shape.model';
import { DiagramRenderService } from '../../services/diagram-render.service';
import { SimEdgeState, SimNodeState } from '../models/simulation.model';

@Injectable()
export class SimulationRenderService {
  private renderService = inject(DiagramRenderService);
  animationOffset = 0;
  private animFrameId = 0;

  drawOverlays(
    ctx: CanvasRenderingContext2D,
    shapes: DiagramElement[],
    connections: DiagramConnection[],
    nodeStates: SimNodeState[],
    edgeStates: SimEdgeState[],
    scale: number
  ): void {
    const nodeMap = new Map(nodeStates.map(n => [n.shapeId, n]));
    const edgeMap = new Map(edgeStates.map(e => [e.connectionId, e]));
    const shapeMap = new Map(shapes.map(s => [s.id, s]));

    // Draw connection overlays
    for (const conn of connections) {
      const edge = edgeMap.get(conn.id);
      if (edge) {
        this.drawConnectionOverlay(ctx, conn, edge, shapeMap, scale);
      }
    }

    // Draw node overlays
    for (const shape of shapes) {
      const state = nodeMap.get(shape.id);
      if (state) {
        this.drawNodeBadge(ctx, shape, state, scale);
        if (state.role === 'valve') this.drawValveIndicator(ctx, shape, state, scale);
        if (state.role === 'pump') this.drawPumpIndicator(ctx, shape, state, scale);
        if (state.role === 'source') this.drawSourceIndicator(ctx, shape, scale);
        if (state.role === 'sink') this.drawSinkIndicator(ctx, shape, scale);
      }
    }
  }

  private drawConnectionOverlay(
    ctx: CanvasRenderingContext2D,
    conn: DiagramConnection,
    edge: SimEdgeState,
    shapeMap: Map<number, DiagramElement>,
    scale: number
  ): void {
    const source = shapeMap.get(conn.sourceShapeId);
    const target = shapeMap.get(conn.targetShapeId);
    if (!source || !target) return;

    const sp = this.renderService.getAnchorPoint(source, conn.sourceAnchor);
    const tp = this.renderService.getAnchorPoint(target, conn.targetAnchor);

    ctx.save();
    ctx.lineWidth = 4 / scale;

    if (edge.isFlowing) {
      // Blue gradient based on flow intensity
      const intensity = Math.min(1, edge.flowRate / 15000);
      const r = Math.round(13 + (129 - 13) * (1 - intensity));
      const g = Math.round(71 + (212 - 71) * (1 - intensity));
      const b = Math.round(161 + (250 - 161) * (1 - intensity));
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.setLineDash([8 / scale, 12 / scale]);
      ctx.lineDashOffset = -this.animationOffset / scale;
    } else {
      ctx.strokeStyle = '#555';
      ctx.setLineDash([4 / scale, 8 / scale]);
    }

    // Draw the same L-shaped path as the main render service
    ctx.beginPath();
    if (conn.waypoints && conn.waypoints.length > 0) {
      ctx.moveTo(sp.x, sp.y);
      for (const wp of conn.waypoints) ctx.lineTo(wp.x, wp.y);
      ctx.lineTo(tp.x, tp.y);
    } else {
      ctx.moveTo(sp.x, sp.y);
      if (conn.sourceAnchor === 'left' || conn.sourceAnchor === 'right') {
        ctx.lineTo(tp.x, sp.y);
        ctx.lineTo(tp.x, tp.y);
      } else {
        ctx.lineTo(sp.x, tp.y);
        ctx.lineTo(tp.x, tp.y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawNodeBadge(
    ctx: CanvasRenderingContext2D,
    shape: DiagramElement,
    state: SimNodeState,
    scale: number
  ): void {
    if (state.role === 'pipe') return; // Skip badges on lines

    const fontSize = 9 / scale;
    ctx.save();
    ctx.font = `${fontSize}px monospace`;

    const p = state.pressure.toFixed(0);
    const t = state.temperature.toFixed(0);
    const f = state.flowRate.toFixed(0);
    const text = `${p}psi ${t}°F ${f}lb/h`;
    const metrics = ctx.measureText(text);
    const padding = 3 / scale;
    const badgeW = metrics.width + padding * 2;
    const badgeH = fontSize + padding * 2;
    const badgeX = shape.x + shape.width / 2 - badgeW / 2;
    const badgeY = shape.y + shape.height + 4 / scale;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 2 / scale);
    ctx.fill();

    // Text
    ctx.fillStyle = state.isFlowing ? '#81d4fa' : '#666';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(text, badgeX + padding, badgeY + padding);
    ctx.restore();
  }

  private drawValveIndicator(
    ctx: CanvasRenderingContext2D,
    shape: DiagramElement,
    state: SimNodeState,
    scale: number
  ): void {
    const r = 5 / scale;
    const x = shape.x + r + 2 / scale;
    const y = shape.y + r + 2 / scale;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);

    switch (state.params.valvePosition) {
      case 'open': ctx.fillStyle = '#4caf50'; break;
      case 'closed': ctx.fillStyle = '#f44336'; break;
      case 'throttled': ctx.fillStyle = '#ff9800'; break;
      default: ctx.fillStyle = '#4caf50';
    }
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.restore();
  }

  private drawPumpIndicator(
    ctx: CanvasRenderingContext2D,
    shape: DiagramElement,
    state: SimNodeState,
    scale: number
  ): void {
    const r = 5 / scale;
    const x = shape.x + r + 2 / scale;
    const y = shape.y + r + 2 / scale;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = state.params.pumpRunning ? '#4caf50' : '#666';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.restore();
  }

  private drawSourceIndicator(ctx: CanvasRenderingContext2D, shape: DiagramElement, scale: number): void {
    const r = 5 / scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(shape.x + r + 2 / scale, shape.y + r + 2 / scale, r, 0, Math.PI * 2);
    ctx.fillStyle = '#2196f3';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.restore();
  }

  private drawSinkIndicator(ctx: CanvasRenderingContext2D, shape: DiagramElement, scale: number): void {
    const r = 5 / scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(shape.x + r + 2 / scale, shape.y + r + 2 / scale, r, 0, Math.PI * 2);
    ctx.fillStyle = '#9c27b0';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.restore();
  }

  startAnimation(renderCallback: () => void): void {
    this.stopAnimation();
    const animate = () => {
      this.animationOffset = (this.animationOffset + 0.8) % 40;
      renderCallback();
      this.animFrameId = requestAnimationFrame(animate);
    };
    this.animFrameId = requestAnimationFrame(animate);
  }

  stopAnimation(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }
}
