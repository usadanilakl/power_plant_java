import { Injectable, inject } from '@angular/core';
import { DiagramPlacement, DiagramConnection } from '../../models/diagram-placement.model';
import { DiagramRenderService } from '../../services/diagram-render.service';
import { SimEdgeState, SimNodeState } from '../models/simulation.model';

@Injectable()
export class SimulationRenderService {
  private renderService = inject(DiagramRenderService);
  animationOffset = 0;
  private animFrameId = 0;

  drawOverlays(
    ctx: CanvasRenderingContext2D,
    shapes: DiagramPlacement[],
    connections: DiagramConnection[],
    nodeStates: SimNodeState[],
    edgeStates: SimEdgeState[],
    scale: number
  ): void {
    const nodeMap = new Map(nodeStates.map(n => [n.shapeId, n]));
    const edgeMap = new Map(edgeStates.map(e => [e.connectionId, e]));
    const shapeMap = new Map(shapes.map(s => [s.id, s]));

    for (const conn of connections) {
      const edge = edgeMap.get(conn.id);
      if (edge) {
        this.drawConnectionOverlay(ctx, conn, edge, shapeMap, scale);
      }
    }

    for (const shape of shapes) {
      const state = nodeMap.get(shape.id);
      if (!state) continue;

      if (state.role === 'vessel') this.drawVesselLevel(ctx, shape, state, scale);
      this.drawNodeBadge(ctx, shape, state, scale);
      if (state.role === 'valve') this.drawValveIndicator(ctx, shape, state, scale);
      if (state.role === 'pump') this.drawPumpIndicator(ctx, shape, state, scale);
      if (state.role === 'source') this.drawSourceIndicator(ctx, shape, scale);
      if (state.role === 'sink') this.drawSinkIndicator(ctx, shape, scale);
      if (state.warnings?.length) this.drawWarningIndicator(ctx, shape, scale);
    }
  }

  private drawConnectionOverlay(
    ctx: CanvasRenderingContext2D,
    conn: DiagramConnection,
    edge: SimEdgeState,
    shapeMap: Map<number, DiagramPlacement>,
    scale: number
  ): void {
    const source = shapeMap.get(conn.sourcePlacementId);
    const target = shapeMap.get(conn.targetPlacementId);
    if (!source || !target) return;

    const sp = this.renderService.getAnchorPoint(source, conn.sourceAnchor);
    const tp = this.renderService.getAnchorPoint(target, conn.targetAnchor);

    ctx.save();
    ctx.lineWidth = 4 / scale;

    if (edge.isFlowing) {
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
    shape: DiagramPlacement,
    state: SimNodeState,
    scale: number
  ): void {
    if (state.role === 'pipe') return;

    const fontSize = 9 / scale;
    const extras = state.role === 'vessel'
      ? ` L${(state.params.currentLevel ?? 0).toFixed(0)}%`
      : '';
    const text = `${state.pressure.toFixed(0)}psi ${state.temperature.toFixed(0)}F ${state.flowRate.toFixed(0)}u/h${extras}`;

    ctx.save();
    ctx.font = `${fontSize}px monospace`;

    const metrics = ctx.measureText(text);
    const padding = 3 / scale;
    const badgeW = metrics.width + padding * 2;
    const badgeH = fontSize + padding * 2;
    const badgeX = shape.x + shape.width / 2 - badgeW / 2;
    const badgeY = shape.y - badgeH - 6 / scale;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 2 / scale);
    ctx.fill();

    ctx.fillStyle = state.isFlowing ? '#81d4fa' : '#666';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(text, badgeX + padding, badgeY + padding);
    ctx.restore();
  }

  private drawValveIndicator(
    ctx: CanvasRenderingContext2D,
    shape: DiagramPlacement,
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
      case 'open':
        ctx.fillStyle = '#4caf50';
        break;
      case 'closed':
        ctx.fillStyle = '#f44336';
        break;
      case 'throttled':
        ctx.fillStyle = '#ff9800';
        break;
      default:
        ctx.fillStyle = '#4caf50';
        break;
    }
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.restore();
  }

  private drawVesselLevel(
    ctx: CanvasRenderingContext2D,
    shape: DiagramPlacement,
    state: SimNodeState,
    scale: number
  ): void {
    const level = Math.max(0, Math.min(100, state.params.currentLevel ?? 0));
    const innerPaddingX = Math.max(6 / scale, shape.width * 0.18);
    const innerPaddingY = Math.max(10 / scale, shape.height * 0.1);
    const fillWidth = Math.max(8 / scale, shape.width - innerPaddingX * 2);
    const fillHeight = Math.max(10 / scale, shape.height - innerPaddingY * 2);
    const liquidHeight = fillHeight * (level / 100);
    const fillX = shape.x + (shape.width - fillWidth) / 2;
    const fillY = shape.y + innerPaddingY + (fillHeight - liquidHeight);

    ctx.save();

    ctx.fillStyle = 'rgba(3, 169, 244, 0.22)';
    ctx.fillRect(fillX, fillY, fillWidth, liquidHeight);

    ctx.strokeStyle = 'rgba(129, 212, 250, 0.65)';
    ctx.lineWidth = 1 / scale;
    ctx.strokeRect(fillX, shape.y + innerPaddingY, fillWidth, fillHeight);

    const fontSize = Math.max(10 / scale, Math.min(shape.width / 4, 14 / scale));
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#b3e5fc';
    ctx.fillText(`${level.toFixed(0)}%`, shape.x + shape.width / 2, shape.y + shape.height / 2);

    ctx.restore();
  }

  private drawPumpIndicator(
    ctx: CanvasRenderingContext2D,
    shape: DiagramPlacement,
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

  private drawSourceIndicator(ctx: CanvasRenderingContext2D, shape: DiagramPlacement, scale: number): void {
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

  private drawSinkIndicator(ctx: CanvasRenderingContext2D, shape: DiagramPlacement, scale: number): void {
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

  private drawWarningIndicator(ctx: CanvasRenderingContext2D, shape: DiagramPlacement, scale: number): void {
    const r = 5 / scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(shape.x + shape.width - r - 2 / scale, shape.y + r + 2 / scale, r, 0, Math.PI * 2);
    ctx.fillStyle = '#f44336';
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
