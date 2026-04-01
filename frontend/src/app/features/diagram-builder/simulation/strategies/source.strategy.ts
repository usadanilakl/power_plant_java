import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';
import { AMBIENT_TEMP } from './simulation-utils';

export const sourceStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, wantedFlow } = input;
    const flowRate = currentState.params.sourceFlowRate ?? 0;
    return {
      outFlow: Math.min(flowRate, wantedFlow || flowRate),
      pressure: currentState.params.sourcePressure ?? 100,
      temperature: currentState.params.sourceTemperature ?? AMBIENT_TEMP,
      warnings: [],
    };
  },

  computeDemand(node: SimNode, state: SimNodeState, childDemand: number): number {
    return childDemand > 0
      ? Math.min(childDemand, state.params.sourceFlowRate ?? childDemand)
      : (state.params.sourceFlowRate ?? 0);
  },
};
