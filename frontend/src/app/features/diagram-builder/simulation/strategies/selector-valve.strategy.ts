import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';

/**
 * Selector (duplex) valve: routes 100% flow to the selected port (A or B), zero to the other.
 * No throttling — binary path selection.
 */
export const selectorValveStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input;
    const selected = currentState.params.selectedPort ?? 'A';
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);

    return {
      outFlow,
      pressure: avgInPressure * 0.98,
      temperature: avgInTemp,
      warnings: [],
      portFlowDistribution: {
        A: selected === 'A' ? 1 : 0,
        B: selected === 'B' ? 1 : 0,
      },
    };
  },

  computeDemand(node: SimNode, state: SimNodeState, childDemand: number, demandByPort?: Record<string, number>): number {
    if (!demandByPort) return childDemand;
    const selected = state.params.selectedPort ?? 'A';
    return demandByPort[selected] ?? 0;
  },
};
