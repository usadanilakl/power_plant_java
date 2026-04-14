import { SimNode } from '../models/sim-graph.model';
import { SimEdgeState, SimNodeState, SimParams } from '../models/simulation.model';

/**
 * Input provided to each role strategy's compute method.
 */
export interface RoleComputeInput {
  node: SimNode;
  previousState: SimNodeState;
  currentState: SimNodeState;
  upstreamEdges: SimEdgeState[];
  totalInFlow: number;
  avgInPressure: number;
  avgInTemp: number;
  wantedFlow: number;
  dtHours: number;
  /** Per-port upstream aggregates. Keys are targetPort on upstream edges ('' for unported). */
  inFlowByPort?: Record<string, { flow: number; temp: number; pressure: number }>;
}

/**
 * Output from a role strategy's compute method.
 */
export interface RoleComputeOutput {
  outFlow: number;
  pressure: number;
  temperature: number;
  warnings: string[];
  /** Optional mutations to params (e.g., vessel level update) */
  paramUpdates?: Partial<SimParams>;
  /** Optional port-specific flow distribution. Keys are port names, values are flow fractions (0-1). */
  portFlowDistribution?: Record<string, number>;
  /** Optional per-port temperature output. Keys are port names, values are temperatures. */
  portTemperatures?: Record<string, number>;
}

/**
 * Strategy interface that each simulation role must implement.
 */
export interface RoleStrategy {
  /** Forward pass: compute output flow, pressure, temperature from inputs */
  compute(input: RoleComputeInput): RoleComputeOutput;

  /**
   * Backward pass: compute how much demand this node requests from upstream.
   * @param childDemand Total demand from all downstream edges (sum).
   * @param demandByPort Demand grouped by sourcePort on downstream edges. Unported edges are under key ''.
   */
  computeDemand(node: SimNode, state: SimNodeState, childDemand: number, demandByPort?: Record<string, number>): number;
}
