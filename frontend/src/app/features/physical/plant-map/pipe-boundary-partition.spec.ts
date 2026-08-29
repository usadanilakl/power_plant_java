import { partitionPolylineByBoundaries } from './pipe-boundary-partition';

describe('partitionPolylineByBoundaries', () => {
  const child = { id: 'child', x: 20, y: 20, w: 40, h: 40, shape: 'rect' };

  it('preserves elbows while moving only the portion inside the child', () => {
    const pieces = partitionPolylineByBoundaries([
      { x: 0, y: 10 }, { x: 40, y: 10 }, { x: 40, y: 50 },
    ], [child]);

    expect(pieces).toEqual([
      { boundaryId: null, points: [{ x: 0, y: 10 }, { x: 40, y: 10 }, { x: 40, y: 20 }] },
      { boundaryId: 'child', points: [{ x: 40, y: 20 }, { x: 40, y: 50 }] },
    ]);
  });

  it('creates entry, internal, and exit pieces without inventing a route', () => {
    const pieces = partitionPolylineByBoundaries([{ x: 0, y: 30 }, { x: 80, y: 30 }], [child]);

    expect(pieces).toEqual([
      { boundaryId: null, points: [{ x: 0, y: 30 }, { x: 20, y: 30 }] },
      { boundaryId: 'child', points: [{ x: 20, y: 30 }, { x: 60, y: 30 }] },
      { boundaryId: null, points: [{ x: 60, y: 30 }, { x: 80, y: 30 }] },
    ]);
  });

  it('does not treat a visual tangent as entering the child', () => {
    const pieces = partitionPolylineByBoundaries([{ x: 0, y: 20 }, { x: 80, y: 20 }], [child]);
    expect(pieces).toEqual([{ boundaryId: null, points: [{ x: 0, y: 20 }, { x: 80, y: 20 }] }]);
  });
});
