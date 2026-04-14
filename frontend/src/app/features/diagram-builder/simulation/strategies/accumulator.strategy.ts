import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';

/**
 * Accumulator: pressure dampener with gas bladder/piston.
 * Absorbs pressure spikes and supplies pressure during dips.
 * Oil passes through with minimal temperature change (small internal volume).
 * Output pressure smoothed toward accumulatorSetPressure.
 */
export const accumulatorStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, previousState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input;
    const setPressure = currentState.params.accumulatorSetPressure ?? 50;
    const dampingRate = currentState.params.accumulatorDamping ?? 0.3;
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);
    const warnings: string[] = [];

    // Pressure smoothing: blend inlet pressure toward set pressure
    const prevPressure = previousState.pressure || avgInPressure;
    const smoothed = prevPressure + dampingRate * (avgInPressure - prevPressure);
    const pressure = Math.max(0, smoothed);

    if (avgInPressure < setPressure * 0.8) {
      warnings.push('Low supply pressure');
    }

    return {
      outFlow,
      pressure,
      temperature: avgInTemp,
      warnings,
    };
  },

  computeDemand(_node: SimNode, _state: SimNodeState, childDemand: number): number {
    return childDemand;
  },
};
