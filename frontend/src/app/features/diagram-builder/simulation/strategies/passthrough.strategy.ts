import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';

/**
 * Passthrough strategy for roles that don't transform flow:
 * pipe, junction, instrument, motor
 */
export const passthroughStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input;
    return {
      outFlow: Math.min(totalInFlow, wantedFlow || totalInFlow),
      pressure: avgInPressure,
      temperature: avgInTemp,
      warnings: [],
    };
  },

  computeDemand(_node: SimNode, _state: SimNodeState, childDemand: number): number {
    return childDemand;
  },
};
