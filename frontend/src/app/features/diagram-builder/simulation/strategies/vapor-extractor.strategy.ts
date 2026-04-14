import { RoleStrategy, RoleComputeInput, RoleComputeOutput } from './role-strategy';
import { SimNode } from '../models/sim-graph.model';
import { SimNodeState } from '../models/simulation.model';

/**
 * Vapor extractor: reduces pressure in connected upstream vessel.
 * Does NOT pull liquid flow. Demands minimal flow for visualization purposes.
 * The actual pressure reduction effect is applied by the engine's post-step
 * (see SimulationEngineService.applyVaporExtractorEffects).
 */
export const vaporExtractorStrategy: RoleStrategy = {
  compute(input: RoleComputeInput): RoleComputeOutput {
    const { currentState, avgInPressure, avgInTemp } = input;
    const running = currentState.params.extractorRunning ?? false;
    const warnings: string[] = [];

    if (!running) {
      warnings.push('Extractor off');
    }

    return {
      outFlow: 0,
      pressure: avgInPressure,
      temperature: avgInTemp,
      warnings,
    };
  },

  computeDemand(_node: SimNode, state: SimNodeState, _childDemand: number): number {
    // Vapor extractors don't demand liquid flow
    return 0;
  },
};
