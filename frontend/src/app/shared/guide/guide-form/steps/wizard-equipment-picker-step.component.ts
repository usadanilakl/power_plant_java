import { Component, input, output, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { WizardStep, WizardContextFrame, StepDataPayload, WizardFlowType } from '../wizard-stack.types';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import {
  EquipmentConnectionDialogComponent
} from '../dialogs/equipment-connection-dialog/equipment-connection-dialog.component';
import {
  EquipmentConnectionDialogData,
  EquipmentConnectionDialogResult
} from '../dialogs/equipment-connection-dialog/equipment-connection-dialog.types';

@Component({
  selector: 'app-wizard-equipment-picker-step',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  template: `
    <div class="equipment-picker-step">
      <!-- Main Action Card -->
      <mat-card class="action-card">
        <mat-card-content>
          <div class="action-content">
            <div class="action-icon">
              <mat-icon>link</mat-icon>
            </div>
            <div class="action-info">
              <h3>Connect to P&ID Drawing</h3>
              <p>
                Link this LOTO point to equipment on a P&ID file. This helps visualize the
                isolation point location and makes it easier to find during field work.
              </p>
              <div class="action-hints">
                @if (allowBrowse() && allowDraw()) {
                  <span class="hint"><mat-icon>touch_app</mat-icon> Select existing equipment or draw new</span>
                } @else if (allowBrowse()) {
                  <span class="hint"><mat-icon>touch_app</mat-icon> Select from existing equipment</span>
                } @else if (allowDraw()) {
                  <span class="hint"><mat-icon>draw</mat-icon> Draw new equipment on P&ID</span>
                }
                @if (multiSelect()) {
                  <span class="hint"><mat-icon>select_all</mat-icon> Multiple equipment can be selected</span>
                }
              </div>
            </div>
            <button
              mat-raised-button
              color="primary"
              (click)="openConnectionDialog()"
              class="action-button"
            >
              <mat-icon>folder_open</mat-icon>
              Browse P&ID Files
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Selected Equipment Summary -->
      @if (selectedEquipmentList().length > 0) {
        <mat-card class="selection-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="selection-icon">check_circle</mat-icon>
            <mat-card-title>Connected Equipment</mat-card-title>
            <mat-card-subtitle>
              {{ selectedEquipmentList().length }} equipment
              {{ selectedEquipmentList().length === 1 ? 'shape' : 'shapes' }} linked
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              @for (eq of selectedEquipmentList(); track eq.id) {
                <mat-chip (removed)="removeEquipment(eq)">
                  <mat-icon matChipAvatar>location_on</mat-icon>
                  {{ getEquipmentLabel(eq) }}
                  @if (eq.mainFileObject?.name) {
                    <span class="file-name">({{ eq.mainFileObject.name }})</span>
                  }
                  <button matChipRemove matTooltip="Remove">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
              }
            </mat-chip-set>

            <div class="selection-actions">
              <button mat-stroked-button (click)="openConnectionDialog()">
                <mat-icon>add</mat-icon>
                Add More
              </button>
              <button mat-stroked-button color="warn" (click)="clearAllSelections()">
                <mat-icon>clear_all</mat-icon>
                Clear All
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Empty State Hint -->
      @if (selectedEquipmentList().length === 0) {
        <div class="empty-hint">
          <mat-icon>info</mat-icon>
          <span>
            This step is optional. You can skip it and connect to a P&ID later,
            or click "Browse P&ID Files" to make the connection now.
          </span>
        </div>
      }
    </div>
  `,
  styles: [`
    .equipment-picker-step {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .action-card {
      border: 2px dashed #e0e0e0;
      background: #fafafa;
    }

    .action-content {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 8px;
    }

    .action-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #e3f2fd;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .action-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .action-info {
      flex: 1;
    }

    .action-info h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }

    .action-info p {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }

    .action-hints {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .action-hints .hint {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #888;
    }

    .action-hints .hint mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .action-button {
      flex-shrink: 0;
      padding: 8px 24px;
    }

    .selection-card {
      border-left: 4px solid #4caf50;
    }

    .selection-icon {
      background: #e8f5e9 !important;
      color: #4caf50 !important;
    }

    .selection-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .file-name {
      font-size: 11px;
      color: #888;
      margin-left: 4px;
    }

    .empty-hint {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .empty-hint mat-icon {
      color: #9e9e9e;
      flex-shrink: 0;
    }

    .empty-hint span {
      font-size: 13px;
      color: #666;
      line-height: 1.5;
    }

    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `],
})
export class WizardEquipmentPickerStepComponent {
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  step = input.required<WizardStep>();
  frame = input.required<WizardContextFrame>();

  valueChange = output<StepDataPayload>();
  branchRequest = output<{ flowType: WizardFlowType; field: string; initialData?: any }>();

  // Computed config values
  allowBrowse = computed(() => {
    const config = this.step().equipmentPickerConfig;
    return config?.allowBrowse !== false;
  });

  allowDraw = computed(() => {
    const config = this.step().equipmentPickerConfig;
    return config?.allowDraw !== false;
  });

  multiSelect = computed(() => {
    const config = this.step().equipmentPickerConfig;
    return config?.multiSelect === true;
  });

  // Get currently selected equipment from frame data
  selectedEquipmentList = computed(() => {
    const fieldName = this.step().equipmentPickerConfig?.fieldName || 'equipmentList';
    const data = this.frame().entityData.lotoPoint;
    if (!data) return [];
    const equipment = (data as any)[fieldName];
    if (!equipment) return [];
    return Array.isArray(equipment) ? equipment : [equipment];
  });

  openConnectionDialog(): void {
    const config = this.step().equipmentPickerConfig;
    const currentSelection = this.selectedEquipmentList();

    const dialogData: EquipmentConnectionDialogData = {
      mode: config?.multiSelect ? 'multi' : 'single',
      allowBrowse: config?.allowBrowse !== false,
      allowDraw: config?.allowDraw !== false,
      allowUpload: true,
      preselectedEquipmentIds: currentSelection.map(e => e.id).filter((id): id is number => id !== undefined),
      preselectedFileId: (this.frame().entityData.lotoPoint as any)?.mainFileId,
    };

    const dialogRef = this.dialog.open(EquipmentConnectionDialogComponent, {
      data: dialogData,
      width: '95vw',
      maxWidth: '1400px',
      height: '85vh',
      panelClass: 'equipment-connection-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result: EquipmentConnectionDialogResult | undefined) => {
      if (result && !result.cancelled) {
        this.handleEquipmentSelection(result);
      }
    });
  }

  private handleEquipmentSelection(result: EquipmentConnectionDialogResult): void {
    const fieldName = this.step().equipmentPickerConfig?.fieldName || 'equipmentList';
    const fileFieldName = this.step().equipmentPickerConfig?.fileFieldName || 'mainFileId';

    if (this.multiSelect()) {
      // In multi-select mode, merge with existing selections
      const current = this.selectedEquipmentList();
      const currentIds = new Set(current.map(e => e.id));
      const newItems = result.selectedEquipment.filter(e => !currentIds.has(e.id));
      const merged = [...current, ...newItems];

      this.valueChange.emit({
        field: fieldName,
        value: merged,
        entityType: 'lotoPoint',
      });
    } else {
      // Single mode: replace selection
      this.valueChange.emit({
        field: fieldName,
        value: result.selectedEquipment,
        entityType: 'lotoPoint',
      });
    }

    // Also emit the file ID from the last selected equipment
    if (result.selectedFile?.id) {
      this.valueChange.emit({
        field: fileFieldName,
        value: result.selectedFile.id,
        entityType: 'lotoPoint',
      });
    } else if (result.selectedEquipment.length > 0) {
      const lastEquipment = result.selectedEquipment[result.selectedEquipment.length - 1];
      const fileId = lastEquipment.mainFileId || lastEquipment.mainFileObject?.id;
      if (fileId) {
        this.valueChange.emit({
          field: fileFieldName,
          value: fileId,
          entityType: 'lotoPoint',
        });
      }
    }
  }

  removeEquipment(equipment: EquipmentDto): void {
    const fieldName = this.step().equipmentPickerConfig?.fieldName || 'equipmentList';
    const current = this.selectedEquipmentList();
    const updated = current.filter(e => e.id !== equipment.id);

    this.valueChange.emit({
      field: fieldName,
      value: updated.length > 0 ? updated : null,
      entityType: 'lotoPoint',
    });
  }

  clearAllSelections(): void {
    const fieldName = this.step().equipmentPickerConfig?.fieldName || 'equipmentList';
    const fileFieldName = this.step().equipmentPickerConfig?.fileFieldName || 'mainFileId';

    this.valueChange.emit({
      field: fieldName,
      value: null,
      entityType: 'lotoPoint',
    });

    this.valueChange.emit({
      field: fileFieldName,
      value: null,
      entityType: 'lotoPoint',
    });
  }

  getEquipmentLabel(equipment: EquipmentDto): string {
    if (equipment.tagNumber) return equipment.tagNumber;
    if ((equipment as any).lotoPoints?.[0]?.tagNumber) {
      return (equipment as any).lotoPoints[0].tagNumber;
    }
    return `Equipment #${equipment.id}`;
  }
}
