import { Component, input, output, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WizardStep, WizardContextFrame, StepDataPayload, WizardFlowType } from '../wizard-stack.types';
import { InteractiveImageComponent } from '../../../image/refactored/interactive-image/interactive-image.component';
import { RfToggleMenuComponent } from '../../../menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
import { EquipmentDialogFileService } from '../../../reactive-form/refactored/input-fields/services/equipment-dialog-file.service';
import { EquipmentMapperService } from '../../../../features/equipment/refactored/services/equipment-mapper.service';
import { RfEquipmentService } from '../../../../features/equipment/refactored/services/rf-equipment.service';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { RfShape } from '../../../image/refactored/models/fr-shape.model';
import { NestedItem } from '../../../../models/ui/nested-item.model';

@Component({
  selector: 'app-wizard-equipment-picker-step',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    InteractiveImageComponent,
    RfToggleMenuComponent,
  ],
  providers: [EquipmentDialogFileService],
  template: `
    <div class="equipment-picker-step">
      <!-- File Selection Panel -->
      <div class="file-panel">
        <h4 class="panel-title">
          <mat-icon>folder_open</mat-icon>
          Select P&ID File
        </h4>
        <app-rf-toggle-menu
          [menuItems]="fileMenuItems()"
          [enableSearch]="true"
          (itemClick)="onFileSelect($event)"
        />
      </div>

      <!-- Image Viewer Panel -->
      <div class="image-panel">
        @if (selectedFile()) {
          <div class="image-header">
            <span class="file-name">{{ selectedFile()?.name }}</span>
            <span class="instruction-hint">
              @if (allowDraw() && allowBrowse()) {
                Left-click to select existing equipment. Right-click + drag to draw new.
              } @else if (allowBrowse()) {
                Click on equipment to select it.
              } @else if (allowDraw()) {
                Right-click + drag to draw equipment.
              }
            </span>
          </div>

          <app-interactive-image
            [fileLink]="currentFileLink()"
            [shapes]="equipmentShapes()"
            [enableDrawing]="allowDraw()"
            [drawMode]="'rectangle'"
            (shapeClicked)="onEquipmentClicked($event)"
            (shapeDrawn)="onShapeDrawn($event)"
          />
        } @else {
          <div class="no-file-selected">
            <mat-icon>image</mat-icon>
            <p>Select a P&ID file from the left panel</p>
          </div>
        }
      </div>

      <!-- Selection Summary -->
      @if (selectedEquipment() || drawnShape()) {
        <mat-card class="selection-summary">
          <mat-card-content>
            @if (currentMode() === 'browse' && selectedEquipment()) {
              <div class="summary-content">
                <mat-icon class="summary-icon browse">touch_app</mat-icon>
                <div class="summary-info">
                  <span class="summary-label">Selected Equipment:</span>
                  <span class="summary-value">{{ getEquipmentDisplay(selectedEquipment()) }}</span>
                </div>
                <button mat-icon-button (click)="clearSelection()" matTooltip="Clear selection">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            } @else if (currentMode() === 'drawn' && drawnShape()) {
              <div class="summary-content">
                <mat-icon class="summary-icon drawn">draw</mat-icon>
                <div class="summary-info">
                  <span class="summary-label">New Equipment Shape Drawn</span>
                  <span class="summary-hint">Click Save to create equipment from this shape</span>
                </div>
                <button mat-stroked-button (click)="saveDrawnEquipment()" [disabled]="isSaving()">
                  @if (isSaving()) {
                    <mat-icon class="spinning">sync</mat-icon>
                    Saving...
                  } @else {
                    <mat-icon>save</mat-icon>
                    Save Equipment
                  }
                </button>
                <button mat-icon-button (click)="clearSelection()" matTooltip="Clear shape">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }

      @if (error()) {
        <div class="error-message">
          <mat-icon>error</mat-icon>
          {{ error() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .equipment-picker-step {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 16px;
      min-height: 400px;
    }

    .file-panel {
      background: #fafafa;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 12px 16px;
      background: #f0f0f0;
      font-size: 14px;
      font-weight: 500;
    }

    .panel-title mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    .image-panel {
      display: flex;
      flex-direction: column;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }

    .image-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .file-name {
      font-weight: 500;
      font-size: 14px;
    }

    .instruction-hint {
      font-size: 12px;
      color: #666;
    }

    .no-file-selected {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #999;
      padding: 40px;
    }

    .no-file-selected mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .selection-summary {
      grid-column: 1 / -1;
      margin-top: 8px;
    }

    .summary-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .summary-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .summary-icon.browse {
      color: #1976d2;
    }

    .summary-icon.drawn {
      color: #4caf50;
    }

    .summary-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .summary-label {
      font-size: 12px;
      color: #666;
    }

    .summary-value {
      font-weight: 600;
      font-size: 14px;
    }

    .summary-hint {
      font-size: 12px;
      color: #999;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .error-message {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #ffebee;
      border-radius: 6px;
      color: #c62828;
      font-size: 13px;
    }

    .error-message mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
})
export class WizardEquipmentPickerStepComponent {
  private fileService = inject(EquipmentDialogFileService);
  private equipmentMapper = inject(EquipmentMapperService);
  private equipmentService = inject(RfEquipmentService);
  private destroyRef = inject(DestroyRef);

  step = input.required<WizardStep>();
  frame = input.required<WizardContextFrame>();

  valueChange = output<StepDataPayload>();
  branchRequest = output<{ flowType: WizardFlowType; field: string; initialData?: any }>();

  // Delegated to file service
  selectedFile = this.fileService.selectedFile;
  fileMenuItems = this.fileService.menuItems;
  currentFileLink = this.fileService.currentFileLink;

  // State
  selectedEquipment = signal<EquipmentDto | null>(null);
  drawnShape = signal<RfShape | null>(null);
  highlightEquipmentId = signal<number | null>(null);
  currentMode = signal<'browse' | 'drawn'>('browse');
  isSaving = signal(false);
  error = signal<string | null>(null);

  allowBrowse = computed(() => {
    const config = this.step().equipmentPickerConfig;
    return config?.allowBrowse !== false;
  });

  allowDraw = computed(() => {
    const config = this.step().equipmentPickerConfig;
    return config?.allowDraw !== false;
  });

  // Equipment from selected file
  equipment = computed(() => {
    const file = this.selectedFile();
    if (!file) return [];
    return file.points ?? [];
  });

  // Equipment shapes for InteractiveImageComponent
  equipmentShapes = computed(() => {
    const eq = this.equipment();
    const drawn = this.drawnShape();

    // Map existing equipment to shapes
    const shapes = eq.map((e: EquipmentDto) =>
      this.equipmentMapper.mapToRfShape(e)
    ).filter(s => s !== null) as RfShape[];

    // Highlight selected equipment
    const highlightId = this.highlightEquipmentId();
    if (highlightId !== null) {
      shapes.forEach((shape: RfShape) => {
        if (shape.id === highlightId) {
          shape.isSelected = true;
          shape.color = '#FF0000';
        }
      });
    }

    // Add drawn shape if exists (with highlight)
    if (drawn) {
      const drawnWithHighlight = {
        ...drawn,
        isSelected: true,
        color: '#00FF00'
      };
      shapes.push(drawnWithHighlight);
    }

    return shapes;
  });

  onFileSelect(fileItem: NestedItem): void {
    this.fileService.selectFileFromNestedItem(fileItem);
    this.clearSelection();

    // Emit file selection
    const fieldName = this.step().equipmentPickerConfig?.fileFieldName || 'mainFileId';
    this.valueChange.emit({
      field: fieldName,
      value: fileItem.id,
      entityType: 'lotoPoint',
    });
  }

  onEquipmentClicked(shape: RfShape): void {
    if (!this.allowBrowse()) return;

    const selectedId = shape.id;
    if (selectedId !== null) {
      const eq = this.equipment();
      const selected = eq.find((e: EquipmentDto) => e.id === selectedId);
      if (selected) {
        this.drawnShape.set(null);
        this.selectedEquipment.set(selected);
        this.highlightEquipmentId.set(selectedId);
        this.currentMode.set('browse');
        this.emitEquipmentSelection(selected);
      }
    }
  }

  onShapeDrawn(shape: RfShape): void {
    if (!this.allowDraw()) return;

    this.selectedEquipment.set(null);
    this.highlightEquipmentId.set(null);
    this.drawnShape.set(shape);
    this.currentMode.set('drawn');
  }

  saveDrawnEquipment(): void {
    const shape = this.drawnShape();
    const file = this.selectedFile();
    if (!shape || !file) return;

    this.isSaving.set(true);
    this.error.set(null);

    // Add file context to shape before saving
    const shapeWithFileContext: RfShape = { ...shape, fileId: file.id };

    this.equipmentService
      .saveEquipmentFromShape(shapeWithFileContext)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (savedEquipment) => {
          this.isSaving.set(false);
          if (savedEquipment) {
            const enrichedEquipment = new EquipmentDto({
              ...savedEquipment,
              mainFileId: file.id,
              mainFileObject: file
            });
            this.selectedEquipment.set(enrichedEquipment);
            this.drawnShape.set(null);
            this.currentMode.set('browse');
            this.emitEquipmentSelection(enrichedEquipment);
          } else {
            this.error.set('Failed to save equipment.');
          }
        },
        error: (err) => {
          this.isSaving.set(false);
          console.error('Failed to save equipment:', err);
          this.error.set('Failed to save equipment. Please try again.');
        }
      });
  }

  clearSelection(): void {
    this.selectedEquipment.set(null);
    this.drawnShape.set(null);
    this.highlightEquipmentId.set(null);
    this.currentMode.set('browse');
    this.error.set(null);

    // Clear the equipment field
    const fieldName = this.step().equipmentPickerConfig?.fieldName || 'equipmentList';
    this.valueChange.emit({
      field: fieldName,
      value: null,
      entityType: 'lotoPoint',
    });
  }

  getEquipmentDisplay(equipment: EquipmentDto | null): string {
    if (!equipment) return '';
    if (equipment.tagNumber) return equipment.tagNumber;
    if ((equipment as any).lotoPoints?.[0]?.tagNumber) {
      return (equipment as any).lotoPoints[0].tagNumber;
    }
    return `Equipment #${equipment.id}`;
  }

  private emitEquipmentSelection(equipment: EquipmentDto): void {
    const fieldName = this.step().equipmentPickerConfig?.fieldName || 'equipmentList';
    const multiSelect = this.step().equipmentPickerConfig?.multiSelect;

    if (multiSelect) {
      // Append to array
      const current = this.frame().entityData.lotoPoint?.equipmentList || [];
      this.valueChange.emit({
        field: fieldName,
        value: [...current, equipment],
        entityType: 'lotoPoint',
      });
    } else {
      // Single selection - wrap in array
      this.valueChange.emit({
        field: fieldName,
        value: [equipment],
        entityType: 'lotoPoint',
      });
    }
  }
}
