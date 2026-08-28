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

  it('bridges parent pipes through any number of ports in the same equipment circuit', () => {
    const source: PipeGeo = {
      ...pipe('source', 1, 0, 10),
      endAttachment: { objectId: 100, portId: 'feed' },
    };
    const branch1: PipeGeo = {
      ...pipe('branch-1', 1, 20, 30),
      startAttachment: { objectId: 100, portId: 'branch-1' },
    };
    const branch2: PipeGeo = {
      ...pipe('branch-2', 1, 40, 50),
      startAttachment: { objectId: 100, portId: 'branch-2' },
    };

    const result = tracePipeFlow([source, branch1, branch2], source.id, () => false, [{
      objectId: 100, circuit: 'Process', portIds: ['feed', 'branch-1', 'branch-2'],
    }]);

    expect([...result.keys()].sort()).toEqual(['branch-1', 'branch-2', 'source']);
  });

  it('uses detailed internal pipes instead of bypassing them with the logical circuit', () => {
    const source: PipeGeo = {
      ...pipe('source', 1, 0, 10),
      endAttachment: { objectId: 100, portId: 'in' },
    };
    const target: PipeGeo = {
      ...pipe('target', 1, 20, 30),
      startAttachment: { objectId: 100, portId: 'out' },
    };
    const incompleteInternal: PipeGeo = {
      ...pipe('internal', 100, 100, 110),
      startAttachment: { objectId: 100, portId: 'in' },
    };

    const result = tracePipeFlow([source, target, incompleteInternal], source.id, () => false, [{
      objectId: 100, circuit: 'Process', portIds: ['in', 'out'],
    }]);

    expect([...result.keys()].sort()).toEqual(['internal', 'source']);
  });
});
