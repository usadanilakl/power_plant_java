import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiagramShapeManagerService } from '../../services/diagram-shape-manager.service';
import { DiagramStateService } from '../../services/diagram-state.service';
import { DiagramElement } from '../../models/diagram-shape.model';

@Component({
  selector: 'app-diagram-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="properties-panel">
      <h3>Properties</h3>

      @if (shapeManager.singleSelectedShape(); as shape) {
        <div class="property-section">
          <h4>Shape: {{ shape.type }}</h4>

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
          <label>Label
            <input type="text" [ngModel]="shape.label || ''"
              (ngModelChange)="updateShape(shape.id, { label: $event })" />
          </label>
        </div>
      } @else if (shapeManager.selectedShapes().length > 1) {
        <p class="info">{{ shapeManager.selectedShapes().length }} shapes selected</p>
      } @else {
        <!-- Diagram metadata -->
        @if (stateService.currentDiagram(); as diagram) {
          <div class="property-section">
            <h4>Diagram</h4>
            <label>Name
              <input type="text" [ngModel]="diagram.name"
                (ngModelChange)="stateService.updateDiagramMeta({ name: $event })" />
            </label>
            <label>Description
              <textarea [ngModel]="diagram.description"
                (ngModelChange)="stateService.updateDiagramMeta({ description: $event })">
              </textarea>
            </label>
          </div>
        }
        <p class="info">Select a shape to edit properties</p>
      }
    </div>
  `,
  styles: [`
    .properties-panel {
      width: 240px;
      background: #1a1a1a;
      border-left: 1px solid #333;
      padding: 12px;
      overflow-y: auto;
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
    input, textarea {
      width: 120px;
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
    textarea {
      width: 120px;
      height: 60px;
      resize: vertical;
    }
    .info { font-size: 12px; color: #666; }
  `],
})
export class DiagramPropertiesComponent {
  shapeManager = inject(DiagramShapeManagerService);
  stateService = inject(DiagramStateService);

  updateShape(id: number, updates: Partial<DiagramElement>): void {
    this.shapeManager.updateShape(id, updates);
    this.stateService.markDirty();
  }
}
