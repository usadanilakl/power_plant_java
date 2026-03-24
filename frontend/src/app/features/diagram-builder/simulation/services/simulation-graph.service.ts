import { Injectable } from '@angular/core';
import { DiagramConnection, DiagramElement, DiagramSymbolShape } from '../../models/diagram-shape.model';
import {
  SimGraphNode, SimNodeRole, SYMBOL_ROLE_MAP, roleFromShapeType, defaultParams,
} from '../models/simulation.model';

@Injectable()
export class SimulationGraphService {

  buildGraph(
    shapes: DiagramElement[],
    connections: DiagramConnection[]
  ): Map<number, SimGraphNode> {
    const graph = new Map<number, SimGraphNode>();

    // Create nodes from shapes
    for (const shape of shapes) {
      const role = this.determineRole(shape);
      graph.set(shape.id, {
        shapeId: shape.id,
        role,
        params: defaultParams(role),
        upstreamEdges: [],
        downstreamEdges: [],
      });
    }

    // Wire edges from connections
    for (const conn of connections) {
      const sourceNode = graph.get(conn.sourceShapeId);
      const targetNode = graph.get(conn.targetShapeId);
      if (sourceNode) sourceNode.downstreamEdges.push(conn.id);
      if (targetNode) targetNode.upstreamEdges.push(conn.id);
    }

    return graph;
  }

  private determineRole(shape: DiagramElement): SimNodeRole {
    if (shape.type === 'symbol') {
      const sym = shape as DiagramSymbolShape;
      return SYMBOL_ROLE_MAP[sym.symbolId] ?? 'junction';
    }
    return roleFromShapeType(shape.type);
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
        return !conn || visited.has(conn.sourceShapeId);
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
        if (conn && !visited.has(conn.targetShapeId)) {
          queue.push(conn.targetShapeId);
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
