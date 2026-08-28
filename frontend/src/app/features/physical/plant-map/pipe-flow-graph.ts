import type { PipeFitting, PipeGeo } from './services/plant-map-state.service';

export interface PipeFlowResult {
  segsStr: string[];
  segsPath: { x: number; y: number }[][];
}

export interface EquipmentPortNetwork {
  objectId: number;
  circuit: string;
  portIds: string[];
}

interface FlowEdge {
  id: string;
  pipeId: string;
  a: string;
  b: string;
  path: { x: number; y: number }[];
}

function pathAlong(points: { x: number; y: number }[]): number[] {
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  }
  return distances;
}

function projectOnSegment(
  point: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return { ...a };
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

function projectedDistance(
  points: { x: number; y: number }[],
  cumulative: number[],
  position: { x: number; y: number },
): number {
  let bestDistance = Infinity;
  let along = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const projection = projectOnSegment(position, points[i], points[i + 1]);
    const distance = (projection.x - position.x) ** 2 + (projection.y - position.y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      along = cumulative[i] + Math.hypot(projection.x - points[i].x, projection.y - points[i].y);
    }
  }
  return along;
}

function pointAt(points: { x: number; y: number }[], cumulative: number[], along: number): { x: number; y: number } {
  for (let i = 0; i < points.length - 1; i++) {
    if (along <= cumulative[i + 1] || i === points.length - 2) {
      const t = (along - cumulative[i]) / Math.max(1e-6, cumulative[i + 1] - cumulative[i]);
      return {
        x: points[i].x + t * (points[i + 1].x - points[i].x),
        y: points[i].y + t * (points[i + 1].y - points[i].y),
      };
    }
  }
  return points[points.length - 1];
}

function slicePath(
  points: { x: number; y: number }[],
  cumulative: number[],
  from: number,
  to: number,
): { x: number; y: number }[] {
  const path = [pointAt(points, cumulative, from)];
  for (let i = 0; i < points.length; i++) {
    if (cumulative[i] > from + 0.5 && cumulative[i] < to - 0.5) path.push(points[i]);
  }
  path.push(pointAt(points, cumulative, to));
  return path;
}

/**
 * Trace the visual pipe network from one source.
 *
 * A physical endpoint always has its own positional graph node. Every cross-section
 * port on that endpoint is then added as an alias to its shared link node. Keeping
 * all aliases is important: one endpoint may legitimately fan out to several other
 * sections, and older traversal code silently retained only its first port.
 */
export function tracePipeFlow(
  pipes: PipeGeo[],
  sourcePipeId: string | null,
  isValve: (fitting: PipeFitting) => boolean,
  equipmentNetworks: EquipmentPortNetwork[] = [],
): Map<string, PipeFlowResult> {
  const result = new Map<string, PipeFlowResult>();
  const all = pipes.filter(pipe => pipe.points.length >= 2);
  const sourcePipe = all.find(pipe => pipe.id === sourcePipeId);
  if (!sourcePipe) return result;

  const positionKey = (parentId: number, point: { x: number; y: number }) =>
    `${parentId}:${Math.round(point.x / 3)}_${Math.round(point.y / 3)}`;
  const endpointNode = (pipe: PipeGeo, atStart: boolean) =>
    positionKey(pipe.parentId, atStart ? pipe.points[0] : pipe.points[pipe.points.length - 1]);

  const aliases = new Map<string, Set<string>>();
  const addAlias = (a: string, b: string) => {
    if (a === b) return;
    const aa = aliases.get(a) ?? new Set<string>();
    const bb = aliases.get(b) ?? new Set<string>();
    aa.add(b);
    bb.add(a);
    aliases.set(a, aa);
    aliases.set(b, bb);
  };
  for (const pipe of all) {
    for (const port of pipe.ports ?? []) {
      addAlias(endpointNode(pipe, port.at === 'start'), `port-${port.linkId}`);
    }
    if (pipe.startAttachment) {
      addAlias(endpointNode(pipe, true), `equipment-port-${pipe.startAttachment.objectId}-${pipe.startAttachment.portId}`);
    }
    if (pipe.endAttachment) {
      addAlias(endpointNode(pipe, false), `equipment-port-${pipe.endAttachment.objectId}-${pipe.endAttachment.portId}`);
    }
  }
  for (const network of equipmentNetworks) {
    const circuit = network.circuit.trim();
    if (!circuit || network.portIds.length < 2) continue;
    const portIds = new Set(network.portIds);
    const hasDetailedInternalRoute = all.some(pipe => pipe.parentId === network.objectId
      && ((pipe.startAttachment?.objectId === network.objectId && portIds.has(pipe.startAttachment.portId))
        || (pipe.endAttachment?.objectId === network.objectId && portIds.has(pipe.endAttachment.portId))));
    if (hasDetailedInternalRoute) continue;
    const networkNode = `equipment-network-${network.objectId}-${circuit}`;
    for (const portId of network.portIds) {
      addAlias(networkNode, `equipment-port-${network.objectId}-${portId}`);
    }
  }

  const edges: FlowEdge[] = [];
  const barriers = new Set<string>();
  let edgeId = 0;
  for (const pipe of all) {
    const cumulative = pathAlong(pipe.points);
    const pointsOfInterest: { along: number; node: string }[] = [
      { along: 0, node: endpointNode(pipe, true) },
      { along: cumulative[cumulative.length - 1], node: endpointNode(pipe, false) },
    ];

    for (const fitting of pipe.fittings ?? []) {
      if (!isValve(fitting)) continue;
      const node = `${pipe.id}:v:${fitting.id}`;
      pointsOfInterest.push({ along: projectedDistance(pipe.points, cumulative, fitting.at), node });
      if (fitting.closed) barriers.add(node);
    }

    for (const other of all) {
      if (other.id === pipe.id || other.parentId !== pipe.parentId) continue;
      for (const endpoint of [other.points[0], other.points[other.points.length - 1]]) {
        let nearest: { x: number; y: number } | null = null;
        let nearestDistance = Infinity;
        for (let i = 0; i < pipe.points.length - 1; i++) {
          const projection = projectOnSegment(endpoint, pipe.points[i], pipe.points[i + 1]);
          const distance = (projection.x - endpoint.x) ** 2 + (projection.y - endpoint.y) ** 2;
          if (distance < nearestDistance) {
            nearest = projection;
            nearestDistance = distance;
          }
        }
        if (nearest && Math.hypot(nearest.x - endpoint.x, nearest.y - endpoint.y) <= 4) {
          pointsOfInterest.push({
            along: projectedDistance(pipe.points, cumulative, endpoint),
            node: positionKey(pipe.parentId, endpoint),
          });
        }
      }
    }

    pointsOfInterest.sort((a, b) => a.along - b.along);
    const distinct: { along: number; node: string }[] = [];
    for (const item of pointsOfInterest) {
      if (!distinct.length || item.along - distinct[distinct.length - 1].along > 1) distinct.push(item);
    }
    for (let i = 0; i < distinct.length - 1; i++) {
      edges.push({
        id: `e${edgeId++}`,
        pipeId: pipe.id,
        a: distinct[i].node,
        b: distinct[i + 1].node,
        path: slicePath(pipe.points, cumulative, distinct[i].along, distinct[i + 1].along),
      });
    }
  }

  const nodeEdges = new Map<string, FlowEdge[]>();
  const addEdge = (node: string, edge: FlowEdge) => {
    const existing = nodeEdges.get(node);
    if (existing) existing.push(edge);
    else nodeEdges.set(node, [edge]);
  };
  for (const edge of edges) {
    addEdge(edge.a, edge);
    addEdge(edge.b, edge);
  }

  const sourceNode = endpointNode(sourcePipe, true);
  const depth = new Map<string, number>([[sourceNode, 0]]);
  const reachedEdges = new Set<string>();
  const queue = [sourceNode];
  while (queue.length) {
    const node = queue.shift()!;
    if (barriers.has(node)) continue;
    const nodeDepth = depth.get(node)!;

    for (const alias of aliases.get(node) ?? []) {
      if (!depth.has(alias)) {
        depth.set(alias, nodeDepth);
        queue.push(alias);
      }
    }
    for (const edge of nodeEdges.get(node) ?? []) {
      reachedEdges.add(edge.id);
      const otherNode = edge.a === node ? edge.b : edge.a;
      if (!depth.has(otherNode)) {
        depth.set(otherNode, nodeDepth + 1);
        queue.push(otherNode);
      }
    }
  }

  const pipeById = new Map(all.map(pipe => [pipe.id, pipe]));
  for (const edge of edges) {
    if (!reachedEdges.has(edge.id)) continue;
    const aBarrier = barriers.has(edge.a);
    const bBarrier = barriers.has(edge.b);
    const followsTraversal = aBarrier !== bBarrier
      ? bBarrier
      : (depth.get(edge.a) ?? Infinity) <= (depth.get(edge.b) ?? Infinity);
    const reversedByUser = !!pipeById.get(edge.pipeId)?.flowReversed;
    const path = followsTraversal !== reversedByUser ? edge.path : [...edge.path].reverse();
    const entry = result.get(edge.pipeId) ?? { segsStr: [], segsPath: [] };
    entry.segsPath.push(path);
    entry.segsStr.push(path.map(point => `${point.x},${point.y}`).join(' '));
    result.set(edge.pipeId, entry);
  }
  return result;
}
