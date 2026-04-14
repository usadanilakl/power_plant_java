import { SimRole, SimParams } from '../../models/sim-equipment.model';

/**
 * Pure simulation node — topology + physics only, zero visual data.
 * Decoupled from DiagramPlacement so the engine never touches rendering concerns.
 */
export interface SimNode {
  id: number;              // matches DiagramPlacement.id (localId)
  role: SimRole;
  params: SimParams;
  simEquipmentId?: number;
  upstreamEdgeIds: number[];
  downstreamEdgeIds: number[];
}

/**
 * Pure simulation edge — pipe physics only, zero visual data.
 * Decoupled from DiagramConnection.
 */
export interface SimEdge {
  id: number;              // matches DiagramConnection.id
  sourceNodeId: number;
  targetNodeId: number;
  pipeParams: SimParams;   // parsed pipeParamsJson
  sourcePort?: string;     // multi-port support (e.g., 'A', 'B')
  targetPort?: string;
}
