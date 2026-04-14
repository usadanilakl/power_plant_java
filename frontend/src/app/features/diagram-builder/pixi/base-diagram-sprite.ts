import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DiagramPlacement } from '../models/diagram-placement.model';

/**
 * Base class for all retained diagram display objects.
 * Created once per placement, updated in place — never destroyed/recreated per frame.
 */
export class BaseDiagramSprite extends Container {
  protected bodyGraphics = new Graphics();
  protected labelText: Text | null = null;
  protected selectionGraphics: Graphics | null = null;
  protected hoverGraphics: Graphics | null = null;
  protected linkedDot: Graphics | null = null;

  placementId: number;
  private _selected = false;
  private _hovered = false;

  constructor(placement: DiagramPlacement) {
    super();
    this.placementId = placement.id;
    this.addChild(this.bodyGraphics);
    this.update(placement);
  }

  /** Update visual from placement data. Only redraws bodyGraphics if geometry changed. */
  update(p: DiagramPlacement): void {
    this.placementId = p.id;

    // Position + rotation via container transform (no redraw needed)
    if (p.rotation) {
      this.position.set(p.x + p.width / 2, p.y + p.height / 2);
      this.pivot.set(p.width / 2, p.height / 2);
      this.rotation = (p.rotation * Math.PI) / 180;
    } else {
      this.position.set(p.x, p.y);
      this.pivot.set(0, 0);
      this.rotation = 0;
    }

    // Redraw body
    this.bodyGraphics.clear();
    this.drawBody(this.bodyGraphics, p);

    // Label
    this.updateLabel(p);

    // Linked indicator
    this.updateLinkedIndicator(p);
  }

  /** Override in subclasses to draw the shape body. Origin is (0,0) = top-left of shape. */
  protected drawBody(g: Graphics, p: DiagramPlacement): void {
    // Default: rectangle
    const w = p.width, h = p.height;
    if (p.fillColor) {
      g.rect(0, 0, w, h);
      g.fill(p.fillColor);
    }
    g.rect(0, 0, w, h);
    g.stroke({ color: p.color || '#ffffff', width: p.lineWidth || 2 });
  }

  private updateLabel(p: DiagramPlacement): void {
    if (p.label) {
      if (!this.labelText) {
        this.labelText = new Text({
          text: p.label,
          style: new TextStyle({ fontSize: 12, fontFamily: 'Arial', fill: p.color || '#ffffff' }),
        });
        this.labelText.anchor.set(0.5, 0);
        this.addChild(this.labelText);
      }
      this.labelText.text = p.label;
      (this.labelText.style as TextStyle).fill = p.color || '#ffffff';
      this.labelText.position.set(p.width / 2, p.height + 2);
      this.labelText.rotation = -((p.rotation ?? 0) * Math.PI) / 180;
      this.labelText.visible = true;
    } else if (this.labelText) {
      this.labelText.visible = false;
    }
  }

  private updateLinkedIndicator(p: DiagramPlacement): void {
    if (p.simEquipmentId) {
      if (!this.linkedDot) {
        this.linkedDot = new Graphics();
        this.addChild(this.linkedDot);
      }
      this.linkedDot.clear();
      const r = 4;
      this.linkedDot.circle(p.width - r, r, r);
      this.linkedDot.fill('#4caf50');
      this.linkedDot.circle(p.width - r, r, r);
      this.linkedDot.stroke({ color: '#ffffff', width: 1 });
      this.linkedDot.visible = true;
    } else if (this.linkedDot) {
      this.linkedDot.visible = false;
    }
  }

  setSelected(selected: boolean, scale: number): void {
    if (selected === this._selected && this.selectionGraphics) return;
    this._selected = selected;

    if (selected) {
      if (!this.selectionGraphics) {
        this.selectionGraphics = new Graphics();
        this.addChild(this.selectionGraphics);
      }
      // Selection border + handles drawn by SelectionOverlay (separate layer)
      this.selectionGraphics.visible = true;
    } else if (this.selectionGraphics) {
      this.selectionGraphics.visible = false;
    }
  }

  setHovered(hovered: boolean): void {
    if (hovered === this._hovered) return;
    this._hovered = hovered;

    if (hovered) {
      if (!this.hoverGraphics) {
        this.hoverGraphics = new Graphics();
        this.addChildAt(this.hoverGraphics, 0);
      }
      this.hoverGraphics.clear();
      // Get bounds from body — draw highlight around it
      const bounds = this.bodyGraphics.getLocalBounds();
      this.hoverGraphics.rect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);
      this.hoverGraphics.stroke({ color: 'rgba(255, 165, 0, 0.6)', width: 2 });
      this.hoverGraphics.visible = true;
    } else if (this.hoverGraphics) {
      this.hoverGraphics.visible = false;
    }
  }
}
