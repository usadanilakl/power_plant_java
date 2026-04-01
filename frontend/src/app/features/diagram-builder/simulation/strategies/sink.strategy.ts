import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';
import { LARGE_DEMAND } from './simulation-utils';

export const sinkStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    return {
      outFlow: 0,
      pressure: input.avgInPressure,
      temperature: input.avgInTemp,
      warnings: [],
    };
  },

  computeDemand(_node: SimNode, _state: SimNodeState, _childDemand: number): number {
    return LARGE_DEMAND;
  },
};
