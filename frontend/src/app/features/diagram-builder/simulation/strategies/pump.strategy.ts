import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';
import { FLOW_EPSILON, LARGE_DEMAND } from './simulation-utils';

export const pumpStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input;
    const warnings: string[] = [];

    if (!currentState.params.pumpRunning) {
      warnings.push('Pump stopped');
      return {
        outFlow: 0,
        pressure: avgInPressure,
        temperature: avgInTemp,
        warnings,
      };
    }

    const suctionOk = totalInFlow > FLOW_EPSILON
      && avgInPressure >= (currentState.params.minInletPressure ?? 0);

    if (!suctionOk) {
      warnings.push(totalInFlow <= FLOW_EPSILON ? 'No inlet flow' : 'Low inlet pressure');
      warnings.push('Cavitation risk');
      return {
        outFlow: 0,
        pressure: avgInPressure,
        temperature: avgInTemp,
        warnings,
      };
    }

    const maxFlow = currentState.params.maxFlow ?? LARGE_DEMAND;
    const outFlow = Math.min(totalInFlow, wantedFlow || maxFlow, maxFlow);
    const pressure = avgInPressure
      + (currentState.params.pumpDeltaP ?? 50) * (currentState.params.pumpEfficiency ?? 1);

    return { outFlow, pressure, temperature: avgInTemp, warnings };
  },

  computeDemand(node: SimNode, state: SimNodeState, childDemand: number): number {
    if (state.params.pumpRunning === false) return 0;
    const maxFlow = state.params.maxFlow ?? LARGE_DEMAND;
    return Math.min(maxFlow, childDemand > 0 ? childDemand : maxFlow);
  },
};
