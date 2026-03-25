import { Injectable } from '@angular/core';
import { DiagramPlacement, DiagramConnection } from '../../models/diagram-placement.model';
import {
  SimRole,
  SYMBOL_ROLE_MAP,
  defaultSimParams,
  normalizeSimRole,
  parseSimParams,
} from '../../models/sim-equipment.model';
import { SimGraphNode } from '../models/simulation.model';

@Injectable()
export class SimulationGraphService {

  buildGraph(
    placements: DiagramPlacement[],
    connections: DiagramConnection[]
  ): Map<number, SimGraphNode> {
    const graph = new Map<number, SimGraphNode>();

    // Create nodes from placements
    for (const placement of placements) {
      const role = this.determineRole(placement);
      graph.set(placement.id, {
        shapeId: placement.id,
        role,
        params: placement.simParamsJson
          ? { ...defaultSimParams(role), ...parseSimParams(placement.simParamsJson) }
          : defaultSimParams(role),
        simEquipmentId: placement.simEquipmentId,
        upstreamEdges: [],
        downstreamEdges: [],
      });
    }

    // Wire edges from connections
    for (const conn of connections) {
      const sourceNode = graph.get(conn.sourcePlacementId);
      const targetNode = graph.get(conn.targetPlacementId);
      if (sourceNode) sourceNode.downstreamEdges.push(conn.id);
      if (targetNode) targetNode.upstreamEdges.push(conn.id);
    }

    return graph;
  }

  private determineRole(placement: DiagramPlacement): SimRole {
    if (placement.simRole) {
      return normalizeSimRole(placement.simRole);
    }
    if (placement.type === 'symbol' && placement.symbolId) {
      return SYMBOL_ROLE_MAP[placement.symbolId] ?? 'junction';
    }
    if (placement.type === 'line') return 'pipe';
    return 'junction';
  }

  /**
   * Topological sort via BFS from source nodes.
   * Returns ordered list of shapeIds for forward propagation.
   */
  topologicalSort(
    graph: Map<number, SimGraphNode>,
    connections: DiagramConnection[]
  ): number[] {
    const connMap = new Map<number, DiagramConnection>();
    for (const c of connections) connMap.set(c.id, c);

    // Find sources
    const sources = [...graph.values()].filter(n => n.role === 'source').map(n => n.shapeId);
    const queue = [...sources];
    const visited = new Set<number>();
    const order: number[] = [];

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;

      // Check all upstream nodes are visited (except for sources)
      const node = graph.get(id)!;
      const allUpstreamReady = node.upstreamEdges.every(edgeId => {
        const conn = connMap.get(edgeId);
        return !conn || visited.has(conn.sourcePlacementId);
      });

      if (!allUpstreamReady && !sources.includes(id)) {
        // Re-enqueue — upstream not ready yet
        queue.push(id);
        continue;
      }

      visited.add(id);
      order.push(id);

      // Enqueue downstream nodes
      for (const edgeId of node.downstreamEdges) {
        const conn = connMap.get(edgeId);
        if (conn && !visited.has(conn.targetPlacementId)) {
          queue.push(conn.targetPlacementId);
        }
      }
    }

    // Add any unreachable nodes (isolated or in pure cycles) with zero flow
    for (const id of graph.keys()) {
      if (!visited.has(id)) order.push(id);
    }

    return order;
  }
}
