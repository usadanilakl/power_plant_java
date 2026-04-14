import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';

/**
 * Filter: passthrough with a fixed pressure drop (filterDeltaP).
 */
export const filterStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input;
    const deltaP = currentState.params.filterDeltaP ?? 5;
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);

    return {
      outFlow,
      pressure: Math.max(0, avgInPressure - deltaP),
      temperature: avgInTemp,
      warnings: [],
    };
  },

  computeDemand(_node: SimNode, _state: SimNodeState, childDemand: number): number {
    return childDemand;
  },
};
