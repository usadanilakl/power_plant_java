import { Container, Graphics } from 'pixi.js';
import { DiagramPlacement } from '../models/diagram-placement.model';

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 20;

/**
 * Retained selection handles overlay.
 * Reused across selection changes — just redraws for the current shape.
 */
export class SelectionOverlay extends Container {
  private border = new Graphics();
  private handles = new Graphics();
  private rotLine = new Graphics();
  private rotHandle = new Graphics();

  constructor() {
    super();
    this.addChild(this.border);
    this.addChild(this.handles);
    this.addChild(this.rotLine);
    this.addChild(this.rotHandle);
    this.visible = false;
  }

  showForShape(shape: DiagramPlacement, scale: number): void {
    this.visible = true;
    const hs = HANDLE_SIZE / scale;
    const half = hs / 2;
    const { x, y, width: w, height: h } = shape;

    // Border
    this.border.clear();
    this.border.rect(x, y, w, h);
    this.border.stroke({ color: '#2196f3', width: 1.5 / scale });

    // 8 resize handles
    this.handles.clear();
    const positions = getResizeHandlePositions(shape);
    for (const hp of positions) {
      this.handles.rect(hp.x - half, hp.y - half, hs, hs);
      this.handles.fill('#2196f3');
      this.handles.rect(hp.x - half, hp.y - half, hs, hs);
      this.handles.stroke({ color: '#ffffff', width: 1 / scale });
    }

    // Rotation handle
    const rotX = x + w / 2;
    const rotY = y - ROTATION_HANDLE_OFFSET / scale;

    this.rotLine.clear();
    this.rotLine.moveTo(x + w / 2, y);
    this.rotLine.lineTo(rotX, rotY);
    this.rotLine.stroke({ color: '#2196f3', width: 1 / scale });

    this.rotHandle.clear();
    this.rotHandle.circle(rotX, rotY, half);
    this.rotHandle.fill('#4caf50');
    this.rotHandle.circle(rotX, rotY, half);
    this.rotHandle.stroke({ color: '#ffffff', width: 1 / scale });
  }

  hide(): void {
    this.visible = false;
  }
}

export function getResizeHandlePositions(shape: DiagramPlacement): { x: number; y: number; cursor: string }[] {
  const { x, y, width: w, height: h } = shape;
  return [
    { x, y, cursor: 'nw-resize' },
    { x: x + w / 2, y, cursor: 'n-resize' },
    { x: x + w, y, cursor: 'ne-resize' },
    { x: x + w, y: y + h / 2, cursor: 'e-resize' },
    { x: x + w, y: y + h, cursor: 'se-resize' },
    { x: x + w / 2, y: y + h, cursor: 's-resize' },
    { x, y: y + h, cursor: 'sw-resize' },
    { x, y: y + h / 2, cursor: 'w-resize' },
  ];
}
