import { Injectable } from '@angular/core';
import { SimNode, SimEdge } from '../models/sim-graph.model';

/**
 * Graph utilities for the simulation engine.
 * Graph building is now handled by SimGraphBuilderService.
 * This service retains topological sort and any future graph algorithms.
 */
@Injectable()
export class SimulationGraphService {

  /**
   * Topological sort via BFS from source nodes.
   * Returns ordered list of node IDs for forward propagation.
   */
  topologicalSort(
    nodes: Map<number, SimNode>,
    edges: Map<number, SimEdge>
  ): number[] {
    const sources = [...nodes.values()].filter(n => n.role === 'source').map(n => n.id);
    const queue = [...sources];
    const visited = new Set<number>();
    const order: number[] = [];

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;

      const node = nodes.get(id)!;
      const allUpstreamReady = node.upstreamEdgeIds.every(edgeId => {
        const edge = edges.get(edgeId);
        return !edge || visited.has(edge.sourceNodeId);
      });

      if (!allUpstreamReady && !sources.includes(id)) {
        queue.push(id);
        continue;
      }

      visited.add(id);
      order.push(id);

      for (const edgeId of node.downstreamEdgeIds) {
        const edge = edges.get(edgeId);
        if (edge && !visited.has(edge.targetNodeId)) {
          queue.push(edge.targetNodeId);
        }
      }
    }

    // Append unreachable nodes
    for (const id of nodes.keys()) {
      if (!visited.has(id)) order.push(id);
    }

    return order;
  }
}
