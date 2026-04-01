import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DiagramPlacement } from '../models/diagram-placement.model';
import { SimNodeState, SimEdgeState } from '../simulation/models/simulation.model';

/**
 * Retained overlay for a single connection's flow visualization.
 * Created once per connection when simulation starts.
 * Only graphics.clear() + redraw path on each update — no object creation.
 */
export class FlowOverlay {
  readonly graphics = new Graphics();
  readonly points: { x: number; y: number }[];

  constructor(points: { x: number; y: number }[]) {
    this.points = points;
  }

  update(edge: SimEdgeState, scale: number, animOffset: number): void {
    this.graphics.clear();

    if (edge.isFlowing) {
      const intensity = Math.min(1, edge.flowRate / 15000);
      const r = Math.round(13 + (129 - 13) * (1 - intensity));
      const g = Math.round(71 + (212 - 71) * (1 - intensity));
      const b = Math.round(161 + (250 - 161) * (1 - intensity));
      drawDashedPath(this.graphics, this.points, 8 / scale, 12 / scale, animOffset / scale, `rgb(${r},${g},${b})`, 4 / scale);
    } else {
      drawDashedPath(this.graphics, this.points, 4 / scale, 8 / scale, 0, '#555555', 4 / scale);
    }
  }
}

/**
 * Retained overlay for a single node's simulation display.
 * Created once per shape when simulation starts.
 * update() only changes properties — no object creation.
 */
export class NodeOverlay {
  readonly container = new Container();

  private badgeBg = new Graphics();
  private badgeText: Text;
  private indicator = new Graphics();
  private warningDot = new Graphics();
  private vesselFill = new Graphics();
  private vesselText: Text;

  private readonly shapeRef: DiagramPlacement;

  constructor(shape: DiagramPlacement) {
    this.shapeRef = shape;

    // Badge
    this.badgeText = new Text({ text: '', style: new TextStyle({ fontSize: 9, fontFamily: 'monospace', fill: '#666666' }) });
    this.container.addChild(this.badgeBg);
    this.container.addChild(this.badgeText);

    // Indicator circle
    this.container.addChild(this.indicator);

    // Warning dot
    this.warningDot.visible = false;
    this.container.addChild(this.warningDot);

    // Vessel fill + text
    this.vesselFill.visible = false;
    this.container.addChild(this.vesselFill);
    this.vesselText = new Text({ text: '', style: new TextStyle({ fontSize: 12, fontFamily: 'monospace', fill: '#b3e5fc' }) });
    this.vesselText.anchor.set(0.5, 0.5);
    this.vesselText.visible = false;
    this.container.addChild(this.vesselText);
  }

  update(shape: DiagramPlacement, state: SimNodeState | undefined, scale: number): void {
    if (!state) {
      this.container.visible = false;
      return;
    }
    this.container.visible = true;

    // Badge
    if (state.role === 'pipe') {
      this.badgeBg.visible = false;
      this.badgeText.visible = false;
    } else {
      this.badgeBg.visible = true;
      this.badgeText.visible = true;

      const extras = state.role === 'vessel' ? ` L${(state.params.currentLevel ?? 0).toFixed(0)}%` : '';
      const str = `${state.pressure.toFixed(0)}psi ${state.temperature.toFixed(0)}F ${state.flowRate.toFixed(0)}u/h${extras}`;
      const fontSize = Math.max(8, 9 / scale);

      this.badgeText.text = str;
      (this.badgeText.style as TextStyle).fontSize = fontSize;
      (this.badgeText.style as TextStyle).fill = state.isFlowing ? '#81d4fa' : '#666666';

      const padding = 3 / scale;
      const bw = this.badgeText.width + padding * 2;
      const bh = this.badgeText.height + padding * 2;
      const bx = shape.x + shape.width / 2 - bw / 2;
      const by = shape.y - bh - 6 / scale;

      this.badgeBg.clear();
      this.badgeBg.roundRect(bx, by, bw, bh, 2 / scale);
      this.badgeBg.fill({ color: 0x000000, alpha: 0.8 });

      this.badgeText.position.set(bx + padding, by + padding);
    }

    // Role indicator
    this.indicator.clear();
    const r = 5 / scale;
    const ix = shape.x + r + 2 / scale;
    const iy = shape.y + r + 2 / scale;
    let indicatorColor: string | null = null;

    if (state.role === 'valve') {
      indicatorColor = state.params.valvePosition === 'closed' ? '#f44336'
        : state.params.valvePosition === 'throttled' ? '#ff9800' : '#4caf50';
    } else if (state.role === 'pump') {
      indicatorColor = state.params.pumpRunning ? '#4caf50' : '#666666';
    } else if (state.role === 'source') {
      indicatorColor = '#2196f3';
    } else if (state.role === 'sink') {
      indicatorColor = '#9c27b0';
    }

    if (indicatorColor) {
      this.indicator.circle(ix, iy, r);
      this.indicator.fill(indicatorColor);
      this.indicator.circle(ix, iy, r);
      this.indicator.stroke({ color: '#ffffff', width: 1 / scale });
    }

    // Warning
    if (state.warnings?.length) {
      this.warningDot.visible = true;
      this.warningDot.clear();
      this.warningDot.circle(shape.x + shape.width - r - 2 / scale, shape.y + r + 2 / scale, r);
      this.warningDot.fill('#f44336');
      this.warningDot.circle(shape.x + shape.width - r - 2 / scale, shape.y + r + 2 / scale, r);
      this.warningDot.stroke({ color: '#ffffff', width: 1 / scale });
    } else {
      this.warningDot.visible = false;
    }

    // Vessel level
    if (state.role === 'vessel') {
      this.vesselFill.visible = true;
      this.vesselText.visible = true;

      const level = Math.max(0, Math.min(100, state.params.currentLevel ?? 0));
      const px = Math.max(6 / scale, shape.width * 0.18);
      const py = Math.max(10 / scale, shape.height * 0.1);
      const fw = Math.max(8 / scale, shape.width - px * 2);
      const fh = Math.max(10 / scale, shape.height - py * 2);
      const lh = fh * (level / 100);
      const fx = shape.x + (shape.width - fw) / 2;
      const fy = shape.y + py + (fh - lh);

      this.vesselFill.clear();
      this.vesselFill.rect(fx, fy, fw, lh);
      this.vesselFill.fill({ color: 0x0397a7, alpha: 0.22 });
      this.vesselFill.rect(fx, shape.y + py, fw, fh);
      this.vesselFill.stroke({ color: 'rgba(129, 212, 250, 0.65)', width: 1 / scale });

      const fs = Math.max(10 / scale, Math.min(shape.width / 4, 14 / scale));
      this.vesselText.text = `${level.toFixed(0)}%`;
      (this.vesselText.style as TextStyle).fontSize = fs;
      this.vesselText.position.set(shape.x + shape.width / 2, shape.y + shape.height / 2);
    } else {
      this.vesselFill.visible = false;
      this.vesselText.visible = false;
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}

// --- Shared dashed-path drawing ---

function drawDashedPath(
  g: Graphics,
  points: { x: number; y: number }[],
  dashLen: number,
  gapLen: number,
  offset: number,
  color: string,
  lineWidth: number
): void {
  const cycleLen = dashLen + gapLen;
  let dist = -offset;
  let hasSegment = false;

  for (let i = 0; i < points.length - 1; i++) {
    const ax = points[i].x, ay = points[i].y;
    const bx = points[i + 1].x, by = points[i + 1].y;
    const dx = bx - ax, dy = by - ay;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (segLen === 0) continue;

    const ux = dx / segLen, uy = dy / segLen;
    let pos = 0;

    while (pos < segLen) {
      const cyclePos = ((dist + pos) % cycleLen + cycleLen) % cycleLen;
      if (cyclePos < dashLen) {
        const remaining = Math.min(dashLen - cyclePos, segLen - pos);
        g.moveTo(ax + ux * pos, ay + uy * pos);
        g.lineTo(ax + ux * (pos + remaining), ay + uy * (pos + remaining));
        hasSegment = true;
        pos += remaining;
      } else {
        pos += Math.min(gapLen - (cyclePos - dashLen), segLen - pos);
      }
    }
    dist += segLen;
  }

  if (hasSegment) {
    g.stroke({ color, width: lineWidth });
  }
}
