import { Container, Graphics } from 'pixi.js';
import { DiagramConnection, DiagramPlacement } from '../models/diagram-placement.model';

/**
 * Retained display object for a connection (pipe) between two placements.
 * Created once, updated in place when endpoints move.
 */
export class ConnectionGraphic extends Container {
  private lineGraphics = new Graphics();
  private arrowGraphics = new Graphics();
  private selectionGraphics: Graphics | null = null;

  connectionId: number;
  private _selected = false;

  // Cached path points for simulation overlay to reference
  pathPoints: { x: number; y: number }[] = [];

  constructor(conn: DiagramConnection, shapes: DiagramPlacement[]) {
    super();
    this.connectionId = conn.id;
    this.addChild(this.lineGraphics);
    this.addChild(this.arrowGraphics);
    this.updatePath(conn, shapes);
  }

  updatePath(conn: DiagramConnection, shapes: DiagramPlacement[]): void {
    this.connectionId = conn.id;

    const source = shapes.find(s => s.id === conn.sourcePlacementId);
    const target = shapes.find(s => s.id === conn.targetPlacementId);
    if (!source || !target) return;

    const sp = getAnchorPoint(source, conn.sourceAnchor);
    const tp = getAnchorPoint(target, conn.targetAnchor);

    // Build and cache path points
    this.pathPoints = [sp];
    if (conn.waypoints && conn.waypoints.length > 0) {
      this.pathPoints.push(...conn.waypoints);
    } else if (isHorizontalAfterRotation(source, conn.sourceAnchor)) {
      this.pathPoints.push({ x: tp.x, y: sp.y });
    } else {
      this.pathPoints.push({ x: sp.x, y: tp.y });
    }
    this.pathPoints.push(tp);

    // Draw line
    this.lineGraphics.clear();
    this.lineGraphics.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
    for (let i = 1; i < this.pathPoints.length; i++) {
      this.lineGraphics.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
    }
    this.lineGraphics.stroke({ color: conn.color || '#888888', width: conn.lineWidth || 2 });

    // Draw arrowhead
    this.arrowGraphics.clear();
    this.drawArrowhead(tp, conn.targetAnchor, conn.color || '#888888');

    // Update selection if active
    if (this._selected) {
      this.drawSelection();
    }
  }

  setSelected(selected: boolean, scale: number): void {
    this._selected = selected;
    if (selected) {
      this.drawSelection();
    } else if (this.selectionGraphics) {
      this.selectionGraphics.visible = false;
    }
  }

  private drawSelection(): void {
    if (!this.selectionGraphics) {
      this.selectionGraphics = new Graphics();
      this.addChildAt(this.selectionGraphics, 0);
    }
    this.selectionGraphics.clear();
    if (this.pathPoints.length < 2) return;

    this.selectionGraphics.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
    for (let i = 1; i < this.pathPoints.length; i++) {
      this.selectionGraphics.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
    }
    this.selectionGraphics.stroke({ color: '#4fc3f7', width: 4 });

    // Draw waypoint handles (existing waypoints = circles, midpoints = "+" indicators)
    this.drawWaypointHandles(this.selectionGraphics);
    this.selectionGraphics.visible = true;
  }

  private drawWaypointHandles(g: Graphics): void {
    const r = 5;

    // Existing waypoints — draggable circles (skip first and last which are anchors)
    for (let i = 1; i < this.pathPoints.length - 1; i++) {
      const p = this.pathPoints[i];
      g.circle(p.x, p.y, r);
      g.fill('#4fc3f7');
      g.circle(p.x, p.y, r);
      g.stroke({ color: '#ffffff', width: 1.5 });
    }

    // Midpoint "+" indicators — click to insert new waypoint
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const a = this.pathPoints[i];
      const b = this.pathPoints[i + 1];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const s = 4;
      g.moveTo(mx - s, my);
      g.lineTo(mx + s, my);
      g.moveTo(mx, my - s);
      g.lineTo(mx, my + s);
      g.stroke({ color: '#ffffff', width: 1.5 });
    }
  }

  private drawArrowhead(point: { x: number; y: number }, anchor: string, color: string): void {
    const size = 8;
    const arrow = new Graphics();
    arrow.moveTo(0, 0);
    arrow.lineTo(size, -size / 2);
    arrow.lineTo(size, size / 2);
    arrow.closePath();
    arrow.fill(color);
    arrow.position.set(point.x, point.y);

    switch (anchor) {
      case 'top':    arrow.rotation = Math.PI / 2; break;
      case 'bottom': arrow.rotation = -Math.PI / 2; break;
      case 'left':   arrow.rotation = 0; break;
      case 'right':  arrow.rotation = Math.PI; break;
    }

    this.arrowGraphics.addChild(arrow);
  }
}

export function getAnchorPoint(shape: DiagramPlacement, anchor: string): { x: number; y: number } {
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

export function isHorizontalAfterRotation(shape: DiagramPlacement, anchor: string): boolean {
  const rad = ((shape.rotation ?? 0) * Math.PI) / 180;
  const isOrigH = anchor === 'left' || anchor === 'right';
  const baseX = isOrigH ? 1 : 0;
  const baseY = isOrigH ? 0 : 1;
  const rotX = baseX * Math.cos(rad) - baseY * Math.sin(rad);
  const rotY = baseX * Math.sin(rad) + baseY * Math.cos(rad);
  return Math.abs(rotX) > Math.abs(rotY);
}
