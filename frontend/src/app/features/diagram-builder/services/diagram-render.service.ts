import { Injectable } from '@angular/core';
import {
  AnchorPoint,
  DiagramConnection,
  DiagramPlacement,
} from '../models/diagram-placement.model';

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 20;

@Injectable()
export class DiagramRenderService {

  drawAll(
    ctx: CanvasRenderingContext2D,
    shapes: DiagramPlacement[],
    connections: DiagramConnection[],
    selectedIds: Set<number>,
    selectedConnectionId: number | null,
    hoveredId: number | null,
    scale: number
  ): void {
    ctx.save();

    // Draw connections first (underneath shapes)
    for (const conn of connections) {
      this.drawConnection(ctx, conn, shapes, scale);
      if (selectedConnectionId === conn.id) {
        this.drawSelectedConnection(ctx, conn, shapes, scale);
      }
    }

    // Draw shapes sorted by zIndex
    const sorted = [...shapes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    for (const shape of sorted) {
      this.drawShape(ctx, shape, scale);

      // Linked entity indicator
      if (shape.simEquipmentId) {
        this.drawLinkedIndicator(ctx, shape, scale);
      }

      if (hoveredId === shape.id && !selectedIds.has(shape.id)) {
        this.drawHoverHighlight(ctx, shape);
      }
    }

    // Draw selection handles on top
    for (const shape of sorted) {
      if (selectedIds.has(shape.id)) {
        this.drawSelectionHandles(ctx, shape, scale);
      }
    }

    ctx.restore();
  }

  drawShape(ctx: CanvasRenderingContext2D, shape: DiagramPlacement, scale: number): void {
    ctx.save();

    if (shape.rotation) {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((shape.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    switch (shape.type) {
      case 'rectangle':
        this.drawRectangle(ctx, shape);
        break;
      case 'circle':
        this.drawCircle(ctx, shape);
        break;
      case 'line':
        this.drawLine(ctx, shape);
        break;
      case 'text':
        this.drawText(ctx, shape, scale);
        break;
      case 'symbol':
        this.drawSymbol(ctx, shape);
        break;
    }

    ctx.restore();
  }

  private drawRectangle(ctx: CanvasRenderingContext2D, shape: DiagramPlacement): void {
    ctx.strokeStyle = shape.color || '#ffffff';
    ctx.lineWidth = shape.lineWidth || 2;
    if (shape.fillColor) {
      ctx.fillStyle = shape.fillColor;
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    }
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);

    if (shape.label) {
      ctx.fillStyle = shape.color || '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(shape.label, shape.x + shape.width / 2, shape.y + shape.height + 14);
    }
  }

  private drawCircle(ctx: CanvasRenderingContext2D, shape: DiagramPlacement): void {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    const rx = shape.width / 2;
    const ry = shape.height / 2;

    ctx.strokeStyle = shape.color || '#ffffff';
    ctx.lineWidth = shape.lineWidth || 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (shape.fillColor) {
      ctx.fillStyle = shape.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  }

  private drawLine(ctx: CanvasRenderingContext2D, shape: DiagramPlacement): void {
    ctx.strokeStyle = shape.color || '#ffffff';
    ctx.lineWidth = shape.lineWidth || 2;
    ctx.beginPath();
    // Use startX/startY/endX/endY directly — rotation is already applied
    // via ctx.rotate() in the parent drawShape() method, which rotates around
    // the bounding box center. Since the line endpoints are absolute coords
    // within that bounding box, they rotate correctly.
    ctx.moveTo(shape.startX!, shape.startY!);
    ctx.lineTo(shape.endX!, shape.endY!);
    ctx.stroke();
  }

  private drawText(ctx: CanvasRenderingContext2D, shape: DiagramPlacement, scale: number): void {
    ctx.fillStyle = shape.color || '#ffffff';
    const fontSize = shape.fontSize || 14;
    ctx.font = `${fontSize}px ${shape.fontFamily || 'Arial'}`;
    ctx.textBaseline = 'top';
    ctx.fillText(shape.text!, shape.x, shape.y);
  }

  private drawSymbol(ctx: CanvasRenderingContext2D, shape: DiagramPlacement): void {
    if (!shape.svgPath) return;

    ctx.save();
    ctx.translate(shape.x, shape.y);

    // Parse and scale the SVG path to fit shape dimensions
    const path = new Path2D(shape.svgPath);
    const symbolBounds = this.getSymbolBounds(shape);
    const scaleX = shape.width / symbolBounds.width;
    const scaleY = shape.height / symbolBounds.height;

    ctx.scale(scaleX, scaleY);
    ctx.strokeStyle = shape.color || '#ffffff';
    ctx.lineWidth = (shape.lineWidth || 2) / Math.min(scaleX, scaleY);
    ctx.stroke(path);

    if (shape.fillColor) {
      ctx.fillStyle = shape.fillColor;
      ctx.fill(path);
    }

    ctx.restore();

    if (shape.label) {
      ctx.fillStyle = shape.color || '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(shape.label, shape.x + shape.width / 2, shape.y + shape.height + 14);
    }
  }

  private getSymbolBounds(shape: DiagramPlacement): { width: number; height: number } {
    return {
      width: shape.originalWidth || shape.width || 1,
      height: shape.originalHeight || shape.height || 1,
    };
  }

  drawConnection(
    ctx: CanvasRenderingContext2D,
    conn: DiagramConnection,
    shapes: DiagramPlacement[],
    scale: number
  ): void {
    const source = shapes.find(s => s.id === conn.sourcePlacementId);
    const target = shapes.find(s => s.id === conn.targetPlacementId);
    if (!source || !target) return;

    const sourcePoint = this.getAnchorPoint(source, conn.sourceAnchor);
    const targetPoint = this.getAnchorPoint(target, conn.targetAnchor);

    ctx.save();
    ctx.strokeStyle = conn.color || '#888888';
    ctx.lineWidth = conn.lineWidth || 2;

    if (conn.lineStyle === 'dashed') {
      ctx.setLineDash([6, 4]);
    }

    ctx.beginPath();

    if (conn.waypoints && conn.waypoints.length > 0) {
      ctx.moveTo(sourcePoint.x, sourcePoint.y);
      for (const wp of conn.waypoints) {
        ctx.lineTo(wp.x, wp.y);
      }
      ctx.lineTo(targetPoint.x, targetPoint.y);
    } else {
      // L-shaped routing
      ctx.moveTo(sourcePoint.x, sourcePoint.y);
      if (this.isHorizontalAfterRotation(source, conn.sourceAnchor)) {
        ctx.lineTo(targetPoint.x, sourcePoint.y);
        ctx.lineTo(targetPoint.x, targetPoint.y);
      } else {
        ctx.lineTo(sourcePoint.x, targetPoint.y);
        ctx.lineTo(targetPoint.x, targetPoint.y);
      }
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrowhead at target
    this.drawArrowhead(ctx, targetPoint, conn.targetAnchor);

    ctx.restore();
  }

  private drawSelectedConnection(
    ctx: CanvasRenderingContext2D,
    conn: DiagramConnection,
    shapes: DiagramPlacement[],
    scale: number
  ): void {
    const source = shapes.find(s => s.id === conn.sourcePlacementId);
    const target = shapes.find(s => s.id === conn.targetPlacementId);
    if (!source || !target) return;

    const sourcePoint = this.getAnchorPoint(source, conn.sourceAnchor);
    const targetPoint = this.getAnchorPoint(target, conn.targetAnchor);

    ctx.save();
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 4 / scale;
    ctx.setLineDash([8 / scale, 4 / scale]);
    ctx.beginPath();

    if (conn.waypoints && conn.waypoints.length > 0) {
      ctx.moveTo(sourcePoint.x, sourcePoint.y);
      for (const wp of conn.waypoints) ctx.lineTo(wp.x, wp.y);
      ctx.lineTo(targetPoint.x, targetPoint.y);
    } else {
      ctx.moveTo(sourcePoint.x, sourcePoint.y);
      if (this.isHorizontalAfterRotation(source, conn.sourceAnchor)) {
        ctx.lineTo(targetPoint.x, sourcePoint.y);
        ctx.lineTo(targetPoint.x, targetPoint.y);
      } else {
        ctx.lineTo(sourcePoint.x, targetPoint.y);
        ctx.lineTo(targetPoint.x, targetPoint.y);
      }
    }

    ctx.stroke();
    ctx.restore();
  }

  private drawArrowhead(
    ctx: CanvasRenderingContext2D,
    point: { x: number; y: number },
    anchor: string
  ): void {
    const size = 8;
    ctx.save();
    ctx.translate(point.x, point.y);

    switch (anchor) {
      case 'top':    ctx.rotate(Math.PI / 2); break;
      case 'bottom': ctx.rotate(-Math.PI / 2); break;
      case 'left':   ctx.rotate(0); break;
      case 'right':  ctx.rotate(Math.PI); break;
    }

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, -size / 2);
    ctx.lineTo(size, size / 2);
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle as string;
    ctx.fill();
    ctx.restore();
  }

  getAnchorPoint(shape: DiagramPlacement, anchor: string): { x: number; y: number } {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    let dx: number, dy: number;
    switch (anchor) {
      case 'top':    dx = 0; dy = -shape.height / 2; break;
      case 'bottom': dx = 0; dy =  shape.height / 2; break;
      case 'left':   dx = -shape.width / 2; dy = 0; break;
      case 'right':  dx =  shape.width / 2; dy = 0; break;
      default:       dx = 0; dy = 0; break;
    }
    const rad = ((shape.rotation ?? 0) * Math.PI) / 180;
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  }

  getAllAnchors(shape: DiagramPlacement): AnchorPoint[] {
    return (['top', 'right', 'bottom', 'left'] as const).map(position => ({
      ...this.getAnchorPoint(shape, position),
      position,
      placementId: shape.id,
    }));
  }

  drawAnchorPoints(
    ctx: CanvasRenderingContext2D,
    shape: DiagramPlacement,
    hoveredAnchor: AnchorPoint | null
  ): void {
    const anchors = this.getAllAnchors(shape);
    for (const anchor of anchors) {
      const isHovered = hoveredAnchor
        && hoveredAnchor.placementId === anchor.placementId
        && hoveredAnchor.position === anchor.position;

      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, isHovered ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#4fc3f7' : '#2196f3';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  private drawLinkedIndicator(ctx: CanvasRenderingContext2D, shape: DiagramPlacement, scale: number): void {
    const r = 4 / scale;
    const x = shape.x + shape.width - r;
    const y = shape.y + r;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#4caf50';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.restore();
  }

  private drawHoverHighlight(ctx: CanvasRenderingContext2D, shape: DiagramPlacement): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(shape.x - 2, shape.y - 2, shape.width + 4, shape.height + 4);
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawSelectionHandles(
    ctx: CanvasRenderingContext2D,
    shape: DiagramPlacement,
    scale: number
  ): void {
    const handleSize = HANDLE_SIZE / scale;
    const half = handleSize / 2;
    const { x, y, width: w, height: h } = shape;

    // Selection border
    ctx.save();
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([4 / scale, 4 / scale]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // 8 resize handles
    ctx.fillStyle = '#2196f3';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1 / scale;

    const handles = this.getResizeHandlePositions(shape);
    for (const hp of handles) {
      ctx.fillRect(hp.x - half, hp.y - half, handleSize, handleSize);
      ctx.strokeRect(hp.x - half, hp.y - half, handleSize, handleSize);
    }

    // Rotation handle
    const rotX = x + w / 2;
    const rotY = y - ROTATION_HANDLE_OFFSET / scale;

    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(rotX, rotY);
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 1 / scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rotX, rotY, half, 0, Math.PI * 2);
    ctx.fillStyle = '#4caf50';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.restore();
  }

  getResizeHandlePositions(shape: DiagramPlacement): { x: number; y: number; cursor: string }[] {
    const { x, y, width: w, height: h } = shape;
    return [
      { x: x,         y: y,         cursor: 'nw-resize' },
      { x: x + w / 2, y: y,         cursor: 'n-resize' },
      { x: x + w,     y: y,         cursor: 'ne-resize' },
      { x: x + w,     y: y + h / 2, cursor: 'e-resize' },
      { x: x + w,     y: y + h,     cursor: 'se-resize' },
      { x: x + w / 2, y: y + h,     cursor: 's-resize' },
      { x: x,         y: y + h,     cursor: 'sw-resize' },
      { x: x,         y: y + h / 2, cursor: 'w-resize' },
    ];
  }

  hitTestHandle(
    shape: DiagramPlacement,
    canvasX: number,
    canvasY: number,
    scale: number
  ): string | null {
    const handleSize = HANDLE_SIZE / scale;
    const half = handleSize / 2;

    // Check rotation handle first
    const rotX = shape.x + shape.width / 2;
    const rotY = shape.y - ROTATION_HANDLE_OFFSET / scale;
    if (Math.abs(canvasX - rotX) <= half && Math.abs(canvasY - rotY) <= half) {
      return 'rotate';
    }

    const handles = this.getResizeHandlePositions(shape);
    for (const hp of handles) {
      if (Math.abs(canvasX - hp.x) <= half && Math.abs(canvasY - hp.y) <= half) {
        return hp.cursor;
      }
    }

    return null;
  }

  hitTestShape(shapes: DiagramPlacement[], canvasX: number, canvasY: number): DiagramPlacement | null {
    const sorted = [...shapes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

    for (let i = sorted.length - 1; i >= 0; i--) {
      const s = sorted[i];
      const bounds = this.getInteractiveBounds(s);
      if (
        canvasX >= bounds.left && canvasX <= bounds.right &&
        canvasY >= bounds.top && canvasY <= bounds.bottom
      ) {
        return s;
      }
    }
    return null;
  }

  private getInteractiveBounds(shape: DiagramPlacement): { left: number; right: number; top: number; bottom: number } {
    const margin = 8;
    const hasLabel = !!shape.label;
    const labelHeight = hasLabel ? 20 : 0;

    return {
      left: shape.x - margin,
      right: shape.x + shape.width + margin,
      top: shape.y - margin,
      bottom: shape.y + shape.height + margin + labelHeight,
    };
  }

  hitTestAnchor(
    shapes: DiagramPlacement[],
    canvasX: number,
    canvasY: number,
    threshold = 10
  ): AnchorPoint | null {
    for (const shape of shapes) {
      for (const anchor of this.getAllAnchors(shape)) {
        const dist = Math.sqrt((canvasX - anchor.x) ** 2 + (canvasY - anchor.y) ** 2);
        if (dist <= threshold) return anchor;
      }
    }
    return null;
  }

  /**
   * Hit-test waypoints and midpoints on a selected connection.
   * Returns: { type: 'waypoint', index } for existing waypoints (index into conn.waypoints),
   *          { type: 'midpoint', segmentIndex } for midpoints between path segments,
   *          null if no hit.
   */
  hitTestWaypoint(
    conn: DiagramConnection,
    shapes: DiagramPlacement[],
    canvasX: number,
    canvasY: number,
    threshold = 10
  ): { type: 'waypoint'; index: number } | { type: 'midpoint'; segmentIndex: number; x: number; y: number } | null {
    const source = shapes.find(s => s.id === conn.sourcePlacementId);
    const target = shapes.find(s => s.id === conn.targetPlacementId);
    if (!source || !target) return null;

    const sp = this.getAnchorPoint(source, conn.sourceAnchor);
    const tp = this.getAnchorPoint(target, conn.targetAnchor);

    // Build full path points
    const points: { x: number; y: number }[] = [sp];
    if (conn.waypoints?.length) {
      points.push(...conn.waypoints);
    } else if (this.isHorizontalAfterRotation(source, conn.sourceAnchor)) {
      points.push({ x: tp.x, y: sp.y });
    } else {
      points.push({ x: sp.x, y: tp.y });
    }
    points.push(tp);

    // Check existing waypoints first (higher priority)
    if (conn.waypoints?.length) {
      for (let i = 0; i < conn.waypoints.length; i++) {
        const wp = conn.waypoints[i];
        const dist = Math.sqrt((canvasX - wp.x) ** 2 + (canvasY - wp.y) ** 2);
        if (dist <= threshold) return { type: 'waypoint', index: i };
      }
    }

    // Check midpoints of each segment
    for (let i = 0; i < points.length - 1; i++) {
      const mx = (points[i].x + points[i + 1].x) / 2;
      const my = (points[i].y + points[i + 1].y) / 2;
      const dist = Math.sqrt((canvasX - mx) ** 2 + (canvasY - my) ** 2);
      if (dist <= threshold) return { type: 'midpoint', segmentIndex: i, x: mx, y: my };
    }

    return null;
  }

  hitTestConnection(
    connections: DiagramConnection[],
    shapes: DiagramPlacement[],
    canvasX: number,
    canvasY: number,
    threshold = 8
  ): DiagramConnection | null {
    for (let i = connections.length - 1; i >= 0; i--) {
      const conn = connections[i];
      const source = shapes.find(s => s.id === conn.sourcePlacementId);
      const target = shapes.find(s => s.id === conn.targetPlacementId);
      if (!source || !target) continue;

      const points = [this.getAnchorPoint(source, conn.sourceAnchor)];
      if (conn.waypoints?.length) {
        points.push(...conn.waypoints);
      } else if (this.isHorizontalAfterRotation(source, conn.sourceAnchor)) {
        const targetPoint = this.getAnchorPoint(target, conn.targetAnchor);
        points.push({ x: targetPoint.x, y: points[0].y });
      } else {
        const targetPoint = this.getAnchorPoint(target, conn.targetAnchor);
        points.push({ x: points[0].x, y: targetPoint.y });
      }
      points.push(this.getAnchorPoint(target, conn.targetAnchor));

      for (let p = 0; p < points.length - 1; p++) {
        if (this.distanceToSegment(canvasX, canvasY, points[p], points[p + 1]) <= threshold) {
          return conn;
        }
      }
    }
    return null;
  }

  private distanceToSegment(
    px: number,
    py: number,
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq === 0) {
      return Math.sqrt((px - a.x) ** 2 + (py - a.y) ** 2);
    }

    const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / lengthSq));
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  }

  private isHorizontalAfterRotation(shape: DiagramPlacement, anchor: string): boolean {
    const rad = ((shape.rotation ?? 0) * Math.PI) / 180;
    const isOrigH = anchor === 'left' || anchor === 'right';
    const baseX = isOrigH ? 1 : 0;
    const baseY = isOrigH ? 0 : 1;
    const rotX = baseX * Math.cos(rad) - baseY * Math.sin(rad);
    const rotY = baseX * Math.sin(rad) + baseY * Math.cos(rad);
    return Math.abs(rotX) > Math.abs(rotY);
  }
}
