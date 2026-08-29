import type { PipeFitting, PipeGeo } from './services/plant-map-state.service';
import type { PlantMapTopologyConnection } from './services/plant-map-topology-api.service';

export interface PipeFlowResult {
  segsStr: string[];
  segsPath: { x: number; y: number }[][];
}

export interface EquipmentPortNetwork {
  objectId: number;
  circuit: string;
  portIds: string[];
}

export interface FlowBoundaryPort {
  objectId: number;
  portId: string;
  role: 'supply' | 'consumer';
}

interface FlowEdge {
  id: string;
  pipeId: string;
  a: string;
  b: string;
  path: { x: number; y: number }[];
  direction: 'forward' | 'reverse' | 'both';
}

function pathAlong(points: { x: number; y: number }[]): number[] {
  const distances = [0];
  for (let index = 1; index < points.length; index++) {
    distances.push(distances[index - 1] + Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
    ));
  }
  return distances;
}

function projectOnSegment(
  point: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return { ...a };
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

function projectedDistance(
  points: { x: number; y: number }[],
  cumulative: number[],
  position: { x: number; y: number },
): number {
  let bestDistance = Infinity, along = 0;
  for (let index = 0; index < points.length - 1; index++) {
    const projection = projectOnSegment(position, points[index], points[index + 1]);
    const distance = (projection.x - position.x) ** 2 + (projection.y - position.y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      along = cumulative[index] + Math.hypot(projection.x - points[index].x, projection.y - points[index].y);
    }
  }
  return along;
}

function pointAt(points: { x: number; y: number }[], cumulative: number[], along: number) {
  for (let index = 0; index < points.length - 1; index++) {
    if (along <= cumulative[index + 1] || index === points.length - 2) {
      const t = (along - cumulative[index]) / Math.max(1e-6, cumulative[index + 1] - cumulative[index]);
      return {
        x: points[index].x + t * (points[index + 1].x - points[index].x),
        y: points[index].y + t * (points[index + 1].y - points[index].y),
      };
    }
  }
  return points[points.length - 1];
}

function slicePath(
  points: { x: number; y: number }[], cumulative: number[], from: number, to: number,
) {
  const path = [pointAt(points, cumulative, from)];
  for (let index = 0; index < points.length; index++) {
    if (cumulative[index] > from + 0.5 && cumulative[index] < to - 0.5) path.push(points[index]);
  }
  path.push(pointAt(points, cumulative, to));
  return path;
}

/**
 * Deterministic nominal-flow trace over the canonical topology graph.
 * Pipes are links, never sources or destinations. Supply/consumer semantics belong to ports; A/B direction is
 * an explicit link constraint. Visual proximity is ignored, so moving lines cannot silently change topology.
 */
export function tracePipeFlow(
  pipes: PipeGeo[],
  topology: PlantMapTopologyConnection[],
  boundaries: FlowBoundaryPort[],
  isValve: (fitting: PipeFitting) => boolean,
  equipmentNetworks: EquipmentPortNetwork[] = [],
): Map<string, PipeFlowResult> {
  const result = new Map<string, PipeFlowResult>();
  const all = pipes.filter(pipe => pipe.nodeId != null && pipe.points.length >= 2);
  if (!all.length) return result;

  const terminalNode = (pipeNodeId: number, end: string) => `terminal:${pipeNodeId}:${end}`;
  const junctionNode = (connectionKey: string) => `junction:${connectionKey}`;
  const equipmentKey = (objectId: number, portId: string) => `${objectId}:${portId}`;
  const aliases = new Map<string, Set<string>>();
  const addAlias = (left: string, right: string) => {
    if (left === right) return;
    const leftAliases = aliases.get(left) ?? new Set<string>();
    const rightAliases = aliases.get(right) ?? new Set<string>();
    leftAliases.add(right); rightAliases.add(left);
    aliases.set(left, leftAliases); aliases.set(right, rightAliases);
  };

  const equipmentConnections = new Map<string, PlantMapTopologyConnection>();
  for (const connection of topology) {
    const junction = junctionNode(connection.connectionKey);
    for (const terminal of connection.terminals) addAlias(junction, terminalNode(terminal.pipeNodeId, terminal.end));
    if (connection.kind === 'EQUIPMENT_PORT'
      && connection.equipmentObjectId != null && connection.equipmentPortId) {
      equipmentConnections.set(equipmentKey(connection.equipmentObjectId, connection.equipmentPortId), connection);
    }
  }

  // A shared circuit is the equipment's logical internal path only when no detailed internal pipe is attached.
  for (const network of equipmentNetworks) {
    if (!network.circuit.trim() || network.portIds.length < 2) continue;
    const connections = network.portIds
      .map(portId => equipmentConnections.get(equipmentKey(network.objectId, portId)))
      .filter((connection): connection is PlantMapTopologyConnection => !!connection);
    const hasDetailedInternalRoute = connections.some(connection => connection.terminals.some(terminal =>
      all.some(pipe => pipe.nodeId === terminal.pipeNodeId && pipe.parentId === network.objectId)));
    if (hasDetailedInternalRoute) continue;
    const networkNode = `equipment-network:${network.objectId}:${network.circuit.trim().toLowerCase()}`;
    for (const connection of connections) addAlias(networkNode, junctionNode(connection.connectionKey));
  }

  const edges: FlowEdge[] = [];
  const barriers = new Set<string>();
  let edgeIndex = 0;
  for (const pipe of all) {
    const cumulative = pathAlong(pipe.points);
    const pointsOfInterest: { along: number; node: string }[] = [
      { along: 0, node: terminalNode(pipe.nodeId!, 'A') },
      { along: cumulative[cumulative.length - 1], node: terminalNode(pipe.nodeId!, 'B') },
    ];
    for (const tap of pipe.taps ?? []) {
      pointsOfInterest.push({
        along: projectedDistance(pipe.points, cumulative, tap.at),
        node: terminalNode(pipe.nodeId!, `T:${tap.id}`),
      });
    }
    for (const fitting of pipe.fittings ?? []) {
      if (!isValve(fitting)) continue;
      const node = `${pipe.id}:valve:${fitting.id}`;
      pointsOfInterest.push({ along: projectedDistance(pipe.points, cumulative, fitting.at), node });
      if (fitting.closed) barriers.add(node);
    }
    pointsOfInterest.sort((left, right) => left.along - right.along);
    const distinct = pointsOfInterest.filter((item, index) => !index
      || item.along - pointsOfInterest[index - 1].along > 1);
    for (let index = 0; index < distinct.length - 1; index++) {
      edges.push({
        id: `edge:${edgeIndex++}`, pipeId: pipe.id,
        a: distinct[index].node, b: distinct[index + 1].node,
        path: slicePath(pipe.points, cumulative, distinct[index].along, distinct[index + 1].along),
        direction: pipe.flowDirection ?? (pipe.flowReversed ? 'reverse' : 'both'),
      });
    }
  }

  const nodeEdges = new Map<string, FlowEdge[]>();
  for (const edge of edges) {
    nodeEdges.set(edge.a, [...(nodeEdges.get(edge.a) ?? []), edge]);
    nodeEdges.set(edge.b, [...(nodeEdges.get(edge.b) ?? []), edge]);
  }
  const boundaryNodes = (role: 'supply' | 'consumer') => new Set(boundaries
    .filter(boundary => boundary.role === role)
    .map(boundary => equipmentConnections.get(equipmentKey(boundary.objectId, boundary.portId)))
    .filter((connection): connection is PlantMapTopologyConnection => !!connection)
    .map(connection => junctionNode(connection.connectionKey)));
  const sourceNodes = boundaryNodes('supply');
  const consumerNodes = boundaryNodes('consumer');
  if (!sourceNodes.size) return result;

  const reached = new Set<string>(sourceNodes);
  const reachedEdges = new Map<string, boolean>();
  const queue = [...sourceNodes];
  while (queue.length) {
    const node = queue.shift()!;
    if (barriers.has(node)) continue;
    if (consumerNodes.has(node) && !sourceNodes.has(node)) continue;
    for (const alias of aliases.get(node) ?? []) {
      if (!reached.has(alias)) { reached.add(alias); queue.push(alias); }
    }
    for (const edge of nodeEdges.get(node) ?? []) {
      const forward = edge.a === node;
      if ((forward && edge.direction === 'reverse') || (!forward && edge.direction === 'forward')) continue;
      if (!reachedEdges.has(edge.id)) reachedEdges.set(edge.id, forward);
      const next = forward ? edge.b : edge.a;
      if (!reached.has(next)) { reached.add(next); queue.push(next); }
    }
  }

  for (const edge of edges) {
    const forward = reachedEdges.get(edge.id);
    if (forward == null) continue;
    const path = forward ? edge.path : [...edge.path].reverse();
    const entry = result.get(edge.pipeId) ?? { segsStr: [], segsPath: [] };
    entry.segsPath.push(path);
    entry.segsStr.push(path.map(point => `${point.x},${point.y}`).join(' '));
    result.set(edge.pipeId, entry);
  }
  return result;
}
