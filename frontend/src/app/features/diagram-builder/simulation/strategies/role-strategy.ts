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
}

/**
 * Strategy interface that each simulation role must implement.
 */
export interface RoleStrategy {
  /** Forward pass: compute output flow, pressure, temperature from inputs */
  compute(input: RoleComputeInput): RoleComputeOutput;

  /** Backward pass: compute how much demand this node requests from upstream */
  computeDemand(node: SimNode, state: SimNodeState, childDemand: number): number;
}
