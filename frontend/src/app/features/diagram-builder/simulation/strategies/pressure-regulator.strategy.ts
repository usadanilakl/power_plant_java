import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';

/**
 * Pressure regulator: passes flow through but caps outlet pressure at setpointPressure.
 * Flow is limited by regulatorMaxFlow.
 */
export const pressureRegulatorStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input;
    const setpoint = currentState.params.setpointPressure ?? 50;
    const maxFlow = currentState.params.regulatorMaxFlow ?? Infinity;
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow, maxFlow);
    const warnings: string[] = [];

    if (avgInPressure < setpoint) {
      warnings.push('Inlet pressure below setpoint');
    }

    return {
      outFlow,
      pressure: Math.min(avgInPressure, setpoint),
      temperature: avgInTemp,
      warnings,
    };
  },

  computeDemand(node: SimNode, state: SimNodeState, childDemand: number): number {
    const maxFlow = state.params.regulatorMaxFlow ?? Infinity;
    return Math.min(childDemand, maxFlow);
  },
};
