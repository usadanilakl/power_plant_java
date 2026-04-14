import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';

/**
 * Heater: passthrough that adds temperature when running.
 * Flow and pressure pass through unchanged. Temperature increases by heaterDeltaT.
 */
export const heaterStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input;
    const running = currentState.params.heaterRunning ?? false;
    const deltaT = currentState.params.heaterDeltaT ?? 0;
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);
    const warnings: string[] = [];

    if (!running) {
      warnings.push('Heater off');
    }

    return {
      outFlow,
      pressure: avgInPressure,
      temperature: running ? avgInTemp + deltaT : avgInTemp,
      warnings,
    };
  },

  computeDemand(_node: SimNode, _state: SimNodeState, childDemand: number): number {
    return childDemand;
  },
};
