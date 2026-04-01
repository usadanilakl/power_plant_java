import { SimRole, SimParams, ValvePosition, defaultSimParams } from '../../models/sim-equipment.model';

// Re-export for convenience
export type { SimRole, SimParams, ValvePosition };

export interface SimNodeState {
  shapeId: number;
  role: SimRole;
  params: SimParams;
  pressure: number;
  temperature: number;
  flowRate: number;
  isFlowing: boolean;
  warnings?: string[];
}

export interface SimEdgeState {
  connectionId: number;
  flowRate: number;
  pressure: number;
  temperature: number;
  isFlowing: boolean;
}

export function defaultNodeState(shapeId: number, role: SimRole): SimNodeState {
  return {
    shapeId,
    role,
    params: defaultSimParams(role),
    pressure: 0,
    temperature: 0,
    flowRate: 0,
    isFlowing: false,
    warnings: [],
  };
}
