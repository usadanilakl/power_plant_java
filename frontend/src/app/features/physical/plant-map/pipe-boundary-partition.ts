export interface BoundaryPartitionFrame {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape?: string;
}

export interface BoundaryRoutePiece {
  boundaryId: string | null;
  points: { x: number; y: number }[];
}

const EPS = 1e-7;

function inside(frame: BoundaryPartitionFrame, point: { x: number; y: number }): boolean {
  if (frame.shape === 'circle') {
    const rx = Math.max(EPS, frame.w / 2), ry = Math.max(EPS, frame.h / 2);
    const dx = (point.x - frame.x - frame.w / 2) / rx;
    const dy = (point.y - frame.y - frame.h / 2) / ry;
    return dx * dx + dy * dy < 1 - EPS;
  }
  return point.x > frame.x + EPS && point.x < frame.x + frame.w - EPS
    && point.y > frame.y + EPS && point.y < frame.y + frame.h - EPS;
}

function intersections(
  start: { x: number; y: number },
  end: { x: number; y: number },
  frame: BoundaryPartitionFrame,
): number[] {
  const dx = end.x - start.x, dy = end.y - start.y;
  const result: number[] = [];
  const add = (t: number, x: number, y: number) => {
    if (t > EPS && t < 1 - EPS
      && x >= frame.x - EPS && x <= frame.x + frame.w + EPS
      && y >= frame.y - EPS && y <= frame.y + frame.h + EPS) result.push(t);
  };
  if (frame.shape === 'circle') {
    const rx = Math.max(EPS, frame.w / 2), ry = Math.max(EPS, frame.h / 2);
    const ox = (start.x - frame.x - frame.w / 2) / rx;
    const oy = (start.y - frame.y - frame.h / 2) / ry;
    const vx = dx / rx, vy = dy / ry;
    const a = vx * vx + vy * vy, b = 2 * (ox * vx + oy * vy), c = ox * ox + oy * oy - 1;
    const discriminant = b * b - 4 * a * c;
    if (a > EPS && discriminant >= 0) {
      const root = Math.sqrt(discriminant);
      for (const t of [(-b - root) / (2 * a), (-b + root) / (2 * a)]) {
        add(t, start.x + t * dx, start.y + t * dy);
      }
    }
  } else {
    if (Math.abs(dx) > EPS) {
      for (const x of [frame.x, frame.x + frame.w]) {
        const t = (x - start.x) / dx;
        add(t, x, start.y + t * dy);
      }
    }
    if (Math.abs(dy) > EPS) {
      for (const y of [frame.y, frame.y + frame.h]) {
        const t = (y - start.y) / dy;
        add(t, start.x + t * dx, y);
      }
    }
  }
  return result;
}

function samePoint(left: { x: number; y: number }, right: { x: number; y: number }): boolean {
  return Math.hypot(left.x - right.x, left.y - right.y) < EPS;
}

/**
 * Split a user-authored polyline wherever it enters or exits a direct child footprint. The returned points are
 * exact subsets of the original segments: no elbow is invented and no endpoint is redirected toward a target.
 */
export function partitionPolylineByBoundaries(
  points: { x: number; y: number }[],
  frames: BoundaryPartitionFrame[],
): BoundaryRoutePiece[] {
  if (points.length < 2 || !frames.length) return [{ boundaryId: null, points: points.map(point => ({ ...point })) }];
  const pieces: BoundaryRoutePiece[] = [];
  const ownerAt = (point: { x: number; y: number }) => frames
    .filter(frame => inside(frame, point))
    .sort((left, right) => left.w * left.h - right.w * right.h)[0]?.id ?? null;
  const append = (boundaryId: string | null, start: { x: number; y: number }, end: { x: number; y: number }) => {
    if (samePoint(start, end)) return;
    const previous = pieces[pieces.length - 1];
    if (previous?.boundaryId === boundaryId && samePoint(previous.points[previous.points.length - 1], start)) {
      if (!samePoint(previous.points[previous.points.length - 1], end)) previous.points.push({ ...end });
    } else {
      pieces.push({ boundaryId, points: [{ ...start }, { ...end }] });
    }
  };

  for (let segment = 0; segment < points.length - 1; segment++) {
    const start = points[segment], end = points[segment + 1];
    const dx = end.x - start.x, dy = end.y - start.y;
    const cuts = [0, 1, ...frames.flatMap(frame => intersections(start, end, frame))]
      .sort((left, right) => left - right)
      .filter((value, index, all) => index === 0 || Math.abs(value - all[index - 1]) > EPS);
    for (let index = 0; index < cuts.length - 1; index++) {
      const fromT = cuts[index], toT = cuts[index + 1];
      const from = { x: start.x + fromT * dx, y: start.y + fromT * dy };
      const to = { x: start.x + toT * dx, y: start.y + toT * dy };
      const middle = { x: start.x + (fromT + toT) / 2 * dx, y: start.y + (fromT + toT) / 2 * dy };
      append(ownerAt(middle), from, to);
    }
  }
  return pieces.length ? pieces : [{ boundaryId: null, points: points.map(point => ({ ...point })) }];
}
