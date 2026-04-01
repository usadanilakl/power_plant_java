import { Injectable, inject } from '@angular/core';
import { DiagramPlacement, DiagramConnection } from '../../models/diagram-placement.model';
import { DiagramRenderService } from '../../services/diagram-render.service';
import { SimEdgeState, SimNodeState } from '../models/simulation.model';

@Injectable()
export class SimulationRenderService {
  private renderService = inject(DiagramRenderService);
  animationOffset = 0;
  private animFrameId = 0;

  // Cached data for animation-only redraws
  private cachedShapes: DiagramPlacement[] = [];
  private cachedConnections: DiagramConnection[] = [];
  private cachedNodeStates: SimNodeState[] = [];
  private cachedEdgeStates: SimEdgeState[] = [];
  private cachedScale = 1;

  /**
   * Draw static simulation overlays on the shape canvas.
   * Called on sim tick (every 500ms) as part of the full render.
   * Draws: shape state colors, badges, vessel levels, valve handles (static position),
   * role indicators, warning dots, connection flow (static colored lines).
   */
  drawStaticOverlays(
    ctx: CanvasRenderingContext2D,
    shapes: DiagramPlacement[],
    connections: DiagramConnection[],
    nodeStates: SimNodeState[],
    edgeStates: SimEdgeState[],
    scale: number
  ): void {
    // Cache for animation layer
    this.cachedShapes = shapes;
    this.cachedConnections = connections;
    this.cachedNodeStates = nodeStates;
    this.cachedEdgeStates = edgeStates;
    this.cachedScale = scale;

    const nodeMap = new Map(nodeStates.map(n => [n.shapeId, n]));
    const edgeMap = new Map(edgeStates.map(e => [e.connectionId, e]));
    const shapeMap = new Map(shapes.map(s => [s.id, s]));

    // Static connection flow (solid colored lines — no animation)
    for (const conn of connections) {
      const edge = edgeMap.get(conn.id);
      if (edge) {
        this.drawConnectionFlowStatic(ctx, conn, edge, shapeMap, scale);
      }
    }

    // Node overlays
    for (const shape of shapes) {
      const state = nodeMap.get(shape.id);
      if (!state) continue;

      this.drawShapeStateOverlay(ctx, shape, state, scale);
      if (state.role === 'vessel') this.drawVesselLevel(ctx, shape, state, scale);
      if (state.role === 'valve') this.drawValveHandle(ctx, shape, state, scale);
      this.drawNodeBadge(ctx, shape, state, scale);
      if (state.role === 'source') this.drawRoleIndicator(ctx, shape, scale, '#2196f3');
      if (state.role === 'sink') this.drawRoleIndicator(ctx, shape, scale, '#9c27b0');
      if (state.warnings?.length) this.drawWarningDot(ctx, shape, scale);
    }
  }

  /**
   * Draw animated-only overlays on the temp canvas.
   * Called at 60fps by requestAnimationFrame.
   * Draws ONLY: flow dash animation, pump impeller rotation, warning pulse.
   * Uses cached data from the last drawStaticOverlays call.
   */
  drawAnimatedOverlays(ctx: CanvasRenderingContext2D): void {
    const shapes = this.cachedShapes;
    const connections = this.cachedConnections;
    const nodeStates = this.cachedNodeStates;
    const edgeStates = this.cachedEdgeStates;
    const scale = this.cachedScale;
    if (!shapes.length) return;

    const nodeMap = new Map(nodeStates.map(n => [n.shapeId, n]));
    const edgeMap = new Map(edgeStates.map(e => [e.connectionId, e]));
    const shapeMap = new Map(shapes.map(s => [s.id, s]));

    // Animated flow dashes
    for (const conn of connections) {
      const edge = edgeMap.get(conn.id);
      if (edge && edge.isFlowing) {
        this.drawFlowDashAnimation(ctx, conn, edge, shapeMap, scale);
      }
    }

    // Animated pump impellers + warning pulses
    for (const shape of shapes) {
      const state = nodeMap.get(shape.id);
      if (!state) continue;

      if (state.role === 'pump') this.drawPumpImpeller(ctx, shape, state, scale);
      if (state.warnings?.length) this.drawWarningPulse(ctx, shape, scale);
    }
  }

  // ─── Static drawing methods (shape canvas, 2fps) ───

  private drawShapeStateOverlay(
    ctx: CanvasRenderingContext2D,
    shape: DiagramPlacement,
    state: SimNodeState,
    scale: number
  ): void {
    let color: string | null = null;
    let alpha = 0.2;

    switch (state.role) {
      case 'valve':
        switch (state.params.valvePosition) {
          case 'open': color = '#4caf50'; break;
          case 'closed': color = '#f44336'; break;
          case 'throttled': color = '#ff9800'; break;
          default: color = '#4caf50'; break;
        }
        break;
      case 'pump':
        color = state.params.pumpRunning ? '#4caf50' : '#666666';
        alpha = state.params.pumpRunning ? 0.15 : 0.25;
        break;
      case 'vessel': return;
      case 'source': color = '#2196f3'; alpha = 0.1; break;
      case 'sink': color = '#9c27b0'; alpha = 0.1; break;
      default: return;
    }
    if (!color) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    if (shape.type === 'circle') {
      ctx.beginPath();
      ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, shape.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    }
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / scale;
    if (shape.type === 'circle') {
      ctx.beginPath();
      ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, shape.height / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
    ctx.restore();
  }

  private drawValveHandle(
    ctx: CanvasRenderingContext2D,
    shape: DiagramPlacement,
    state: SimNodeState,
    scale: number
  ): void {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    const handleLen = Math.min(shape.width, shape.height) * 0.35;
    let color: string;
    let angle: number;

    switch (state.params.valvePosition) {
      case 'open': color = '#4caf50'; angle = 0; break;
      case 'closed': color = '#f44336'; angle = Math.PI / 2; break;
      case 'throttled':
        color = '#ff9800';
        angle = (Math.PI / 2) * (1 - (state.params.throttlePercent ?? 50) / 100);
        break;
      default: color = '#4caf50'; angle = 0; break;
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 / scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-handleLen, 0);
    ctx.lineTo(handleLen, 0);
    ctx.stroke();
    const gripLen = handleLen * 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -gripLen);
    ctx.lineTo(0, gripLen);
    ctx.stroke();
    ctx.restore();
  }

  private drawConnectionFlowStatic(
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
    ctx.lineWidth = 3 / scale;

    if (edge.isFlowing) {
      const intensity = Math.min(1, edge.flowRate / 15000);
      const r = Math.round(13 + (129 - 13) * (1 - intensity));
      const g = Math.round(71 + (212 - 71) * (1 - intensity));
      const b = Math.round(161 + (250 - 161) * (1 - intensity));
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
    } else {
      ctx.strokeStyle = 'rgba(85, 85, 85, 0.4)';
    }

    ctx.beginPath();
    this.traceConnectionPath(ctx, sp, tp, conn);
    ctx.stroke();
    ctx.restore();
  }

  private drawNodeBadge(
    ctx: CanvasRenderingContext2D,
    shape: DiagramPlacement,
    state: SimNodeState,
    scale: number
  ): void {
    if (state.role === 'pipe') return;

    const fontSize = Math.max(11, 13 / scale);
    const extras = state.role === 'vessel' ? ` L${(state.params.currentLevel ?? 0).toFixed(0)}%` : '';
    const text = `${state.pressure.toFixed(0)}psi  ${state.temperature.toFixed(0)}°F  ${state.flowRate.toFixed(0)}u/h${extras}`;

    ctx.save();
    ctx.font = `bold ${fontSize}px monospace`;
    const metrics = ctx.measureText(text);
    const padding = 5 / scale;
    const badgeW = metrics.width + padding * 2;
    const badgeH = fontSize + padding * 2;
    const badgeX = shape.x + shape.width / 2 - badgeW / 2;
    const badgeY = shape.y - badgeH - 8 / scale;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3 / scale);
    ctx.fill();
    ctx.strokeStyle = state.isFlowing ? 'rgba(129, 212, 250, 0.4)' : 'rgba(100, 100, 100, 0.4)';
    ctx.lineWidth = 1 / scale;
    ctx.stroke();

    ctx.fillStyle = state.isFlowing ? '#b3e5fc' : '#888';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(text, badgeX + padding, badgeY + padding);
    ctx.restore();
  }

  private drawVesselLevel(
    ctx: CanvasRenderingContext2D,
    shape: DiagramPlacement,
    state: SimNodeState,
    scale: number
  ): void {
    const level = Math.max(0, Math.min(100, state.params.currentLevel ?? 0));
    const px = Math.max(6 / scale, shape.width * 0.18);
    const py = Math.max(10 / scale, shape.height * 0.1);
    const fw = Math.max(8 / scale, shape.width - px * 2);
    const fh = Math.max(10 / scale, shape.height - py * 2);
    const lh = fh * (level / 100);
    const fx = shape.x + (shape.width - fw) / 2;
    const fy = shape.y + py + (fh - lh);

    ctx.save();
    const grad = ctx.createLinearGradient(fx, fy, fx, fy + lh);
    grad.addColorStop(0, 'rgba(3, 169, 244, 0.35)');
    grad.addColorStop(1, 'rgba(3, 169, 244, 0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(fx, fy, fw, lh);

    ctx.strokeStyle = 'rgba(129, 212, 250, 0.8)';
    ctx.lineWidth = 1.5 / scale;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + fw, fy);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(129, 212, 250, 0.4)';
    ctx.lineWidth = 1 / scale;
    ctx.strokeRect(fx, shape.y + py, fw, fh);

    const fontSize = Math.max(12 / scale, Math.min(shape.width / 3.5, 16 / scale));
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#b3e5fc';
    ctx.fillText(`${level.toFixed(0)}%`, shape.x + shape.width / 2, shape.y + shape.height / 2);
    ctx.restore();
  }

  private drawRoleIndicator(ctx: CanvasRenderingContext2D, shape: DiagramPlacement, scale: number, color: string): void {
    const r = 6 / scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(shape.x + r + 2 / scale, shape.y + r + 2 / scale, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5 / scale;
    ctx.stroke();
    ctx.restore();
  }

  private drawWarningDot(ctx: CanvasRenderingContext2D, shape: DiagramPlacement, scale: number): void {
    const r = 7 / scale;
    const x = shape.x + shape.width - r - 2 / scale;
    const y = shape.y + r + 2 / scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#f44336';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5 / scale;
    ctx.stroke();
    const fontSize = Math.max(8, 10 / scale);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('!', x, y);
    ctx.restore();
  }

  // ─── Animated drawing methods (temp canvas, 60fps) ───

  private drawFlowDashAnimation(
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

    const intensity = Math.min(1, edge.flowRate / 15000);
    const r = Math.round(13 + (129 - 13) * (1 - intensity));
    const g = Math.round(71 + (212 - 71) * (1 - intensity));
    const b = Math.round(161 + (250 - 161) * (1 - intensity));

    ctx.save();
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineWidth = 4 / scale;
    ctx.setLineDash([8 / scale, 12 / scale]);
    ctx.lineDashOffset = -this.animationOffset / scale;
    ctx.beginPath();
    this.traceConnectionPath(ctx, sp, tp, conn);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawPumpImpeller(
    ctx: CanvasRenderingContext2D,
    shape: DiagramPlacement,
    state: SimNodeState,
    scale: number
  ): void {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    const r = Math.min(shape.width, shape.height) * 0.28;

    ctx.save();
    ctx.translate(cx, cy);

    if (state.params.pumpRunning) {
      ctx.rotate(this.animationOffset * 0.15);
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 2.5 / scale;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r * Math.cos(i * Math.PI / 2), r * Math.sin(i * Math.PI / 2));
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 3 / scale, 0, Math.PI * 2);
      ctx.fillStyle = '#4caf50';
      ctx.fill();
    } else {
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2 / scale;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r * Math.cos(i * Math.PI / 2 + Math.PI / 4), r * Math.sin(i * Math.PI / 2 + Math.PI / 4));
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 3 / scale, 0, Math.PI * 2);
      ctx.fillStyle = '#666';
      ctx.fill();
    }
    ctx.restore();
  }

  private drawWarningPulse(ctx: CanvasRenderingContext2D, shape: DiagramPlacement, scale: number): void {
    const r = 7 / scale;
    const x = shape.x + shape.width - r - 2 / scale;
    const y = shape.y + r + 2 / scale;
    const pulse = 0.5 + 0.5 * Math.sin(this.animationOffset * 0.3);

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r + 4 / scale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(244, 67, 54, ${0.2 * pulse})`;
    ctx.fill();
    ctx.restore();
  }

  // ─── Shared path tracer ───

  private traceConnectionPath(
    ctx: CanvasRenderingContext2D,
    sp: { x: number; y: number },
    tp: { x: number; y: number },
    conn: DiagramConnection
  ): void {
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
  }

  // ─── Animation lifecycle ───

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
    this.cachedShapes = [];
    this.cachedConnections = [];
    this.cachedNodeStates = [];
    this.cachedEdgeStates = [];
  }
}
