import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulationStateService } from '../services/simulation-state.service';
import { DiagramShapeManagerService } from '../../services/diagram-shape-manager.service';
import { SimNodeState } from '../models/simulation.model';
import { SimRole } from '../../models/sim-equipment.model';

@Component({
  selector: 'app-simulation-inspector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sim-inspector">
      <h3>Simulation</h3>

      @if (nodeState(); as state) {
        <div class="role-section">
          <label>Role
            <select [ngModel]="state.role" (ngModelChange)="changeRole($event)">
              @for (r of roles; track r) {
                <option [value]="r">{{ r }}</option>
              }
            </select>
          </label>
        </div>

        <div class="readout">
          <div class="readout-row">
            <span class="readout-label">Pressure</span>
            <span class="readout-value" [class.flowing]="state.isFlowing">
              {{ state.pressure | number:'1.1-1' }} psi
            </span>
          </div>
          <div class="readout-row">
            <span class="readout-label">Temperature</span>
            <span class="readout-value" [class.flowing]="state.isFlowing">
              {{ state.temperature | number:'1.0-0' }} F
            </span>
          </div>
          <div class="readout-row">
            <span class="readout-label">Flow Rate</span>
            <span class="readout-value" [class.flowing]="state.isFlowing">
              {{ state.flowRate | number:'1.0-0' }} u/hr
            </span>
          </div>
          @if (state.role === 'vessel') {
            <div class="readout-row">
              <span class="readout-label">Level</span>
              <span class="readout-value" [class.flowing]="state.isFlowing">
                {{ state.params.currentLevel ?? 0 | number:'1.0-0' }}%
              </span>
            </div>
          }
        </div>

        @if (state.warnings?.length) {
          <div class="warning-box">
            @for (warning of state.warnings; track warning) {
              <div class="warning-item">{{ warning }}</div>
            }
          </div>
        }

        @if (state.role === 'source') {
          <div class="param-section">
            <h4>Source</h4>
            <label>Pressure
              <input type="number" [ngModel]="state.params.sourcePressure"
                (ngModelChange)="updateParam('sourcePressure', $event)" />
            </label>
            <label>Temperature
              <input type="number" [ngModel]="state.params.sourceTemperature"
                (ngModelChange)="updateParam('sourceTemperature', $event)" />
            </label>
            <label>Flow Rate
              <input type="number" [ngModel]="state.params.sourceFlowRate"
                (ngModelChange)="updateParam('sourceFlowRate', $event)" />
            </label>
          </div>
        }

        @if (state.role === 'valve') {
          <div class="param-section">
            <h4>Valve</h4>
            <div class="valve-buttons">
              <button [class.active]="state.params.valvePosition === 'open'"
                [class.green]="state.params.valvePosition === 'open'"
                (click)="updateParam('valvePosition', 'open')">Open</button>
              <button [class.active]="state.params.valvePosition === 'throttled'"
                [class.amber]="state.params.valvePosition === 'throttled'"
                (click)="updateParam('valvePosition', 'throttled')">Throttle</button>
              <button [class.active]="state.params.valvePosition === 'closed'"
                [class.red]="state.params.valvePosition === 'closed'"
                (click)="updateParam('valvePosition', 'closed')">Closed</button>
            </div>
            @if (state.params.valvePosition === 'throttled') {
              <label>Throttle %
                <input type="range" min="0" max="100" step="5"
                  [ngModel]="state.params.throttlePercent ?? 50"
                  (ngModelChange)="updateParam('throttlePercent', $event)" />
              </label>
            }
          </div>
        }

        @if (state.role === 'pump') {
          <div class="param-section">
            <h4>Pump</h4>
            <button class="pump-toggle"
              [class.running]="state.params.pumpRunning"
              (click)="updateParam('pumpRunning', !state.params.pumpRunning)">
              {{ state.params.pumpRunning ? 'Stop Pump' : 'Start Pump' }}
            </button>
            <label>Delta P
              <input type="number" [ngModel]="state.params.pumpDeltaP"
                (ngModelChange)="updateParam('pumpDeltaP', $event)" />
            </label>
            <label>Max Flow
              <input type="number" [ngModel]="state.params.maxFlow"
                (ngModelChange)="updateParam('maxFlow', $event)" />
            </label>
            <label>Min Inlet P
              <input type="number" [ngModel]="state.params.minInletPressure"
                (ngModelChange)="updateParam('minInletPressure', $event)" />
            </label>
          </div>
        }

        @if (state.role === 'vessel') {
          <div class="param-section">
            <h4>Vessel</h4>
            <label>Volume
              <input type="number" [ngModel]="state.params.volume"
                (ngModelChange)="updateParam('volume', $event)" />
            </label>
            <label>Current Level %
              <input type="number" [ngModel]="state.params.currentLevel" min="0" max="100"
                (ngModelChange)="updateParam('currentLevel', $event)" />
            </label>
            <label>Min Level %
              <input type="number" [ngModel]="state.params.minLevel" min="0" max="100"
                (ngModelChange)="updateParam('minLevel', $event)" />
            </label>
            <label>Head Pressure
              <input type="number" [ngModel]="state.params.sourcePressure"
                (ngModelChange)="updateParam('sourcePressure', $event)" />
            </label>
          </div>
        }

        @if (state.role === 'instrument') {
          <div class="param-section">
            <h4>Instrument</h4>
            <label>Property
              <select [ngModel]="state.params.measuredProperty"
                (ngModelChange)="updateParam('measuredProperty', $event)">
                <option value="pressure">pressure</option>
                <option value="temperature">temperature</option>
                <option value="flow">flow</option>
              </select>
            </label>
          </div>
        }

        @if (state.role === 'motor') {
          <div class="param-section">
            <h4>Motor</h4>
            <label>Running
              <input type="checkbox" [ngModel]="state.params.running"
                (ngModelChange)="updateParam('running', $event)" />
            </label>
            <label>Power
              <input type="number" [ngModel]="state.params.power"
                (ngModelChange)="updateParam('power', $event)" />
            </label>
          </div>
        }

        @if (state.role === 'pipe') {
          <div class="param-section">
            <h4>Pipe</h4>
            <label>Friction
              <input type="number" [ngModel]="state.params.frictionFactor" step="0.1"
                (ngModelChange)="updateParam('frictionFactor', $event)" />
            </label>
          </div>
        }

      } @else {
        <p class="info">Select a shape to inspect simulation state</p>
      }
    </div>
  `,
  styles: [`
    .sim-inspector {
      width: 240px;
      background: #1a1a1a;
      border-left: 1px solid #333;
      padding: 12px;
      overflow-y: auto;
    }
    h3 { margin: 0 0 12px; font-size: 14px; color: #f44336; }
    h4 { margin: 8px 0 6px; font-size: 12px; color: #aaa; text-transform: uppercase; }
    .role-section { margin-bottom: 12px; }
    label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #999;
      margin-bottom: 6px;
      gap: 8px;
    }
    select, input[type="number"] {
      width: 100px;
      padding: 4px 6px;
      background: #2a2a2a;
      border: 1px solid #444;
      color: #ddd;
      border-radius: 3px;
      font-size: 12px;
    }
    input[type="range"] { width: 100px; }
    input[type="checkbox"] { width: auto; }
    .readout {
      background: #111;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 8px;
      margin-bottom: 12px;
    }
    .readout-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .readout-label { color: #888; }
    .readout-value { color: #666; font-family: monospace; }
    .readout-value.flowing { color: #81d4fa; }
    .param-section { margin-bottom: 12px; }
    .valve-buttons {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
    }
    .valve-buttons button {
      flex: 1;
      padding: 6px 4px;
      border: 1px solid #444;
      border-radius: 3px;
      background: #2a2a2a;
      color: #ccc;
      cursor: pointer;
      font-size: 11px;
    }
    .valve-buttons button.active.green { background: #2e7d32; border-color: #4caf50; color: #fff; }
    .valve-buttons button.active.amber { background: #e65100; border-color: #ff9800; color: #fff; }
    .valve-buttons button.active.red { background: #c62828; border-color: #f44336; color: #fff; }
    .pump-toggle {
      width: 100%;
      padding: 8px;
      border: 1px solid #444;
      border-radius: 4px;
      background: #2a2a2a;
      color: #ccc;
      cursor: pointer;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .pump-toggle.running { background: #2e7d32; border-color: #4caf50; color: #fff; }
    .warning-box {
      margin-bottom: 12px;
      padding: 8px;
      border: 1px solid #5d1f1f;
      border-radius: 4px;
      background: rgba(244, 67, 54, 0.1);
    }
    .warning-item {
      color: #ff8a80;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .info { font-size: 12px; color: #666; }
  `],
})
export class SimulationInspectorComponent {
  private simState = inject(SimulationStateService);
  private shapeManager = inject(DiagramShapeManagerService);

  nodeState = signal<SimNodeState | null>(null);

  roles: SimRole[] = ['source', 'sink', 'valve', 'pump', 'vessel', 'instrument', 'motor', 'junction', 'pipe'];

  constructor() {
    effect((onCleanup) => {
      const shape = this.shapeManager.singleSelectedShape();
      if (!shape) {
        this.nodeState.set(null);
        return;
      }

      this.nodeState.set(this.simState.getNodeState(shape.id) ?? null);
      const obs = this.simState.getNodeState$(shape.id);
      const sub = obs?.subscribe(state => this.nodeState.set(state));
      onCleanup(() => sub?.unsubscribe());
    });
  }

  updateParam(key: string, value: any): void {
    const state = this.nodeState();
    if (!state) return;
    this.simState.updateNodeParams(state.shapeId, { [key]: value });
  }

  changeRole(role: SimRole): void {
    const state = this.nodeState();
    if (!state) return;
    this.simState.updateNodeRole(state.shapeId, role);
  }
}
