import { tracePipeFlow } from './pipe-flow-graph';
import type { PipeGeo } from './services/plant-map-state.service';

function pipe(id: string, parentId: number, x1: number, x2: number): PipeGeo {
  return { id, parentId, points: [{ x: x1, y: 0 }, { x: x2, y: 0 }] };
}

describe('tracePipeFlow', () => {
  it('follows every cross-section link on a shared endpoint', () => {
    const source = {
      ...pipe('source', 1, 0, 10),
      ports: [
        { linkId: 'to-b', at: 'end' as const, section: 2 },
        { linkId: 'to-c', at: 'end' as const, section: 3 },
      ],
    };
    const branchB = {
      ...pipe('branch-b', 2, 20, 30),
      ports: [{ linkId: 'to-b', at: 'start' as const, section: 1 }],
    };
    const branchC = {
      ...pipe('branch-c', 3, 40, 50),
      ports: [{ linkId: 'to-c', at: 'start' as const, section: 1 }],
    };

    const result = tracePipeFlow([source, branchB, branchC], source.id, () => false);

    expect([...result.keys()].sort()).toEqual(['branch-b', 'branch-c', 'source']);
  });

  it('keeps a closed valve as a barrier', () => {
    const source: PipeGeo = {
      ...pipe('source', 1, 0, 20),
      fittings: [{ id: 'valve', type: 'valve', at: { x: 10, y: 0 }, closed: true }],
    };

    const result = tracePipeFlow([source], source.id, fitting => fitting.type === 'valve');

    expect(result.get(source.id)?.segsStr).toEqual(['0,0 10,0']);
  });

  it('reverses the displayed flow for one existing pipe section', () => {
    const source: PipeGeo = { ...pipe('source', 1, 0, 10), flowReversed: true };

    const result = tracePipeFlow([source], source.id, () => false);

    expect(result.get(source.id)?.segsStr).toEqual(['10,0 0,0']);
  });
});
