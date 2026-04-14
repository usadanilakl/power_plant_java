import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';
import { FLOW_EPSILON } from './simulation-utils';

/**
 * Heat exchanger with two fluid circuits (primary and secondary).
 *
 * Primary side (e.g., oil): enters on targetPort='primary', exits on sourcePort='primary'.
 * Secondary side (e.g., CW): enters on targetPort='secondary', exits on sourcePort='secondary'.
 *
 * Heat transfer: Q = effectiveness * Cmin * (T_hot - T_cold)
 * Each side exits at a modified temperature. Flow passes through independently per circuit.
 *
 * Params:
 * - hxEffectiveness: 0-1 (default 0.7) — thermal effectiveness of the exchanger
 */
export const heatExchangerStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, inFlowByPort } = input;
    const effectiveness = currentState.params.hxEffectiveness ?? 0.7;
    const warnings: string[] = [];

    const primary = inFlowByPort?.['primary'] ?? { flow: 0, temp: 70, pressure: 0 };
    const secondary = inFlowByPort?.['secondary'] ?? { flow: 0, temp: 70, pressure: 0 };

    const totalOutFlow = primary.flow + secondary.flow;

    // Heat transfer between circuits
    let primaryOutTemp = primary.temp;
    let secondaryOutTemp = secondary.temp;

    if (primary.flow > FLOW_EPSILON && secondary.flow > FLOW_EPSILON) {
      // Q = effectiveness * Cmin * (T_hot - T_cold)
      // Assuming equal specific heat capacity, Cmin = min flow rate
      const minFlow = Math.min(primary.flow, secondary.flow);
      const q = effectiveness * minFlow * (primary.temp - secondary.temp);

      // Temperature changes inversely proportional to flow rate
      primaryOutTemp = primary.temp - q / primary.flow;
      secondaryOutTemp = secondary.temp + q / secondary.flow;
    } else if (primary.flow <= FLOW_EPSILON && secondary.flow > FLOW_EPSILON) {
      warnings.push('No primary flow');
    } else if (secondary.flow <= FLOW_EPSILON && primary.flow > FLOW_EPSILON) {
      warnings.push('No secondary flow — no cooling');
    } else {
      warnings.push('No flow');
    }

    // Average pressure for display (each circuit maintains its own pressure via ports)
    const avgPressure = totalOutFlow > FLOW_EPSILON
      ? (primary.pressure * primary.flow + secondary.pressure * secondary.flow) / totalOutFlow
      : 0;

    return {
      outFlow: totalOutFlow,
      pressure: avgPressure,
      temperature: primary.flow > FLOW_EPSILON ? primaryOutTemp : secondaryOutTemp,
      warnings,
      // Each circuit gets its own flow fraction and temperature
      portFlowDistribution: {
        primary: totalOutFlow > FLOW_EPSILON ? primary.flow / totalOutFlow : 0.5,
        secondary: totalOutFlow > FLOW_EPSILON ? secondary.flow / totalOutFlow : 0.5,
      },
      portTemperatures: {
        primary: primaryOutTemp,
        secondary: secondaryOutTemp,
      },
    };
  },

  computeDemand(node: SimNode, state: SimNodeState, childDemand: number, demandByPort?: Record<string, number>): number {
    // Demand from both circuits propagates upstream independently
    return childDemand;
  },
};
