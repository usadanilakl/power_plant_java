import { Injectable } from '@angular/core';
import { SimNode, SimEdge } from '../models/sim-graph.model';
import { SimEdgeState, SimNodeState, defaultNodeState } from '../models/simulation.model';
import { getStrategy } from '../strategies/strategy-registry';
import { FLOW_EPSILON, AMBIENT_TEMP } from '../strategies/simulation-utils';

@Injectable()
export class SimulationEngineService {

  /**
   * Topological sort via BFS from source nodes.
   */
  private topologicalSort(
    nodes: Map<number, SimNode>,
    edges: Map<number, SimEdge>
  ): number[] {
    const indegree = new Map<number, number>();
    for (const node of nodes.values()) {
      indegree.set(node.id, 0);
    }

    for (const edge of edges.values()) {
      if (nodes.has(edge.sourceNodeId) && nodes.has(edge.targetNodeId)) {
        indegree.set(edge.targetNodeId, (indegree.get(edge.targetNodeId) ?? 0) + 1);
      }
    }

    const sources = [...nodes.values()].filter(n => n.role === 'source').map(n => n.id);
    const zeroIndegree = [...nodes.keys()].filter(id => (indegree.get(id) ?? 0) === 0);
    const queue = [...new Set([...(sources.length ? sources : []), ...zeroIndegree])];
    const visited = new Set<number>();
    const order: number[] = [];

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;

      visited.add(id);
      order.push(id);

      const node = nodes.get(id);
      if (!node) continue;

      for (const edgeId of node.downstreamEdgeIds) {
        const edge = edges.get(edgeId);
        if (!edge || !nodes.has(edge.targetNodeId)) continue;

        const nextIndegree = (indegree.get(edge.targetNodeId) ?? 0) - 1;
        indegree.set(edge.targetNodeId, nextIndegree);

        if (nextIndegree <= 0 && !visited.has(edge.targetNodeId)) {
          queue.push(edge.targetNodeId);
        }
      }
    }

    // Append unreachable or cyclic nodes so the engine can still process them safely.
    for (const id of nodes.keys()) {
      if (!visited.has(id)) order.push(id);
    }

    return order;
  }

  step(
    nodes: Map<number, SimNode>,
    edges: Map<number, SimEdge>,
    previousStates: Map<number, SimNodeState>,
    dtSeconds: number
  ): { nodes: Map<number, SimNodeState>; edges: Map<number, SimEdgeState> } {
    const order = this.topologicalSort(nodes, edges);
    const nextStates = new Map<number, SimNodeState>();
    const edgeStates = new Map<number, SimEdgeState>();
    const demandCache = new Map<number, number>();
    const demandPath = new Set<number>();
    const dtHours = Math.max(dtSeconds, 0.1) / 3600;

    // Initialize node states
    for (const node of nodes.values()) {
      const prev = previousStates.get(node.id) ?? defaultNodeState(node.id, node.role);
      nextStates.set(node.id, {
        ...prev,
        role: node.role,
        params: { ...node.params, ...prev.params },
        warnings: [],
      });
    }

    // --- Backward pass: demand propagation ---
    const desiredDemand = (nodeId: number): number => {
      if (demandCache.has(nodeId)) return demandCache.get(nodeId)!;
      if (demandPath.has(nodeId)) return 0;

      demandPath.add(nodeId);
      const node = nodes.get(nodeId);
      const state = nextStates.get(nodeId);
      if (!node || !state) {
        demandPath.delete(nodeId);
        return 0;
      }

      // Build per-port demand breakdown for multi-port strategies
      const demandByPort: Record<string, number> = {};
      let childDemand = 0;
      for (const edgeId of node.downstreamEdgeIds) {
        const edge = edges.get(edgeId);
        if (!edge) continue;
        const edgeDemand = desiredDemand(edge.targetNodeId);
        childDemand += edgeDemand;
        const portKey = edge.sourcePort ?? '';
        demandByPort[portKey] = (demandByPort[portKey] ?? 0) + edgeDemand;
      }

      const strategy = getStrategy(node.role);
      const demand = strategy.computeDemand(node, state, childDemand, demandByPort);

      demandPath.delete(nodeId);
      demandCache.set(nodeId, demand);
      return demand;
    };

    for (const nodeId of nodes.keys()) {
      desiredDemand(nodeId);
    }

    // --- Forward pass: compute node outputs in topological order ---
    for (const nodeId of order) {
      const node = nodes.get(nodeId);
      const state = nextStates.get(nodeId);
      if (!node || !state) continue;

      const previous = previousStates.get(nodeId) ?? state;
      const upstreamEdges = node.upstreamEdgeIds
        .map((edgeId: number) => edgeStates.get(edgeId))
        .filter((edge): edge is SimEdgeState => !!edge);

      const totalInFlow = upstreamEdges.reduce((sum, e) => sum + e.flowRate, 0);
      const avgInPressure = upstreamEdges.length
        ? upstreamEdges.reduce((sum, e) => sum + e.pressure, 0) / upstreamEdges.length
        : 0;
      const avgInTemp = this.weightedAvgTemp(upstreamEdges);
      const wantedFlow = demandCache.get(nodeId) ?? 0;

      // Build per-port upstream aggregates for multi-circuit equipment
      const inFlowByPort: Record<string, { flow: number; temp: number; pressure: number }> = {};
      for (const edgeId of node.upstreamEdgeIds) {
        const edge = edges.get(edgeId);
        const edgeState = edgeStates.get(edgeId);
        if (!edge || !edgeState) continue;
        const portKey = edge.targetPort ?? '';
        const existing = inFlowByPort[portKey];
        if (existing) {
          const totalPortFlow = existing.flow + edgeState.flowRate;
          existing.temp = totalPortFlow > FLOW_EPSILON
            ? (existing.temp * existing.flow + edgeState.temperature * edgeState.flowRate) / totalPortFlow
            : existing.temp;
          existing.pressure = (existing.pressure + edgeState.pressure) / 2;
          existing.flow = totalPortFlow;
        } else {
          inFlowByPort[portKey] = { flow: edgeState.flowRate, temp: edgeState.temperature, pressure: edgeState.pressure };
        }
      }

      const strategy = getStrategy(node.role);
      const result = strategy.compute({
        node,
        previousState: previous,
        currentState: state,
        upstreamEdges,
        totalInFlow,
        avgInPressure,
        avgInTemp,
        wantedFlow,
        dtHours,
        inFlowByPort,
      });

      // Apply param updates (e.g., vessel level)
      if (result.paramUpdates) {
        state.params = { ...state.params, ...result.paramUpdates };
      }

      const effectiveFlow = node.role === 'sink' ? totalInFlow : result.outFlow;
      nextStates.set(nodeId, {
        ...state,
        pressure: result.pressure,
        temperature: result.temperature,
        flowRate: effectiveFlow,
        isFlowing: effectiveFlow > FLOW_EPSILON,
        warnings: result.warnings,
      });

      // Distribute flow to downstream edges — port-aware if strategy provides portFlowDistribution
      const childWeights = node.downstreamEdgeIds.map((edgeId: number) => {
        const edge = edges.get(edgeId);
        const childDem = edge ? (demandCache.get(edge.targetNodeId) ?? 0) : 0;
        return { edgeId, demand: childDem };
      });
      const totalChildDemand = childWeights.reduce((sum, item) => sum + item.demand, 0);

      for (const item of childWeights) {
        const edge = edges.get(item.edgeId);
        if (!edge) continue;

        let ratio: number;
        if (result.portFlowDistribution && edge.sourcePort) {
          // Port-aware: use the fraction assigned to this edge's port
          ratio = result.portFlowDistribution[edge.sourcePort] ?? 0;
        } else {
          // Default: proportional by demand
          ratio = totalChildDemand > 0
            ? item.demand / totalChildDemand
            : 1 / Math.max(1, childWeights.length);
        }

        // Per-port temperature: heat exchangers output different temps per circuit
        const edgeTemp = (result.portTemperatures && edge.sourcePort)
          ? (result.portTemperatures[edge.sourcePort] ?? result.temperature)
          : result.temperature;

        const baseEdge: SimEdgeState = {
          connectionId: edge.id,
          flowRate: result.outFlow * ratio,
          pressure: result.pressure,
          temperature: edgeTemp,
          isFlowing: result.outFlow * ratio > FLOW_EPSILON,
        };
        edgeStates.set(edge.id, this.applyPipeEffects(baseEdge, edge));
      }
    }

    // Zero-fill edges not yet computed
    for (const edge of edges.values()) {
      if (!edgeStates.has(edge.id)) {
        edgeStates.set(edge.id, {
          connectionId: edge.id,
          flowRate: 0,
          pressure: 0,
          temperature: AMBIENT_TEMP,
          isFlowing: false,
        });
      }
    }

    // Post-step: vapor extractors reduce upstream vessel pressure
    this.applyVaporExtractorEffects(nodes, edges, nextStates);

    return { nodes: nextStates, edges: edgeStates };
  }

  private applyPipeEffects(sourceState: SimEdgeState, edge: SimEdge): SimEdgeState {
    const params = edge.pipeParams;
    const diameter = Math.max(0.1, params.diameter ?? 1);
    const length = Math.max(0, params.length ?? 0);
    const frictionFactor = Math.max(0, params.frictionFactor ?? 0);
    const insulationFactor = Math.max(0, params.insulationFactor ?? 0);
    // Scale factor keeps pressure drops reasonable across typical sim flow/diameter ranges.
    // Without it, Q²/D⁵ produces unrealistically large drops at normal flow rates.
    const FRICTION_SCALE = 1e-4;
    const pressureDrop = FRICTION_SCALE * frictionFactor * length * Math.pow(sourceState.flowRate, 2) / Math.pow(diameter, 5);
    const heatLoss = insulationFactor * length * Math.max(0, sourceState.temperature - AMBIENT_TEMP);

    return {
      ...sourceState,
      pressure: Math.max(0, sourceState.pressure - pressureDrop),
      temperature: Math.max(AMBIENT_TEMP, sourceState.temperature - heatLoss),
    };
  }

  private weightedAvgTemp(upstreams: SimEdgeState[]): number {
    const totalFlow = upstreams.reduce((sum, edge) => sum + edge.flowRate, 0);
    if (totalFlow <= FLOW_EPSILON) {
      return upstreams.length ? upstreams[0].temperature : AMBIENT_TEMP;
    }
    return upstreams.reduce((sum, edge) => sum + edge.temperature * edge.flowRate, 0) / totalFlow;
  }

  /**
   * Post-step: running vapor extractors reduce pressure on their upstream vessels.
   * For each running vapor-extractor, find the directly connected upstream node.
   * If it's a vessel, reduce its output pressure by extractorPressureReduction.
   */
  private applyVaporExtractorEffects(
    nodes: Map<number, SimNode>,
    edges: Map<number, SimEdge>,
    states: Map<number, SimNodeState>
  ): void {
    for (const node of nodes.values()) {
      if (node.role !== 'vapor-extractor') continue;
      const state = states.get(node.id);
      if (!state || !(state.params.extractorRunning ?? false)) continue;

      const reduction = state.params.extractorPressureReduction ?? 2;

      // Find upstream vessels and reduce their pressure
      for (const edgeId of node.upstreamEdgeIds) {
        const edge = edges.get(edgeId);
        if (!edge) continue;
        const upstreamNode = nodes.get(edge.sourceNodeId);
        const upstreamState = states.get(edge.sourceNodeId);
        if (!upstreamNode || !upstreamState) continue;
        if (upstreamNode.role === 'vessel') {
          upstreamState.pressure = Math.max(0, upstreamState.pressure - reduction);
        }
      }
    }
  }
}
