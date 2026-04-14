import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';
import { FLOW_EPSILON } from './simulation-utils';

/**
 * Bearing: oil flows through, picking up heat from the bearing.
 *
 * - bearingTemp: operating temperature of bearing metal (friction heat source).
 * - heatTransferCoeff: fraction of (bearingTemp - oilInTemp) added to oil per pass (0-1).
 *   Higher flow = less time in bearing = less heat pickup per unit, but more total heat removed.
 * - bearingFlowRequired: minimum flow for adequate lubrication.
 * - bearingMaxTemp: warning threshold for inlet oil temperature.
 *
 * Oil outlet temp = oilInTemp + heatTransferCoeff * (bearingTemp - oilInTemp)
 * At low flow, oil picks up more heat per unit (longer residence time).
 */
export const bearingStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input;
    const required = currentState.params.bearingFlowRequired ?? 100;
    const maxTemp = currentState.params.bearingMaxTemp ?? 180;
    const bearingTemp = currentState.params.bearingTemp ?? 200;
    const baseCoeff = currentState.params.heatTransferCoeff ?? 0.3;
    const warnings: string[] = [];
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);

    if (totalInFlow < required - FLOW_EPSILON) {
      warnings.push(`Low flow: ${totalInFlow.toFixed(0)} / ${required} required`);
    }
    if (totalInFlow < FLOW_EPSILON) {
      warnings.push('No flow to bearing');
    }

    // Heat transfer: lower flow → longer residence → more heat pickup per unit
    const residenceFactor = totalInFlow > FLOW_EPSILON
      ? Math.min(1, required / totalInFlow)
      : 1;
    const effectiveCoeff = baseCoeff * residenceFactor;
    const outTemp = avgInTemp + effectiveCoeff * (bearingTemp - avgInTemp);

    if (outTemp > maxTemp) {
      warnings.push(`High oil temp: ${outTemp.toFixed(0)}°F > ${maxTemp}°F`);
    }

    return {
      outFlow,
      pressure: avgInPressure,
      temperature: outTemp,
      warnings,
    };
  },

  computeDemand(_node: SimNode, state: SimNodeState, childDemand: number): number {
    // Bearing demands its required flow, plus any downstream demand (drain path)
    const required = state.params.bearingFlowRequired ?? 100;
    return Math.max(required, childDemand);
  },
};
