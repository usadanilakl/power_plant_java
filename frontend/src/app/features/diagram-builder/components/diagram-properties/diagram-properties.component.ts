import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiagramShapeManagerService } from '../../services/diagram-shape-manager.service';
import { DiagramStateService } from '../../services/diagram-state.service';
import { DiagramConnection, DiagramPlacement } from '../../models/diagram-placement.model';
import {
  SimEquipmentDto,
  SimParams,
  SimRole,
  defaultSimParams,
  normalizeSimRole,
  parseSimParams,
  serializeSimParams,
} from '../../models/sim-equipment.model';
import { SimEquipmentApiService } from '../../services/sim-equipment-api.service';

@Component({
  selector: 'app-diagram-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="properties-panel">
      <h3>Properties</h3>

      @if (shapeManager.singleSelectedShape(); as shape) {
        <div class="property-section">
          <h4>Equipment</h4>

          <label>Name
            <input type="text" [ngModel]="shape.name || ''"
              (ngModelChange)="updateShape(shape.id, { name: $event, label: $event || undefined })" />
          </label>
          <label>Description
            <textarea [ngModel]="shape.description || ''"
              (ngModelChange)="updateShape(shape.id, { description: $event || undefined })"></textarea>
          </label>
          <label>Role
            <select [ngModel]="shapeRole(shape)"
              (ngModelChange)="updateShapeRole(shape, $event)">
              @for (role of roles; track role) {
                <option [value]="role">{{ role }}</option>
              }
            </select>
          </label>
        </div>

        <div class="property-section">
          <h4>Behavior</h4>

          @if (shapeRole(shape) === 'source') {
            <label>Pressure
              <input type="number" [ngModel]="shapeParams(shape).sourcePressure ?? 100"
                (ngModelChange)="updateShapeParam(shape, 'sourcePressure', $event)" />
            </label>
            <label>Temperature
              <input type="number" [ngModel]="shapeParams(shape).sourceTemperature ?? 500"
                (ngModelChange)="updateShapeParam(shape, 'sourceTemperature', $event)" />
            </label>
            <label>Flow Rate
              <input type="number" [ngModel]="shapeParams(shape).sourceFlowRate ?? 10000"
                (ngModelChange)="updateShapeParam(shape, 'sourceFlowRate', $event)" />
            </label>
          }

          @if (shapeRole(shape) === 'valve') {
            <label>Position
              <select [ngModel]="shapeParams(shape).valvePosition ?? 'open'"
                (ngModelChange)="updateShapeParam(shape, 'valvePosition', $event)">
                <option value="open">open</option>
                <option value="throttled">throttled</option>
                <option value="closed">closed</option>
              </select>
            </label>
            <label>Throttle %
              <input type="number" [ngModel]="shapeParams(shape).throttlePercent ?? 50" [min]="0" [max]="100"
                (ngModelChange)="updateShapeParam(shape, 'throttlePercent', $event)" />
            </label>
            <label>Cv
              <input type="number" [ngModel]="shapeParams(shape).cvCoefficient ?? ''"
                (ngModelChange)="updateShapeParam(shape, 'cvCoefficient', toNumberOrUndefined($event))" />
            </label>
          }

          @if (shapeRole(shape) === 'pump') {
            <label>Running
              <input type="checkbox" [ngModel]="shapeParams(shape).pumpRunning ?? true"
                (ngModelChange)="updateShapeParam(shape, 'pumpRunning', $event)" />
            </label>
            <label>Delta P
              <input type="number" [ngModel]="shapeParams(shape).pumpDeltaP ?? 50"
                (ngModelChange)="updateShapeParam(shape, 'pumpDeltaP', $event)" />
            </label>
            <label>Max Flow
              <input type="number" [ngModel]="shapeParams(shape).maxFlow ?? 10000"
                (ngModelChange)="updateShapeParam(shape, 'maxFlow', $event)" />
            </label>
            <label>Min Inlet P
              <input type="number" [ngModel]="shapeParams(shape).minInletPressure ?? 10"
                (ngModelChange)="updateShapeParam(shape, 'minInletPressure', $event)" />
            </label>
            <label>Efficiency
              <input type="number" [ngModel]="shapeParams(shape).pumpEfficiency ?? ''"
                (ngModelChange)="updateShapeParam(shape, 'pumpEfficiency', toNumberOrUndefined($event))" />
            </label>
          }

          @if (shapeRole(shape) === 'vessel') {
            <label>Volume
              <input type="number" [ngModel]="shapeParams(shape).volume ?? 1000"
                (ngModelChange)="updateShapeParam(shape, 'volume', $event)" />
            </label>
            <label>Current Level %
              <input type="number" [ngModel]="shapeParams(shape).currentLevel ?? 50" [min]="0" [max]="100"
                (ngModelChange)="updateShapeParam(shape, 'currentLevel', $event)" />
            </label>
            <label>Min Level %
              <input type="number" [ngModel]="shapeParams(shape).minLevel ?? 0" [min]="0" [max]="100"
                (ngModelChange)="updateShapeParam(shape, 'minLevel', $event)" />
            </label>
            <label>Max Pressure
              <input type="number" [ngModel]="shapeParams(shape).maxPressure ?? 3000"
                (ngModelChange)="updateShapeParam(shape, 'maxPressure', $event)" />
            </label>
            <label>Head Pressure
              <input type="number" [ngModel]="shapeParams(shape).sourcePressure ?? 15"
                (ngModelChange)="updateShapeParam(shape, 'sourcePressure', $event)" />
            </label>
          }

          @if (shapeRole(shape) === 'instrument') {
            <label>Measured Property
              <select [ngModel]="shapeParams(shape).measuredProperty ?? 'pressure'"
                (ngModelChange)="updateShapeParam(shape, 'measuredProperty', $event)">
                <option value="pressure">pressure</option>
                <option value="temperature">temperature</option>
                <option value="flow">flow</option>
              </select>
            </label>
          }

          @if (shapeRole(shape) === 'motor') {
            <label>Running
              <input type="checkbox" [ngModel]="shapeParams(shape).running ?? true"
                (ngModelChange)="updateShapeParam(shape, 'running', $event)" />
            </label>
            <label>Power
              <input type="number" [ngModel]="shapeParams(shape).power ?? 500"
                (ngModelChange)="updateShapeParam(shape, 'power', $event)" />
            </label>
          }

          @if (shapeRole(shape) === 'pipe') {
            <label>Diameter
              <input type="number" [ngModel]="shapeParams(shape).diameter ?? 12"
                (ngModelChange)="updateShapeParam(shape, 'diameter', $event)" />
            </label>
            <label>Length
              <input type="number" [ngModel]="shapeParams(shape).length ?? 50"
                (ngModelChange)="updateShapeParam(shape, 'length', $event)" />
            </label>
            <label>Friction
              <input type="number" step="0.01" [ngModel]="shapeParams(shape).frictionFactor ?? 0.02"
                (ngModelChange)="updateShapeParam(shape, 'frictionFactor', $event)" />
            </label>
            <label>Insulation
              <input type="number" step="0.01" [ngModel]="shapeParams(shape).insulationFactor ?? 0"
                (ngModelChange)="updateShapeParam(shape, 'insulationFactor', $event)" />
            </label>
          }

          @if (shapeRole(shape) === 'sink' || shapeRole(shape) === 'junction') {
            <p class="inline-info">This role has no required custom parameters yet.</p>
          }
        </div>

        <div class="property-section">
          <h4>Placement</h4>

          <label>X
            <input type="number" [ngModel]="shape.x"
              (ngModelChange)="updateShape(shape.id, { x: $event })" />
          </label>
          <label>Y
            <input type="number" [ngModel]="shape.y"
              (ngModelChange)="updateShape(shape.id, { y: $event })" />
          </label>
          <label>Width
            <input type="number" [ngModel]="shape.width" [min]="10"
              (ngModelChange)="updateShape(shape.id, { width: $event })" />
          </label>
          <label>Height
            <input type="number" [ngModel]="shape.height" [min]="10"
              (ngModelChange)="updateShape(shape.id, { height: $event })" />
          </label>
          <label>Rotation
            <input type="number" [ngModel]="shape.rotation || 0" [min]="0" [max]="360"
              (ngModelChange)="updateShape(shape.id, { rotation: $event })" />
          </label>
          <label>Color
            <input type="color" [ngModel]="shape.color || '#ffffff'"
              (ngModelChange)="updateShape(shape.id, { color: $event })" />
          </label>
          <label>Fill
            <input type="color" [ngModel]="shape.fillColor || '#000000'"
              (ngModelChange)="updateShape(shape.id, { fillColor: $event })" />
          </label>
          <label>Line Width
            <input type="number" [ngModel]="shape.lineWidth || 2" [min]="1" [max]="20"
              (ngModelChange)="updateShape(shape.id, { lineWidth: $event })" />
          </label>
        </div>

        <div class="property-section">
          <h4>Metadata</h4>
          <div class="linked-field">
            <span class="linked-label">Template</span>
            <span class="linked-value">{{ templateName(shape) }}</span>
          </div>
          <div class="linked-field">
            <span class="linked-label">Source</span>
            <span class="linked-value">
              {{ shape.sourceEntityType || 'Custom' }}
              @if (shape.sourceEntityId) {
                :{{ shape.sourceEntityId }}
              }
            </span>
          </div>
          <div class="template-actions">
            @if (shape.simEquipmentId) {
              <button class="btn-action" [disabled]="saveLibraryBusy()"
                (click)="saveReusableDefinition(shape)">
                Update Reusable Definition
              </button>
            } @else {
              <button class="btn-action" [disabled]="saveLibraryBusy()"
                (click)="saveReusableDefinition(shape)">
                Save As Reusable Equipment
              </button>
            }
            <button class="btn-action secondary" [disabled]="saveLibraryBusy()"
              (click)="saveReusableDefinition(shape, true)">
              Save As New Copy
            </button>
          </div>
          @if (saveLibraryMessage()) {
            <p class="inline-info">{{ saveLibraryMessage() }}</p>
          }
        </div>

      } @else if (shapeManager.singleSelectedConnection()) {
        <div class="property-section">
          <h4>Connection Pipe</h4>

          <label>Pipe Template
            <select [ngModel]="shapeManager.singleSelectedConnection()!.pipeTemplateId ?? ''"
              (ngModelChange)="applyPipeTemplate(shapeManager.singleSelectedConnection()!.id, toNumberOrUndefined($event))">
              <option value="">None</option>
              @for (pipe of pipeTemplates(); track pipe.id) {
                <option [value]="pipe.id">{{ pipe.name || ('Pipe #' + pipe.id) }}</option>
              }
            </select>
          </label>
          <label>Pipe Name
            <input type="text" [ngModel]="shapeManager.singleSelectedConnection()!.pipeName || ''"
              (ngModelChange)="updateConnection(shapeManager.singleSelectedConnection()!.id, { pipeName: $event || undefined })" />
          </label>
          <label>Length
            <input type="number"
              [ngModel]="connectionParams(shapeManager.singleSelectedConnection()!).length ?? ''"
              (ngModelChange)="updateConnectionParam(shapeManager.singleSelectedConnection()!, 'length', $event)" />
          </label>
          <label>Diameter
            <input type="number"
              [ngModel]="connectionParams(shapeManager.singleSelectedConnection()!).diameter ?? ''"
              (ngModelChange)="updateConnectionParam(shapeManager.singleSelectedConnection()!, 'diameter', $event)" />
          </label>
          <label>Friction
            <input type="number" step="0.01"
              [ngModel]="connectionParams(shapeManager.singleSelectedConnection()!).frictionFactor ?? ''"
              (ngModelChange)="updateConnectionParam(shapeManager.singleSelectedConnection()!, 'frictionFactor', $event)" />
          </label>
          <label>Insulation
            <input type="number" step="0.01"
              [ngModel]="connectionParams(shapeManager.singleSelectedConnection()!).insulationFactor ?? ''"
              (ngModelChange)="updateConnectionParam(shapeManager.singleSelectedConnection()!, 'insulationFactor', $event)" />
          </label>
          <label>Color
            <input type="color" [ngModel]="shapeManager.singleSelectedConnection()!.color || '#888888'"
              (ngModelChange)="updateConnection(shapeManager.singleSelectedConnection()!.id, { color: $event })" />
          </label>
          <label>Line Width
            <input type="number" [ngModel]="shapeManager.singleSelectedConnection()!.lineWidth || 2" [min]="1" [max]="20"
              (ngModelChange)="updateConnection(shapeManager.singleSelectedConnection()!.id, { lineWidth: $event })" />
          </label>
        </div>
      } @else if (shapeManager.selectedShapes().length > 1) {
        <p class="info">{{ shapeManager.selectedShapes().length }} shapes selected</p>
      } @else {
        @if (stateService.currentDiagram(); as diagram) {
          <div class="property-section">
            <h4>Diagram</h4>
            <label>Name
              <input type="text" [ngModel]="diagram.name"
                (ngModelChange)="stateService.updateDiagramMeta({ name: $event })" />
            </label>
            <label>Description
              <textarea [ngModel]="diagram.description"
                (ngModelChange)="stateService.updateDiagramMeta({ description: $event })"></textarea>
            </label>
          </div>
        }
        <p class="info">Select equipment or a connection to edit properties</p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }
    .properties-panel {
      width: 260px;
      height: 100%;
      background: #1a1a1a;
      border-left: 1px solid #333;
      padding: 12px;
      overflow-y: auto;
      box-sizing: border-box;
    }
    h3 { margin: 0 0 12px; font-size: 14px; color: #aaa; }
    h4 { margin: 0 0 8px; font-size: 13px; color: #ddd; text-transform: capitalize; }
    .property-section { margin-bottom: 16px; }
    label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #999;
      margin-bottom: 6px;
      gap: 8px;
    }
    input, textarea, select {
      width: 128px;
      padding: 4px 6px;
      background: #2a2a2a;
      border: 1px solid #444;
      color: #ddd;
      border-radius: 3px;
      font-size: 12px;
    }
    input[type="color"] {
      width: 40px;
      height: 24px;
      padding: 0;
      cursor: pointer;
    }
    input[type="checkbox"] {
      width: auto;
    }
    textarea {
      height: 60px;
      resize: vertical;
    }
    .linked-field {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
      margin-bottom: 6px;
    }
    .linked-label { color: #888; }
    .linked-value {
      color: #ddd;
      text-align: right;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .info { font-size: 12px; color: #666; }
    .inline-info {
      margin: 6px 0 0;
      color: #777;
      font-size: 11px;
      line-height: 1.4;
    }
    .template-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
    }
    .btn-action {
      padding: 6px 8px;
      background: #2e7d32;
      border: 1px solid #4caf50;
      color: #fff;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    }
    .btn-action.secondary {
      background: #2a2a2a;
      border-color: #555;
      color: #ccc;
    }
    .btn-action:disabled {
      opacity: 0.6;
      cursor: default;
    }
  `],
})
export class DiagramPropertiesComponent {
  shapeManager = inject(DiagramShapeManagerService);
  stateService = inject(DiagramStateService);
  private simEquipmentApi = inject(SimEquipmentApiService);

  roles: SimRole[] = ['source', 'sink', 'valve', 'pump', 'vessel', 'instrument', 'motor', 'junction', 'pipe'];
  pipeTemplates = signal<SimEquipmentDto[]>([]);
  saveLibraryMessage = signal<string | null>(null);
  saveLibraryBusy = signal(false);

  constructor() {
    effect(() => {
      this.simEquipmentApi.equipmentMap();
      this.pipeTemplates.set(
        this.simEquipmentApi.equipmentList()
          .filter(eq => normalizeSimRole(eq.simRole) === 'pipe')
      );
    });
  }

  shapeRole(shape: DiagramPlacement): SimRole {
    return normalizeSimRole(shape.simRole);
  }

  shapeParams(shape: DiagramPlacement): SimParams {
    return {
      ...defaultSimParams(this.shapeRole(shape)),
      ...parseSimParams(shape.simParamsJson),
    };
  }

  connectionParams(connection: DiagramConnection): SimParams {
    return parseSimParams(connection.pipeParamsJson);
  }

  templateName(shape: DiagramPlacement): string {
    if (!shape.simEquipmentId) return 'Custom';
    return this.simEquipmentApi.getCachedById(shape.simEquipmentId)?.name || `Template #${shape.simEquipmentId}`;
  }

  updateShape(id: number, updates: Partial<DiagramPlacement>): void {
    this.shapeManager.updateShape(id, updates);
    this.stateService.markDirty();
  }

  updateShapeRole(shape: DiagramPlacement, role: SimRole): void {
    const nextParams = {
      ...defaultSimParams(role),
      ...parseSimParams(shape.simParamsJson),
      schemaVersion: 1 as const,
    };
    this.updateShape(shape.id, {
      simRole: role,
      simParamsJson: serializeSimParams(nextParams),
    });
  }

  updateShapeParam(shape: DiagramPlacement, key: keyof SimParams, value: any): void {
    const nextParams = {
      ...this.shapeParams(shape),
      [key]: value,
    };
    this.updateShape(shape.id, {
      simParamsJson: serializeSimParams(nextParams),
    });
  }

  updateConnection(id: number, updates: Partial<DiagramConnection>): void {
    this.shapeManager.updateConnection(id, updates);
    this.stateService.markDirty();
  }

  applyPipeTemplate(connectionId: number, templateId: number | undefined): void {
    const template = templateId != null ? this.simEquipmentApi.getCachedById(templateId) : null;
    this.updateConnection(connectionId, {
      pipeTemplateId: templateId,
      pipeName: template?.name || undefined,
      pipeParamsJson: template?.simParamsJson || serializeSimParams({ schemaVersion: 1 }),
    });
  }

  updateConnectionParam(connection: DiagramConnection, key: keyof SimParams, rawValue: string | number): void {
    const nextParams = {
      ...this.connectionParams(connection),
      [key]: this.toNumberOrUndefined(rawValue) ?? undefined,
    };
    this.updateConnection(connection.id, {
      pipeParamsJson: serializeSimParams(nextParams),
    });
  }

  toNumberOrUndefined(value: string | number | null | undefined): number | undefined {
    if (value == null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  saveReusableDefinition(shape: DiagramPlacement, forceNew = false): void {
    this.saveLibraryBusy.set(true);
    this.saveLibraryMessage.set(null);

    const dto = this.shapeToReusableDefinition(shape, forceNew ? undefined : shape.simEquipmentId);
    const request = dto.id != null
      ? this.simEquipmentApi.update(dto.id, dto)
      : this.simEquipmentApi.create(dto);

    request.subscribe({
      next: (res) => {
        const saved = res.responseData;
        if (!saved?.id) {
          this.saveLibraryBusy.set(false);
          this.saveLibraryMessage.set('Failed to save reusable equipment.');
          return;
        }

        this.simEquipmentApi.upsertCached(saved);
        this.updateShape(shape.id, { simEquipmentId: saved.id });
        this.saveLibraryBusy.set(false);
        this.saveLibraryMessage.set(
          dto.id != null
            ? 'Reusable equipment definition updated.'
            : 'Saved to equipment library for reuse across diagrams.'
        );
      },
      error: () => {
        this.saveLibraryBusy.set(false);
        this.saveLibraryMessage.set('Failed to save reusable equipment.');
      },
    });
  }

  private shapeToReusableDefinition(shape: DiagramPlacement, existingId?: number): SimEquipmentDto {
    const existing = existingId != null ? this.simEquipmentApi.getCachedById(existingId) : null;
    return {
      id: existing?.id,
      name: shape.name || shape.label || 'Reusable Equipment',
      description: shape.description || existing?.description || undefined,
      symbolId: shape.symbolId || existing?.symbolId || undefined,
      svgPath: shape.svgPath || existing?.svgPath || undefined,
      defaultWidth: Math.round(shape.width),
      defaultHeight: Math.round(shape.height),
      defaultColor: shape.color || existing?.defaultColor || undefined,
      simRole: shape.simRole || existing?.simRole || 'junction',
      simParamsJson: shape.simParamsJson || existing?.simParamsJson || '{"schemaVersion":1}',
      sourceEntityType: existing?.sourceEntityType,
      sourceEntityId: existing?.sourceEntityId,
    };
  }
}
