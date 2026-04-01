import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';
import { getValveFactor, LARGE_DEMAND } from './simulation-utils';

export const valveStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input;
    const openness = getValveFactor(currentState.params);
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow) * openness;
    const warnings: string[] = [];
    if (currentState.params.valvePosition === 'closed') {
      warnings.push('Valve closed');
    }
    return {
      outFlow,
      pressure: avgInPressure * (0.15 + 0.85 * openness),
      temperature: avgInTemp,
      warnings,
    };
  },

  computeDemand(node: SimNode, state: SimNodeState, childDemand: number): number {
    return Math.min(
      childDemand * getValveFactor(state.params),
      state.params.cvCoefficient ?? LARGE_DEMAND,
    );
  },
};
