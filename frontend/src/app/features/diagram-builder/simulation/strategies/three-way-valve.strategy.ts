import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';

/**
 * Three-way valve: diverts flow between port A and port B based on threeWayPosition (0-100).
 * Position 0 = all to port A, position 100 = all to port B.
 */
export const threeWayValveStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input;
    const position = Math.max(0, Math.min(100, currentState.params.threeWayPosition ?? 50));
    const fractionB = position / 100;
    const fractionA = 1 - fractionB;
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);
    const warnings: string[] = [];

    return {
      outFlow,
      pressure: avgInPressure * 0.95,
      temperature: avgInTemp,
      warnings,
      portFlowDistribution: { A: fractionA, B: fractionB },
    };
  },

  computeDemand(node: SimNode, state: SimNodeState, childDemand: number, demandByPort?: Record<string, number>): number {
    if (!demandByPort) return childDemand;
    const position = Math.max(0, Math.min(100, state.params.threeWayPosition ?? 50));
    const fractionA = 1 - position / 100;
    const fractionB = position / 100;
    const demandA = demandByPort['A'] ?? 0;
    const demandB = demandByPort['B'] ?? 0;
    return demandA * fractionA + demandB * fractionB;
  },
};
