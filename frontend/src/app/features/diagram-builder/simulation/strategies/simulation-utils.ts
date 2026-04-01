import { SimParams, ValvePosition } from '../../models/sim-equipment.model';
import { SimEdgeState } from '../models/simulation.model';

// --- Constants ---
export const FLOW_EPSILON = 0.1;
export const LARGE_DEMAND = 1_000_000;
export const AMBIENT_TEMP = 70;

// --- Shared helpers used by role strategies ---

export function getValveFactor(params: SimParams): number {
  switch (params.valvePosition) {
    case 'closed':
      return 0;
    case 'throttled':
      return Math.max(0, Math.min(1, (params.throttlePercent ?? 50) / 100));
    case 'open':
    default:
      return 1;
  }
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function weightedAvgTempFromEdges(upstreams: SimEdgeState[]): number {
  const totalFlow = upstreams.reduce((sum, edge) => sum + edge.flowRate, 0);
  if (totalFlow <= FLOW_EPSILON) {
    return upstreams.length ? upstreams[0].temperature : AMBIENT_TEMP;
  }
  return upstreams.reduce((sum, edge) => sum + edge.temperature * edge.flowRate, 0) / totalFlow;
}
