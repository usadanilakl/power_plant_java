import { Injectable, inject } from '@angular/core';
import { DiagramConnection } from '../../models/diagram-shape.model';
import {
  SimEdgeState, SimGraphNode, SimNodeState, defaultNodeState,
} from '../models/simulation.model';
import { SimulationGraphService } from './simulation-graph.service';

const MAX_ITERATIONS = 50;
const PRESSURE_EPSILON = 0.01;
const FLOW_EPSILON = 0.1;

@Injectable()
export class SimulationEngineService {
  private graphService = inject(SimulationGraphService);

  solve(
    graph: Map<number, SimGraphNode>,
    connections: DiagramConnection[],
    currentStates: Map<number, SimNodeState>
  ): { nodes: Map<number, SimNodeState>; edges: Map<number, SimEdgeState> } {
    const connMap = new Map<number, DiagramConnection>();
    for (const c of connections) connMap.set(c.id, c);

    const order = this.graphService.topologicalSort(graph, connections);

    // Ensure every node has a state entry
    for (const node of graph.values()) {
      if (!currentStates.has(node.shapeId)) {
        currentStates.set(node.shapeId, defaultNodeState(node.shapeId, node.role));
      }
    }

    // Iterative solve
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      const prevStates = new Map<number, SimNodeState>();
      for (const [id, s] of currentStates) {
        prevStates.set(id, { ...s });
      }

      for (const shapeId of order) {
        const node = graph.get(shapeId);
        if (!node) continue;

        const state = currentStates.get(shapeId)!;

        // Gather upstream states
        const upstreamStates: SimNodeState[] = [];
        for (const edgeId of node.upstreamEdges) {
          const conn = connMap.get(edgeId);
          if (conn) {
            const us = currentStates.get(conn.sourceShapeId);
            if (us) upstreamStates.push(us);
          }
        }

        const computed = this.computeNode(node, state.params, upstreamStates);
        currentStates.set(shapeId, {
          ...state,
          pressure: computed.pressure,
          temperature: computed.temperature,
          flowRate: computed.flowRate,
          isFlowing: computed.flowRate > FLOW_EPSILON,
        });
      }

      // Convergence check
      let maxDelta = 0;
      for (const [id, state] of currentStates) {
        const prev = prevStates.get(id);
        if (prev) {
          maxDelta = Math.max(
            maxDelta,
            Math.abs(state.pressure - prev.pressure),
            Math.abs(state.flowRate - prev.flowRate)
          );
        }
      }
      if (maxDelta < PRESSURE_EPSILON) break;
    }

    // Compute edge states
    const edges = new Map<number, SimEdgeState>();
    for (const conn of connections) {
      const sourceState = currentStates.get(conn.sourceShapeId);
      const sourceNode = graph.get(conn.sourceShapeId);
      if (!sourceState || !sourceNode) {
        edges.set(conn.id, {
          connectionId: conn.id,
          flowRate: 0, pressure: 0, temperature: 0, isFlowing: false,
        });
        continue;
      }

      const numDown = Math.max(1, sourceNode.downstreamEdges.length);
      const edgeFlow = sourceState.flowRate / numDown;

      edges.set(conn.id, {
        connectionId: conn.id,
        flowRate: edgeFlow,
        pressure: sourceState.pressure,
        temperature: sourceState.temperature,
        isFlowing: edgeFlow > FLOW_EPSILON,
      });
    }

    return { nodes: currentStates, edges };
  }

  private computeNode(
    node: SimGraphNode,
    params: SimNodeState['params'],
    upstreams: SimNodeState[]
  ): { pressure: number; temperature: number; flowRate: number } {
    const totalFlow = upstreams.reduce((s, u) => s + u.flowRate, 0);
    const avgPressure = upstreams.length
      ? upstreams.reduce((s, u) => s + u.pressure, 0) / upstreams.length
      : 0;
    const avgTemp = this.weightedAvgTemp(upstreams);

    switch (node.role) {
      case 'source':
        return {
          pressure: params.sourcePressure ?? 100,
          temperature: params.sourceTemperature ?? 500,
          flowRate: params.sourceFlowRate ?? 10000,
        };

      case 'sink':
        return {
          pressure: 0,
          temperature: avgTemp,
          flowRate: totalFlow,
        };

      case 'valve':
        if (params.valvePosition === 'closed') {
          return { pressure: avgPressure, temperature: avgTemp, flowRate: 0 };
        }
        if (params.valvePosition === 'throttled') {
          const factor = (params.throttlePercent ?? 50) / 100;
          return {
            pressure: avgPressure * factor,
            temperature: avgTemp,
            flowRate: totalFlow * factor,
          };
        }
        // open
        return { pressure: avgPressure, temperature: avgTemp, flowRate: totalFlow };

      case 'pump':
        if (!params.pumpRunning) {
          return { pressure: avgPressure, temperature: avgTemp, flowRate: 0 };
        }
        return {
          pressure: avgPressure + (params.pumpDeltaP ?? 50),
          temperature: avgTemp,
          flowRate: totalFlow,
        };

      case 'pipe':
        return {
          pressure: Math.max(0, avgPressure - (params.pipeFrictionDrop ?? 0.5)),
          temperature: avgTemp,
          flowRate: totalFlow,
        };

      case 'instrument':
      case 'motor':
      case 'junction':
      default:
        return { pressure: avgPressure, temperature: avgTemp, flowRate: totalFlow };
    }
  }

  private weightedAvgTemp(upstreams: SimNodeState[]): number {
    const totalFlow = upstreams.reduce((s, u) => s + u.flowRate, 0);
    if (totalFlow <= 0) return upstreams.length ? upstreams[0].temperature : 0;
    return upstreams.reduce((s, u) => s + u.temperature * u.flowRate, 0) / totalFlow;
  }
}
