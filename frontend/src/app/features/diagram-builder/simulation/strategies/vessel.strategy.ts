import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState, SimParams } from '../models/simulation.model';
import { AMBIENT_TEMP, LARGE_DEMAND, clampPercent } from './simulation-utils';

export const vesselStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, previousState, totalInFlow, avgInPressure, avgInTemp, wantedFlow, dtHours } = input;
    const warnings: string[] = [];

    const volume = Math.max(1, currentState.params.volume ?? 1000);
    const currentLevel = clampPercent(
      previousState.params.currentLevel ?? currentState.params.currentLevel ?? 50,
    );
    const storedUnits = volume * (currentLevel / 100);
    const maxDischargeFromInventory = storedUnits / dtHours;

    const outFlow = Math.min(wantedFlow, totalInFlow + maxDischargeFromInventory);
    const pressure = Math.min(
      currentState.params.maxPressure ?? LARGE_DEMAND,
      (currentState.params.sourcePressure ?? 15) * Math.max(0.05, currentLevel / 100),
    );
    const temperature = input.upstreamEdges.length ? avgInTemp : (previousState.temperature || AMBIENT_TEMP);

    const nextStoredUnits = Math.max(0, storedUnits + (totalInFlow - outFlow) * dtHours);
    const nextLevel = clampPercent((nextStoredUnits / volume) * 100);

    if (nextLevel <= (currentState.params.minLevel ?? 0) + 0.01) {
      warnings.push('Low level');
    }
    if (nextLevel >= 99.9) {
      warnings.push('High level');
    }

    return {
      outFlow,
      pressure,
      temperature,
      warnings,
      paramUpdates: { currentLevel: nextLevel },
    };
  },

  computeDemand(_node: SimNode, _state: SimNodeState, childDemand: number): number {
    return childDemand;
  },
};
