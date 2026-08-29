import { tracePipeFlow } from './pipe-flow-graph';
import type { PipeGeo } from './services/plant-map-state.service';
import type { PlantMapTopologyConnection, PlantMapTopologyTerminal } from './services/plant-map-topology-api.service';

function pipe(nodeId: number, parentId: number, x1: number, x2: number): PipeGeo {
  return { id: `pipe-${nodeId}`, nodeId, parentId, points: [{ x: x1, y: 0 }, { x: x2, y: 0 }] };
}

function terminal(
  pipeNodeId: number, end: PlantMapTopologyTerminal['end'], sectionId: number,
): PlantMapTopologyTerminal {
  return { pipeNodeId, end, sectionId };
}

function junction(key: string, terminals: PlantMapTopologyTerminal[]): PlantMapTopologyConnection {
  return { connectionKey: key, kind: 'PIPE_JUNCTION', terminals };
}

function port(
  objectId: number, portId: string, terminals: PlantMapTopologyTerminal[],
): PlantMapTopologyConnection {
  return {
    connectionKey: `equipment:${objectId}:${portId}`, kind: 'EQUIPMENT_PORT',
    equipmentObjectId: objectId, equipmentPortId: portId, terminals,
  };
}

describe('tracePipeFlow', () => {
  it('splits flow at a reusable branch point on a pipe body', () => {
    const source = { ...pipe(1, 10, 0, 10), flowDirection: 'forward' as const };
    const header: PipeGeo = {
      ...pipe(2, 10, 0, 100),
      taps: [{ id: 'header-tee', at: { x: 50, y: 0 } }],
    };
    const topology = [
      port(100, 'supply', [terminal(1, 'A', 10)]),
      junction('header-branch', [terminal(1, 'B', 10), terminal(2, 'T:header-tee', 10)]),
    ];

    const result = tracePipeFlow(
      [source, header], topology,
      [{ objectId: 100, portId: 'supply', role: 'supply' }], () => false,
    );

    expect(result.get(header.id)?.segsStr.sort()).toEqual(['50,0 0,0', '50,0 100,0']);
  });

  it('follows every branch in one canonical junction', () => {
    const source = { ...pipe(1, 10, 0, 10), flowDirection: 'forward' as const };
    const branchB = { ...pipe(2, 20, 20, 30), flowDirection: 'forward' as const };
    const branchC = { ...pipe(3, 30, 40, 50), flowDirection: 'forward' as const };
    const topology = [
      port(100, 'supply', [terminal(1, 'A', 10)]),
      junction('branch', [terminal(1, 'B', 10), terminal(2, 'A', 20), terminal(3, 'A', 30)]),
    ];

    const result = tracePipeFlow(
      [source, branchB, branchC], topology,
      [{ objectId: 100, portId: 'supply', role: 'supply' }], () => false,
    );

    expect([...result.keys()].sort()).toEqual(['pipe-1', 'pipe-2', 'pipe-3']);
  });

  it('keeps a closed valve as a barrier', () => {
    const source: PipeGeo = {
      ...pipe(1, 10, 0, 20), flowDirection: 'forward',
      fittings: [{ id: 'valve', type: 'valve', at: { x: 10, y: 0 }, closed: true }],
    };
    const result = tracePipeFlow(
      [source], [port(100, 'supply', [terminal(1, 'A', 10)])],
      [{ objectId: 100, portId: 'supply', role: 'supply' }],
      fitting => fitting.type === 'valve',
    );
    expect(result.get(source.id)?.segsStr).toEqual(['0,0 10,0']);
  });

  it('uses visible A/B identity for an explicit reverse direction', () => {
    const source: PipeGeo = { ...pipe(1, 10, 0, 10), flowDirection: 'reverse' };
    const result = tracePipeFlow(
      [source], [port(100, 'supply', [terminal(1, 'B', 10)])],
      [{ objectId: 100, portId: 'supply', role: 'supply' }], () => false,
    );
    expect(result.get(source.id)?.segsStr).toEqual(['10,0 0,0']);
  });

  it('bridges ports in one equipment circuit when there is no detailed internal route', () => {
    const source = pipe(1, 10, 0, 10);
    const branch = pipe(2, 10, 20, 30);
    const topology = [
      port(100, 'feed', [terminal(1, 'A', 10)]),
      port(200, 'in', [terminal(1, 'B', 10)]),
      port(200, 'out', [terminal(2, 'A', 10)]),
    ];
    const result = tracePipeFlow(
      [source, branch], topology,
      [{ objectId: 100, portId: 'feed', role: 'supply' }], () => false,
      [{ objectId: 200, circuit: 'Process', portIds: ['in', 'out'] }],
    );
    expect([...result.keys()].sort()).toEqual(['pipe-1', 'pipe-2']);
  });

  it('uses detailed internal pipes instead of bypassing an incomplete route', () => {
    const source = pipe(1, 10, 0, 10);
    const target = pipe(2, 10, 20, 30);
    const internal = pipe(3, 200, 100, 110);
    const topology = [
      port(100, 'feed', [terminal(1, 'A', 10)]),
      port(200, 'in', [terminal(1, 'B', 10), terminal(3, 'A', 200)]),
      port(200, 'out', [terminal(2, 'A', 10)]),
    ];
    const result = tracePipeFlow(
      [source, target, internal], topology,
      [{ objectId: 100, portId: 'feed', role: 'supply' }], () => false,
      [{ objectId: 200, circuit: 'Process', portIds: ['in', 'out'] }],
    );
    expect([...result.keys()].sort()).toEqual(['pipe-1', 'pipe-3']);
  });

  it('combines several supply ports and stops traversal at consumers', () => {
    const a = { ...pipe(1, 10, 0, 10), flowDirection: 'forward' as const };
    const b = { ...pipe(2, 20, 20, 30), flowDirection: 'forward' as const };
    const destination = { ...pipe(3, 30, 40, 50), flowDirection: 'forward' as const };
    const beyond = { ...pipe(4, 30, 50, 60), flowDirection: 'forward' as const };
    const topology = [
      port(100, 'supply-a', [terminal(1, 'A', 10)]),
      port(100, 'supply-b', [terminal(2, 'A', 20)]),
      junction('merge', [terminal(1, 'B', 10), terminal(2, 'B', 20), terminal(3, 'A', 30)]),
      port(200, 'consumer', [terminal(3, 'B', 30), terminal(4, 'A', 30)]),
    ];
    const result = tracePipeFlow(
      [a, b, destination, beyond], topology,
      [
        { objectId: 100, portId: 'supply-a', role: 'supply' },
        { objectId: 100, portId: 'supply-b', role: 'supply' },
        { objectId: 200, portId: 'consumer', role: 'consumer' },
      ], () => false,
    );
    expect([...result.keys()].sort()).toEqual(['pipe-1', 'pipe-2', 'pipe-3']);
  });
});
