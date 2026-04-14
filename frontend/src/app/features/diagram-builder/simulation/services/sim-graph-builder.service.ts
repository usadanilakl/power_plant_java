import { Injectable } from '@angular/core';
import { DiagramPlacement, DiagramConnection } from '../../models/diagram-placement.model';
import { SimNode, SimEdge } from '../models/sim-graph.model';
import {
  SimRole,
  SYMBOL_ROLE_MAP,
  defaultSimParams,
  normalizeSimRole,
  parseSimParams,
} from '../../models/sim-equipment.model';

/**
 * Builds pure simulation graph (SimNode/SimEdge maps) from visual
 * DiagramPlacement/DiagramConnection arrays. This is the bridge
 * between the visual model and the simulation engine.
 */
@Injectable()
export class SimGraphBuilderService {

  build(
    placements: DiagramPlacement[],
    connections: DiagramConnection[]
  ): { nodes: Map<number, SimNode>; edges: Map<number, SimEdge> } {
    const nodes = new Map<number, SimNode>();
    const edges = new Map<number, SimEdge>();

    // Create nodes from placements
    for (const placement of placements) {
      const role = this.determineRole(placement);
      nodes.set(placement.id, {
        id: placement.id,
        role,
        params: placement.simParamsJson
          ? { ...defaultSimParams(role), ...parseSimParams(placement.simParamsJson) }
          : defaultSimParams(role),
        simEquipmentId: placement.simEquipmentId,
        upstreamEdgeIds: [],
        downstreamEdgeIds: [],
      });
    }

    // Create edges from connections and wire to nodes
    for (const conn of connections) {
      const edge: SimEdge = {
        id: conn.id,
        sourceNodeId: conn.sourcePlacementId,
        targetNodeId: conn.targetPlacementId,
        pipeParams: conn.pipeParamsJson
          ? parseSimParams(conn.pipeParamsJson)
          : { schemaVersion: 1 },
        sourcePort: conn.sourcePort,
        targetPort: conn.targetPort,
      };
      edges.set(conn.id, edge);

      const sourceNode = nodes.get(conn.sourcePlacementId);
      const targetNode = nodes.get(conn.targetPlacementId);
      if (sourceNode) sourceNode.downstreamEdgeIds.push(conn.id);
      if (targetNode) targetNode.upstreamEdgeIds.push(conn.id);
    }

    return { nodes, edges };
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
}
