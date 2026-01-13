import { Component, inject, signal, computed, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { EquipmentUnifiedDialogComponent } from '../../../reactive-form/refactored/input-fields/equipment-unified-dialog/equipment-unified-dialog.component';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';

export interface GuideFileConnectionResult {
  equipment: EquipmentDto;
  fileId: number;
}

@Component({
  selector: 'app-guide-file-connection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    EquipmentUnifiedDialogComponent
  ],
  template: `
    <div class="guide-dialog-container">
      <!-- Header -->
      <div class="dialog-header">
        <h2>Connect LOTO Point to File</h2>
        <p class="header-description">
          Select an equipment location on a P&ID file to associate with this LOTO point.
        </p>
      </div>

      <!-- Tips Panel -->
      <div class="tips-panel">
        <div class="tips-header">
          <mat-icon>lightbulb</mat-icon>
          <span>How to connect:</span>
        </div>
        <div class="tips-content">
          <div class="tip-item">
            <span class="tip-number">1</span>
            <p><strong>Browse:</strong> Select a P&ID file from the left panel to view it.</p>
          </div>
          <div class="tip-item">
            <span class="tip-number">2</span>
            <p><strong>Select or Draw:</strong>
              <br>- <strong>Left-click</strong> on an existing equipment shape to select it
              <br>- <strong>Right-click and drag</strong> to draw a new rectangle shape
              <br>- Use the <strong>Symbol</strong> toolbar button to place P&ID symbols
            </p>
          </div>
          <div class="tip-item">
            <span class="tip-number">3</span>
            <p><strong>Confirm:</strong> Click "Select Equipment" to associate the equipment with this LOTO point.</p>
          </div>
        </div>
      </div>

      <!-- Equipment Selection -->
      <div class="dialog-content">
        @if (selectedEquipment()) {
          <div class="selection-preview">
            <mat-icon>check_circle</mat-icon>
            <span>Selected: <strong>{{ getEquipmentLabel(selectedEquipment()) }}</strong></span>
            <button mat-icon-button (click)="clearSelection()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        }

        <div class="unified-dialog-wrapper">
          <app-equipment-unified-dialog
            [hideActions]="true"
            (equipmentAcquired)="onEquipmentSelected($event)"
            (equipmentDrawnForLotoPoint)="onEquipmentDrawn($event)"
          />
        </div>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button
          mat-raised-button
          color="primary"
          [disabled]="!selectedEquipment()"
          (click)="onConfirm()">
          <mat-icon>link</mat-icon>
          Connect Equipment
        </button>
      </div>
    </div>
  `,
  styles: [`
    .guide-dialog-container {
      display: flex;
      flex-direction: column;
      height: 85vh;
      max-height: 85vh;
      width: 90vw;
      max-width: 1200px;
    }

    .dialog-header {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
      flex-shrink: 0;
    }

    .dialog-header h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 500;
      color: var(--text-primary, #333);
    }

    .header-description {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary, #666);
    }

    .tips-panel {
      padding: 12px 24px;
      background: var(--info-bg, #e3f2fd);
      border-bottom: 1px solid var(--border-color, #e0e0e0);
      flex-shrink: 0;
    }

    .tips-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-weight: 500;
      color: var(--primary-color, #1976d2);
    }

    .tips-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .tips-content {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .tip-item {
      display: flex;
      gap: 12px;
      flex: 1;
      min-width: 200px;
    }

    .tip-number {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--primary-color, #1976d2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .tip-item p {
      margin: 0;
      font-size: 13px;
      color: var(--text-primary, #333);
      line-height: 1.5;
    }

    .dialog-content {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 16px 24px;
      gap: 12px;
    }

    .selection-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--success-bg, #e8f5e9);
      border-radius: 8px;
      border: 1px solid var(--success-color, #4caf50);
      flex-shrink: 0;
    }

    .selection-preview mat-icon {
      color: var(--success-color, #4caf50);
    }

    .selection-preview span {
      flex: 1;
      font-size: 14px;
      color: var(--text-primary, #333);
    }

    .unified-dialog-wrapper {
      flex: 1;
      min-height: 0;
      border: 1px solid var(--border-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .unified-dialog-wrapper ::ng-deep .dialog-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .unified-dialog-wrapper ::ng-deep .dialog-content {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .unified-dialog-wrapper ::ng-deep .navigation-panel {
      overflow-y: auto;
    }

    .unified-dialog-wrapper ::ng-deep .viewer-panel {
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .unified-dialog-wrapper ::ng-deep .viewer-content {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
      border-top: 1px solid var(--border-color, #e0e0e0);
      flex-shrink: 0;
    }

    .dialog-footer button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }
  `]
})
export class GuideFileConnectionDialogComponent {
  // Dialog reference for closing
  private dialogRef = inject(MatDialogRef<GuideFileConnectionDialogComponent>, { optional: true });

  // Input: initial equipment if editing
  initialEquipment = input<EquipmentDto | null>(null);

  // Outputs
  confirmed = output<GuideFileConnectionResult>();
  cancelled = output<void>();

  // State
  selectedEquipment = signal<EquipmentDto | null>(null);

  constructor() {
    // Initialize from input if provided
    const initial = this.initialEquipment();
    if (initial) {
      this.selectedEquipment.set(initial);
    }
  }

  onEquipmentSelected(equipment: EquipmentDto): void {
    this.selectedEquipment.set(equipment);
  }

  onEquipmentDrawn(equipment: EquipmentDto): void {
    // For drawn equipment, we still set it as selected
    // The unified dialog already saved it
    this.selectedEquipment.set(equipment);
  }

  clearSelection(): void {
    this.selectedEquipment.set(null);
  }

  getEquipmentLabel(equipment: EquipmentDto | null): string {
    if (!equipment) return 'None';

    if (equipment.tagNumber) {
      return equipment.tagNumber;
    }
    if ((equipment as any).lotoPoints?.length > 0) {
      return (equipment as any).lotoPoints[0].tagNumber || `Equipment #${equipment.id}`;
    }
    return `Equipment #${equipment.id}`;
  }

  onCancel(): void {
    this.cancelled.emit();
    this.dialogRef?.close();
  }

  onConfirm(): void {
    const equipment = this.selectedEquipment();
    if (!equipment) return;

    const result: GuideFileConnectionResult = {
      equipment,
      fileId: equipment.mainFileId || equipment.mainFileObject?.id || 0
    };

    this.confirmed.emit(result);
    this.dialogRef?.close(result);
  }
}
