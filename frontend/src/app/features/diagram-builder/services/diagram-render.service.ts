import { Injectable } from '@angular/core';
import {
  AnchorPoint,
  DiagramConnection,
  DiagramElement,
  DiagramLineShape,
  DiagramSymbolShape,
  DiagramTextShape,
} from '../models/diagram-shape.model';

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 20;

@Injectable()
export class DiagramRenderService {

  drawAll(
    ctx: CanvasRenderingContext2D,
    shapes: DiagramElement[],
    connections: DiagramConnection[],
    selectedIds: Set<number>,
    hoveredId: number | null,
    scale: number
  ): void {
    ctx.save();

    // Draw connections first (underneath shapes)
    for (const conn of connections) {
      this.drawConnection(ctx, conn, shapes, scale);
    }

    // Draw shapes sorted by zIndex
    const sorted = [...shapes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    for (const shape of sorted) {
      this.drawShape(ctx, shape, scale);

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

  drawShape(ctx: CanvasRenderingContext2D, shape: DiagramElement, scale: number): void {
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
        this.drawLine(ctx, shape as DiagramLineShape);
        break;
      case 'text':
        this.drawText(ctx, shape as DiagramTextShape, scale);
        break;
      case 'symbol':
        this.drawSymbol(ctx, shape as DiagramSymbolShape);
        break;
    }

    ctx.restore();
  }

  private drawRectangle(ctx: CanvasRenderingContext2D, shape: DiagramElement): void {
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

  private drawCircle(ctx: CanvasRenderingContext2D, shape: DiagramElement): void {
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

  private drawLine(ctx: CanvasRenderingContext2D, shape: DiagramLineShape): void {
    ctx.strokeStyle = shape.color || '#ffffff';
    ctx.lineWidth = shape.lineWidth || 2;
    ctx.beginPath();
    ctx.moveTo(shape.startX, shape.startY);
    ctx.lineTo(shape.endX, shape.endY);
    ctx.stroke();
  }

  private drawText(ctx: CanvasRenderingContext2D, shape: DiagramTextShape, scale: number): void {
    ctx.fillStyle = shape.color || '#ffffff';
    const fontSize = shape.fontSize || 14;
    ctx.font = `${fontSize}px ${shape.fontFamily || 'Arial'}`;
    ctx.textBaseline = 'top';
    ctx.fillText(shape.text, shape.x, shape.y);
  }

  private drawSymbol(ctx: CanvasRenderingContext2D, shape: DiagramSymbolShape): void {
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

  private getSymbolBounds(shape: DiagramSymbolShape): { width: number; height: number } {
    return {
      width: shape.originalWidth || shape.width || 1,
      height: shape.originalHeight || shape.height || 1,
    };
  }

  drawConnection(
    ctx: CanvasRenderingContext2D,
    conn: DiagramConnection,
    shapes: DiagramElement[],
    scale: number
  ): void {
    const source = shapes.find(s => s.id === conn.sourceShapeId);
    const target = shapes.find(s => s.id === conn.targetShapeId);
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
      if (conn.sourceAnchor === 'left' || conn.sourceAnchor === 'right') {
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

  getAnchorPoint(shape: DiagramElement, anchor: string): { x: number; y: number } {
    switch (anchor) {
      case 'top':    return { x: shape.x + shape.width / 2, y: shape.y };
      case 'bottom': return { x: shape.x + shape.width / 2, y: shape.y + shape.height };
      case 'left':   return { x: shape.x, y: shape.y + shape.height / 2 };
      case 'right':  return { x: shape.x + shape.width, y: shape.y + shape.height / 2 };
      default:       return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
    }
  }

  getAllAnchors(shape: DiagramElement): AnchorPoint[] {
    return (['top', 'right', 'bottom', 'left'] as const).map(position => ({
      ...this.getAnchorPoint(shape, position),
      position,
      shapeId: shape.id,
    }));
  }

  drawAnchorPoints(
    ctx: CanvasRenderingContext2D,
    shape: DiagramElement,
    hoveredAnchor: AnchorPoint | null
  ): void {
    const anchors = this.getAllAnchors(shape);
    for (const anchor of anchors) {
      const isHovered = hoveredAnchor
        && hoveredAnchor.shapeId === anchor.shapeId
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

  private drawHoverHighlight(ctx: CanvasRenderingContext2D, shape: DiagramElement): void {
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
    shape: DiagramElement,
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

  getResizeHandlePositions(shape: DiagramElement): { x: number; y: number; cursor: string }[] {
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
    shape: DiagramElement,
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

  hitTestShape(shapes: DiagramElement[], canvasX: number, canvasY: number): DiagramElement | null {
    // Iterate in reverse (top shapes first)
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      if (
        canvasX >= s.x && canvasX <= s.x + s.width &&
        canvasY >= s.y && canvasY <= s.y + s.height
      ) {
        return s;
      }
    }
    return null;
  }

  hitTestAnchor(
    shapes: DiagramElement[],
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
}
