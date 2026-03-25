import { Injectable, inject } from '@angular/core';
import { DiagramConnection } from '../../models/diagram-placement.model';
import {
  SimEdgeState, SimGraphNode, SimNodeState, SimParams, defaultNodeState,
} from '../models/simulation.model';
import { parseSimParams } from '../../models/sim-equipment.model';
import { SimulationGraphService } from './simulation-graph.service';

const FLOW_EPSILON = 0.1;
const LARGE_DEMAND = 1_000_000;
const AMBIENT_TEMP = 70;

@Injectable()
export class SimulationEngineService {
  private graphService = inject(SimulationGraphService);

  step(
    graph: Map<number, SimGraphNode>,
    connections: DiagramConnection[],
    previousStates: Map<number, SimNodeState>,
    dtSeconds: number
  ): { nodes: Map<number, SimNodeState>; edges: Map<number, SimEdgeState> } {
    const connMap = new Map<number, DiagramConnection>();
    for (const c of connections) connMap.set(c.id, c);

    const order = this.graphService.topologicalSort(graph, connections);
    const nextStates = new Map<number, SimNodeState>();
    const edges = new Map<number, SimEdgeState>();
    const demandCache = new Map<number, number>();
    const demandPath = new Set<number>();
    const dtHours = Math.max(dtSeconds, 0.1) / 3600;

    for (const node of graph.values()) {
      const prev = previousStates.get(node.shapeId) ?? defaultNodeState(node.shapeId, node.role);
      nextStates.set(node.shapeId, {
        ...prev,
        role: node.role,
        params: { ...node.params, ...prev.params },
        warnings: [],
      });
    }

    const desiredDemand = (shapeId: number): number => {
      if (demandCache.has(shapeId)) return demandCache.get(shapeId)!;
      if (demandPath.has(shapeId)) return 0;

      demandPath.add(shapeId);
      const node = graph.get(shapeId);
      const state = nextStates.get(shapeId);
      if (!node || !state) {
        demandPath.delete(shapeId);
        return 0;
      }

      const childDemand = node.downstreamEdges.reduce((sum: number, edgeId: number) => {
        const conn = connMap.get(edgeId);
        return sum + (conn ? desiredDemand(conn.targetPlacementId) : 0);
      }, 0);

      let demand = childDemand;
      switch (node.role) {
        case 'sink':
          demand = LARGE_DEMAND;
          break;
        case 'pump':
          demand = state.params.pumpRunning === false
            ? 0
            : Math.min(state.params.maxFlow ?? LARGE_DEMAND, childDemand > 0 ? childDemand : (state.params.maxFlow ?? LARGE_DEMAND));
          break;
        case 'valve':
          demand = Math.min(
            childDemand * this.getValveFactor(state.params),
            state.params.cvCoefficient ?? LARGE_DEMAND
          );
          break;
        case 'source':
          demand = childDemand > 0 ? Math.min(childDemand, state.params.sourceFlowRate ?? childDemand) : (state.params.sourceFlowRate ?? 0);
          break;
        case 'vessel':
          demand = childDemand;
          break;
        default:
          demand = childDemand;
          break;
      }

      demandPath.delete(shapeId);
      demandCache.set(shapeId, demand);
      return demand;
    };

    for (const shapeId of graph.keys()) {
      desiredDemand(shapeId);
    }

    for (const shapeId of order) {
      const node = graph.get(shapeId);
      const state = nextStates.get(shapeId);
      if (!node || !state) continue;

      const previous = previousStates.get(shapeId) ?? state;
      const upstreamEdges = node.upstreamEdges
        .map((edgeId: number) => edges.get(edgeId))
        .filter((edge): edge is SimEdgeState => !!edge);

      const totalInFlow = upstreamEdges.reduce((sum: number, edge: SimEdgeState) => sum + edge.flowRate, 0);
      const avgInPressure = upstreamEdges.length
        ? upstreamEdges.reduce((sum: number, edge: SimEdgeState) => sum + edge.pressure, 0) / upstreamEdges.length
        : 0;
      const avgInTemp = this.weightedAvgTempFromEdges(upstreamEdges);
      const wantedFlow = demandCache.get(shapeId) ?? 0;
      let outFlow = 0;
      let pressure = avgInPressure;
      let temperature = upstreamEdges.length ? avgInTemp : previous.temperature || AMBIENT_TEMP;
      const warnings: string[] = [];

      switch (node.role) {
        case 'source':
          outFlow = Math.min(state.params.sourceFlowRate ?? 0, wantedFlow || (state.params.sourceFlowRate ?? 0));
          pressure = state.params.sourcePressure ?? 100;
          temperature = state.params.sourceTemperature ?? AMBIENT_TEMP;
          break;

        case 'vessel': {
          const volume = Math.max(1, state.params.volume ?? 1000);
          const currentLevel = this.clampPercent(previous.params.currentLevel ?? state.params.currentLevel ?? 50);
          const storedUnits = volume * (currentLevel / 100);
          const maxDischargeFromInventory = storedUnits / dtHours;
          outFlow = Math.min(
            wantedFlow,
            totalInFlow + maxDischargeFromInventory
          );
          pressure = Math.min(
            state.params.maxPressure ?? LARGE_DEMAND,
            (state.params.sourcePressure ?? 15) * Math.max(0.05, currentLevel / 100)
          );
          temperature = upstreamEdges.length ? avgInTemp : (previous.temperature || AMBIENT_TEMP);
          const nextStoredUnits = Math.max(0, storedUnits + (totalInFlow - outFlow) * dtHours);
          const nextLevel = this.clampPercent((nextStoredUnits / volume) * 100);
          state.params = {
            ...state.params,
            currentLevel: nextLevel,
          };
          if (nextLevel <= (state.params.minLevel ?? 0) + 0.01) {
            warnings.push('Low level');
          }
          if (nextLevel >= 99.9) {
            warnings.push('High level');
          }
          break;
        }

        case 'valve': {
          const openness = this.getValveFactor(state.params);
          outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow) * openness;
          pressure = avgInPressure * (0.15 + 0.85 * openness);
          temperature = avgInTemp;
          if (state.params.valvePosition === 'closed') {
            warnings.push('Valve closed');
          }
          break;
        }

        case 'pump': {
          if (!state.params.pumpRunning) {
            outFlow = 0;
            pressure = avgInPressure;
            temperature = avgInTemp;
            warnings.push('Pump stopped');
            break;
          }

          const suctionOk = totalInFlow > FLOW_EPSILON && avgInPressure >= (state.params.minInletPressure ?? 0);
          if (!suctionOk) {
            outFlow = 0;
            pressure = avgInPressure;
            temperature = avgInTemp;
            warnings.push(totalInFlow <= FLOW_EPSILON ? 'No inlet flow' : 'Low inlet pressure');
            warnings.push('Cavitation risk');
            break;
          }

          const maxFlow = state.params.maxFlow ?? LARGE_DEMAND;
          outFlow = Math.min(totalInFlow, wantedFlow || maxFlow, maxFlow);
          pressure = avgInPressure + (state.params.pumpDeltaP ?? 50) * (state.params.pumpEfficiency ?? 1);
          temperature = avgInTemp;
          break;
        }

        case 'sink':
          outFlow = 0;
          pressure = avgInPressure;
          temperature = avgInTemp;
          break;

        case 'pipe':
        case 'junction':
        case 'instrument':
        case 'motor':
        default:
          outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);
          pressure = avgInPressure;
          temperature = avgInTemp;
          break;
      }

      nextStates.set(shapeId, {
        ...state,
        pressure,
        temperature,
        flowRate: node.role === 'sink' ? totalInFlow : outFlow,
        isFlowing: (node.role === 'sink' ? totalInFlow : outFlow) > FLOW_EPSILON,
        warnings,
      });

      const childWeights = node.downstreamEdges.map((edgeId: number) => {
        const conn = connMap.get(edgeId);
        const childDemand = conn ? (demandCache.get(conn.targetPlacementId) ?? 0) : 0;
        return { edgeId, demand: childDemand };
      });
      const totalChildDemand = childWeights.reduce((sum: number, item: { edgeId: number; demand: number }) => sum + item.demand, 0);

      for (const item of childWeights) {
        const conn = connMap.get(item.edgeId);
        if (!conn) continue;
        const ratio = totalChildDemand > 0
          ? item.demand / totalChildDemand
          : 1 / Math.max(1, childWeights.length);
        const baseEdgeState: SimEdgeState = {
          connectionId: conn.id,
          flowRate: outFlow * ratio,
          pressure,
          temperature,
          isFlowing: outFlow * ratio > FLOW_EPSILON,
        };
        edges.set(conn.id, this.applyPipeEffects(baseEdgeState, conn));
      }
    }

    for (const conn of connections) {
      if (!edges.has(conn.id)) {
        edges.set(conn.id, {
          connectionId: conn.id,
          flowRate: 0,
          pressure: 0,
          temperature: AMBIENT_TEMP,
          isFlowing: false,
        });
      }
    }

    return { nodes: nextStates, edges };
  }

  private getValveFactor(params: SimParams): number {
    switch (params.valvePosition) {
      case 'closed':
        return 0;
      case 'throttled':
        return Math.max(0, Math.min(1, (params.throttlePercent ?? 50) / 100));
      case 'open':
      default:
        return 1;
    }
  }

  private clampPercent(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  private applyPipeEffects(
    sourceState: SimEdgeState,
    conn: DiagramConnection
  ): SimEdgeState {
    const params: SimParams = conn.pipeParamsJson ? parseSimParams(conn.pipeParamsJson) : { schemaVersion: 1 };

    const diameter = Math.max(0.1, params.diameter ?? 1);
    const length = Math.max(0, params.length ?? 0);
    const frictionFactor = Math.max(0, params.frictionFactor ?? 0);
    const insulationFactor = Math.max(0, params.insulationFactor ?? 0);
    const pressureDrop = frictionFactor * length * Math.pow(sourceState.flowRate, 2) / Math.pow(diameter, 5);
    const heatLoss = insulationFactor * length * Math.max(0, sourceState.temperature - AMBIENT_TEMP);

    return {
      ...sourceState,
      pressure: Math.max(0, sourceState.pressure - pressureDrop),
      temperature: Math.max(AMBIENT_TEMP, sourceState.temperature - heatLoss),
    };
  }

  private weightedAvgTempFromEdges(upstreams: SimEdgeState[]): number {
    const totalFlow = upstreams.reduce((sum, edge) => sum + edge.flowRate, 0);
    if (totalFlow <= FLOW_EPSILON) {
      return upstreams.length ? upstreams[0].temperature : AMBIENT_TEMP;
    }
    return upstreams.reduce((sum, edge) => sum + edge.temperature * edge.flowRate, 0) / totalFlow;
  }
}
