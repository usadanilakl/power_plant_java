import { Graphics, Text, TextStyle } from 'pixi.js';
import { DiagramPlacement } from '../models/diagram-placement.model';
import { BaseDiagramSprite } from './base-diagram-sprite';
import { drawSvgPath } from '../services/pixi-svg-path.util';

/** Rectangle shape */
export class RectangleSprite extends BaseDiagramSprite {
  protected override drawBody(g: Graphics, p: DiagramPlacement): void {
    if (p.fillColor) {
      g.rect(0, 0, p.width, p.height);
      g.fill(p.fillColor);
    }
    g.rect(0, 0, p.width, p.height);
    g.stroke({ color: p.color || '#ffffff', width: p.lineWidth || 2 });
  }
}

/** Circle/ellipse shape */
export class CircleSprite extends BaseDiagramSprite {
  protected override drawBody(g: Graphics, p: DiagramPlacement): void {
    const rx = p.width / 2, ry = p.height / 2;
    if (p.fillColor) {
      g.ellipse(rx, ry, rx, ry);
      g.fill(p.fillColor);
    }
    g.ellipse(rx, ry, rx, ry);
    g.stroke({ color: p.color || '#ffffff', width: p.lineWidth || 2 });
  }
}

/** Line shape */
export class LineSprite extends BaseDiagramSprite {
  protected override drawBody(g: Graphics, p: DiagramPlacement): void {
    // Line endpoints are absolute — offset by placement position
    const ox = p.x, oy = p.y;
    g.moveTo((p.startX ?? p.x) - ox, (p.startY ?? p.y) - oy);
    g.lineTo((p.endX ?? p.x + p.width) - ox, (p.endY ?? p.y + p.height) - oy);
    g.stroke({ color: p.color || '#ffffff', width: p.lineWidth || 2 });
  }

  override update(p: DiagramPlacement): void {
    // Lines use absolute coords — position at top-left of bounding box
    this.position.set(p.x, p.y);
    this.pivot.set(0, 0);
    this.rotation = 0; // rotation handled via endpoint coords

    this.bodyGraphics.clear();
    this.drawBody(this.bodyGraphics, p);
    // Lines don't have labels or linked indicators
  }
}

/** Text shape */
export class TextSprite extends BaseDiagramSprite {
  private textDisplay: Text | null = null;

  protected override drawBody(_g: Graphics, p: DiagramPlacement): void {
    // Text uses a Text object, not Graphics
    if (!this.textDisplay) {
      this.textDisplay = new Text({ text: '', style: new TextStyle({ fontSize: 14, fontFamily: 'Arial', fill: '#ffffff' }) });
      this.addChild(this.textDisplay);
    }
    this.textDisplay.text = p.text || '';
    const style = this.textDisplay.style as TextStyle;
    style.fontSize = p.fontSize || 14;
    style.fontFamily = p.fontFamily || 'Arial';
    style.fill = p.color || '#ffffff';
    this.textDisplay.position.set(0, 0);
  }

  override update(p: DiagramPlacement): void {
    this.placementId = p.id;
    this.position.set(p.x, p.y);
    this.pivot.set(0, 0);
    this.rotation = 0;
    this.bodyGraphics.clear();
    this.drawBody(this.bodyGraphics, p);
  }
}

/** P&ID symbol shape — renders SVG path scaled to fit */
export class SymbolSprite extends BaseDiagramSprite {
  private pathGraphics: Graphics | null = null;

  protected override drawBody(g: Graphics, p: DiagramPlacement): void {
    if (!p.svgPath) return;

    const symbolW = p.originalWidth || p.width || 1;
    const symbolH = p.originalHeight || p.height || 1;
    const scaleX = p.width / symbolW;
    const scaleY = p.height / symbolH;

    if (!this.pathGraphics) {
      this.pathGraphics = new Graphics();
      this.addChild(this.pathGraphics);
    }

    this.pathGraphics.clear();
    drawSvgPath(this.pathGraphics, p.svgPath);
    this.pathGraphics.stroke({ color: p.color || '#ffffff', width: (p.lineWidth || 2) / Math.min(scaleX, scaleY) });
    if (p.fillColor) {
      this.pathGraphics.fill(p.fillColor);
    }
    this.pathGraphics.scale.set(scaleX, scaleY);
    this.pathGraphics.position.set(0, 0);
  }
}

/** Factory: create the right sprite type for a placement */
export function createShapeSprite(p: DiagramPlacement): BaseDiagramSprite {
  switch (p.type) {
    case 'rectangle': return new RectangleSprite(p);
    case 'circle': return new CircleSprite(p);
    case 'line': return new LineSprite(p);
    case 'text': return new TextSprite(p);
    case 'symbol': return new SymbolSprite(p);
    default: return new RectangleSprite(p);
  }
}
