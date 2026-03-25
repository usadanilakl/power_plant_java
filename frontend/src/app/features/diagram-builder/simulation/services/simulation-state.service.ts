import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DiagramPlacement, DiagramConnection } from '../../models/diagram-placement.model';
import {
  SimEdgeState, SimGraphNode, SimNodeState, defaultNodeState,
} from '../models/simulation.model';
import { SimParams, SimRole } from '../../models/sim-equipment.model';
import { SimulationGraphService } from './simulation-graph.service';
import { SimulationEngineService } from './simulation-engine.service';

@Injectable()
export class SimulationStateService {
  private graphService = inject(SimulationGraphService);
  private engine = inject(SimulationEngineService);
  private readonly tickMs = 500;
  private readonly dtSeconds = 1;

  readonly isSimulating = signal(false);
  readonly simTimeSeconds = signal(0);

  private graph = new Map<number, SimGraphNode>();
  private connections: DiagramConnection[] = [];
  private nodeSubjects = new Map<number, BehaviorSubject<SimNodeState>>();
  private edgeSubjects = new Map<number, BehaviorSubject<SimEdgeState>>();
  private _nodeStates = new Map<number, SimNodeState>();
  private _edgeStates = new Map<number, SimEdgeState>();
  private tickHandle: ReturnType<typeof setInterval> | null = null;

  activate(shapes: DiagramPlacement[], connections: DiagramConnection[]): void {
    this.stopTicking();
    this.connections = connections;
    this.graph = this.graphService.buildGraph(shapes, connections);
    this.simTimeSeconds.set(0);

    // Initialize node states with defaults
    this._nodeStates.clear();
    this.nodeSubjects.clear();
    for (const node of this.graph.values()) {
      const state = defaultNodeState(node.shapeId, node.role);
      state.params = { ...node.params };
      this._nodeStates.set(node.shapeId, state);
      this.nodeSubjects.set(node.shapeId, new BehaviorSubject(state));
    }

    // Initialize edge states
    this._edgeStates.clear();
    this.edgeSubjects.clear();
    for (const conn of connections) {
      const edge: SimEdgeState = {
        connectionId: conn.id, flowRate: 0, pressure: 0, temperature: 0, isFlowing: false,
      };
      this._edgeStates.set(conn.id, edge);
      this.edgeSubjects.set(conn.id, new BehaviorSubject(edge));
    }

    this.isSimulating.set(true);
    this.runStep();
    this.startTicking();
  }

  deactivate(): void {
    this.stopTicking();
    this.isSimulating.set(false);
    this.simTimeSeconds.set(0);
    for (const sub of this.nodeSubjects.values()) sub.complete();
    for (const sub of this.edgeSubjects.values()) sub.complete();
    this.nodeSubjects.clear();
    this.edgeSubjects.clear();
    this._nodeStates.clear();
    this._edgeStates.clear();
    this.graph.clear();
  }

  updateNodeParams(shapeId: number, updates: Partial<SimParams>): void {
    const state = this._nodeStates.get(shapeId);
    if (!state) return;

    state.params = { ...state.params, ...updates };
    const graphNode = this.graph.get(shapeId);
    if (graphNode) {
      graphNode.params = { ...graphNode.params, ...updates };
    }
    this.runStep();
  }

  updateNodeRole(shapeId: number, role: SimRole): void {
    const state = this._nodeStates.get(shapeId);
    if (!state) return;

    state.role = role;
    const graphNode = this.graph.get(shapeId);
    if (graphNode) graphNode.role = role;

    this.runStep();
  }

  getNodeState$(shapeId: number): Observable<SimNodeState> | undefined {
    return this.nodeSubjects.get(shapeId)?.asObservable();
  }

  getNodeState(shapeId: number): SimNodeState | undefined {
    return this._nodeStates.get(shapeId);
  }

  getEdgeState(connectionId: number): SimEdgeState | undefined {
    return this._edgeStates.get(connectionId);
  }

  getAllNodeStates(): SimNodeState[] {
    return [...this._nodeStates.values()];
  }

  getAllEdgeStates(): SimEdgeState[] {
    return [...this._edgeStates.values()];
  }

  private runStep(): void {
    const result = this.engine.step(this.graph, this.connections, this._nodeStates, this.dtSeconds);

    // Update node states and notify subscribers
    for (const [id, state] of result.nodes) {
      this._nodeStates.set(id, state);
      this.nodeSubjects.get(id)?.next(state);
    }

    // Update edge states and notify subscribers
    for (const [id, edge] of result.edges) {
      this._edgeStates.set(id, edge);
      this.edgeSubjects.get(id)?.next(edge);
    }
  }

  private startTicking(): void {
    this.tickHandle = setInterval(() => {
      if (!this.isSimulating()) return;
      this.runStep();
      this.simTimeSeconds.update(value => value + this.dtSeconds);
    }, this.tickMs);
  }

  private stopTicking(): void {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }
}
