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
    } else if (conn.sourceAnchor === 'left' || conn.sourceAnchor === 'right') {
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
    this.selectionGraphics.visible = true;
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
  switch (anchor) {
    case 'top':    return { x: shape.x + shape.width / 2, y: shape.y };
    case 'bottom': return { x: shape.x + shape.width / 2, y: shape.y + shape.height };
    case 'left':   return { x: shape.x, y: shape.y + shape.height / 2 };
    case 'right':  return { x: shape.x + shape.width, y: shape.y + shape.height / 2 };
    default:       return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  }
}
