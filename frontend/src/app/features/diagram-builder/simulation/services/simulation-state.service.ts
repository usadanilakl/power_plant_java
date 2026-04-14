import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DiagramPlacement, DiagramConnection } from '../../models/diagram-placement.model';
import { SimEdgeState, SimNodeState, defaultNodeState, DEFAULT_AMBIENT_TEMP } from '../models/simulation.model';
import { SimNode, SimEdge } from '../models/sim-graph.model';
import { SimParams, SimRole } from '../../models/sim-equipment.model';
import { SimGraphBuilderService } from './sim-graph-builder.service';
import { SimulationEngineService } from './simulation-engine.service';

@Injectable()
export class SimulationStateService {
  private graphBuilder = inject(SimGraphBuilderService);
  private engine = inject(SimulationEngineService);
  private readonly tickMs = 500;
  private readonly dtSeconds = 1;

  readonly isSimulating = signal(false);
  readonly simTimeSeconds = signal(0);

  private nodes = new Map<number, SimNode>();
  private edges = new Map<number, SimEdge>();
  private nodeSubjects = new Map<number, BehaviorSubject<SimNodeState>>();
  private edgeSubjects = new Map<number, BehaviorSubject<SimEdgeState>>();
  private _nodeStates = new Map<number, SimNodeState>();
  private _edgeStates = new Map<number, SimEdgeState>();
  private tickHandle: ReturnType<typeof setInterval> | null = null;

  activate(shapes: DiagramPlacement[], connections: DiagramConnection[]): void {
    this.stopTicking();

    // Build pure simulation graph from visual model
    const graph = this.graphBuilder.build(shapes, connections);
    this.nodes = graph.nodes;
    this.edges = graph.edges;
    this.simTimeSeconds.set(0);

    // Initialize node states
    this._nodeStates.clear();
    this.nodeSubjects.clear();
    for (const node of this.nodes.values()) {
      const state = defaultNodeState(node.id, node.role);
      state.params = { ...node.params };
      this._nodeStates.set(node.id, state);
      this.nodeSubjects.set(node.id, new BehaviorSubject(state));
    }

    // Initialize edge states
    this._edgeStates.clear();
    this.edgeSubjects.clear();
    for (const edge of this.edges.values()) {
      const edgeState: SimEdgeState = {
        connectionId: edge.id, flowRate: 0, pressure: 0, temperature: DEFAULT_AMBIENT_TEMP, isFlowing: false,
      };
      this._edgeStates.set(edge.id, edgeState);
      this.edgeSubjects.set(edge.id, new BehaviorSubject(edgeState));
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
    this.nodes.clear();
    this.edges.clear();
  }

  updateNodeParams(shapeId: number, updates: Partial<SimParams>): void {
    const state = this._nodeStates.get(shapeId);
    if (!state) return;

    state.params = { ...state.params, ...updates };
    const node = this.nodes.get(shapeId);
    if (node) {
      node.params = { ...node.params, ...updates };
    }
    this.runStep();
  }

  updateNodeRole(shapeId: number, role: SimRole): void {
    const state = this._nodeStates.get(shapeId);
    if (!state) return;

    state.role = role;
    const node = this.nodes.get(shapeId);
    if (node) node.role = role;

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
    const result = this.engine.step(this.nodes, this.edges, this._nodeStates, this.dtSeconds);

    for (const [id, state] of result.nodes) {
      this._nodeStates.set(id, state);
      this.nodeSubjects.get(id)?.next(state);
    }

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
