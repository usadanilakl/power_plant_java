import { Graphics } from 'pixi.js';

/**
 * Parse an SVG path string and draw it onto a Pixi.js Graphics object.
 * Supports: M, L, C, Q, A, Z commands (absolute only, plus relative m/l/c/q/a/z).
 */
export function drawSvgPath(g: Graphics, svgPath: string): void {
  const commands = parseSvgPathCommands(svgPath);
  let cx = 0, cy = 0; // current point
  let startX = 0, startY = 0; // start of current subpath

  for (const cmd of commands) {
    const { type, args } = cmd;
    const isRelative = type === type.toLowerCase();
    const t = type.toUpperCase();

    switch (t) {
      case 'M': {
        const x = isRelative ? cx + args[0] : args[0];
        const y = isRelative ? cy + args[1] : args[1];
        g.moveTo(x, y);
        cx = x; cy = y;
        startX = x; startY = y;
        // Additional coordinate pairs are treated as implicit L
        for (let i = 2; i < args.length; i += 2) {
          const lx = isRelative ? cx + args[i] : args[i];
          const ly = isRelative ? cy + args[i + 1] : args[i + 1];
          g.lineTo(lx, ly);
          cx = lx; cy = ly;
        }
        break;
      }
      case 'L': {
        for (let i = 0; i < args.length; i += 2) {
          const x = isRelative ? cx + args[i] : args[i];
          const y = isRelative ? cy + args[i + 1] : args[i + 1];
          g.lineTo(x, y);
          cx = x; cy = y;
        }
        break;
      }
      case 'H': {
        for (let i = 0; i < args.length; i++) {
          const x = isRelative ? cx + args[i] : args[i];
          g.lineTo(x, cy);
          cx = x;
        }
        break;
      }
      case 'V': {
        for (let i = 0; i < args.length; i++) {
          const y = isRelative ? cy + args[i] : args[i];
          g.lineTo(cx, y);
          cy = y;
        }
        break;
      }
      case 'C': {
        for (let i = 0; i < args.length; i += 6) {
          const [c1x, c1y, c2x, c2y, ex, ey] = isRelative
            ? [cx + args[i], cy + args[i+1], cx + args[i+2], cy + args[i+3], cx + args[i+4], cy + args[i+5]]
            : [args[i], args[i+1], args[i+2], args[i+3], args[i+4], args[i+5]];
          g.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
          cx = ex; cy = ey;
        }
        break;
      }
      case 'Q': {
        for (let i = 0; i < args.length; i += 4) {
          const [qx, qy, ex, ey] = isRelative
            ? [cx + args[i], cy + args[i+1], cx + args[i+2], cy + args[i+3]]
            : [args[i], args[i+1], args[i+2], args[i+3]];
          g.quadraticCurveTo(qx, qy, ex, ey);
          cx = ex; cy = ey;
        }
        break;
      }
      case 'A': {
        for (let i = 0; i < args.length; i += 7) {
          const rx = args[i];
          const ry = args[i + 1];
          const xRot = args[i + 2];
          const largeArc = args[i + 3];
          const sweep = args[i + 4];
          const ex = isRelative ? cx + args[i + 5] : args[i + 5];
          const ey = isRelative ? cy + args[i + 6] : args[i + 6];
          drawArc(g, cx, cy, rx, ry, xRot, !!largeArc, !!sweep, ex, ey);
          cx = ex; cy = ey;
        }
        break;
      }
      case 'Z': {
        g.closePath();
        cx = startX; cy = startY;
        break;
      }
    }
  }
}

interface SvgCommand {
  type: string;
  args: number[];
}

function parseSvgPathCommands(path: string): SvgCommand[] {
  const commands: SvgCommand[] = [];
  // Match command letter followed by its numeric arguments
  const re = /([MmLlHhVvCcSsQqTtAaZz])\s*([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(path)) !== null) {
    const type = match[1];
    const argStr = match[2].trim();
    const args = argStr.length > 0
      ? argStr.split(/[\s,]+|(?=-)/).filter(s => s.length > 0).map(Number)
      : [];
    commands.push({ type, args });
  }

  return commands;
}

/**
 * Approximate an SVG arc with cubic bezier curves.
 * Converts endpoint parameterization to center parameterization, then draws beziers.
 */
function drawArc(
  g: Graphics,
  x1: number, y1: number,
  rx: number, ry: number,
  xRotDeg: number,
  largeArc: boolean, sweep: boolean,
  x2: number, y2: number
): void {
  if (rx === 0 || ry === 0) {
    g.lineTo(x2, y2);
    return;
  }

  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = (xRotDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  // Step 1: compute (x1', y1')
  const dx2 = (x1 - x2) / 2;
  const dy2 = (y1 - y2) / 2;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  // Correct radii
  let lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const sqrtLambda = Math.sqrt(lambda);
    rx *= sqrtLambda;
    ry *= sqrtLambda;
  }

  // Step 2: compute (cx', cy')
  const rxSq = rx * rx;
  const rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;
  let sq = Math.max(0, (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq));
  let sign = largeArc === sweep ? -1 : 1;
  const cxp = sign * Math.sqrt(sq) * (rx * y1p / ry);
  const cyp = sign * Math.sqrt(sq) * -(ry * x1p / rx);

  // Step 3: compute (cx, cy)
  const cxOut = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cyOut = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  // Step 4: compute angles
  const angle = (ux: number, uy: number, vx: number, vy: number) => {
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
    let a = Math.acos(Math.max(-1, Math.min(1, dot / len)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };

  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dTheta = angle(
    (x1p - cxp) / rx, (y1p - cyp) / ry,
    (-x1p - cxp) / rx, (-y1p - cyp) / ry
  );

  if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI;
  if (sweep && dTheta < 0) dTheta += 2 * Math.PI;

  // Approximate with bezier curves (split into segments of max PI/2)
  const segments = Math.ceil(Math.abs(dTheta) / (Math.PI / 2));
  const segAngle = dTheta / segments;

  for (let i = 0; i < segments; i++) {
    const t1 = theta1 + i * segAngle;
    const t2 = theta1 + (i + 1) * segAngle;
    const alpha = (4 / 3) * Math.tan(segAngle / 4);

    const cos1 = Math.cos(t1), sin1 = Math.sin(t1);
    const cos2 = Math.cos(t2), sin2 = Math.sin(t2);

    const ep1x = rx * cos1, ep1y = ry * sin1;
    const ep2x = rx * cos2, ep2y = ry * sin2;

    const cp1x = ep1x - alpha * rx * sin1;
    const cp1y = ep1y + alpha * ry * cos1;
    const cp2x = ep2x + alpha * rx * sin2;
    const cp2y = ep2y - alpha * ry * cos2;

    // Transform back to original coordinate system
    const transform = (px: number, py: number) => ({
      x: cosPhi * px - sinPhi * py + cxOut,
      y: sinPhi * px + cosPhi * py + cyOut,
    });

    const c1 = transform(cp1x, cp1y);
    const c2 = transform(cp2x, cp2y);
    const end = transform(ep2x, ep2y);

    g.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
  }
}
