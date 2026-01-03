import { Component, Input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../../../../popup-projection/rf-popup-projection.component';
import { LotoPointSummaryDto } from '../../../../../models/loto/loto-point-summary.model';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';

export interface ConflictDialogData {
  equipment: EquipmentDto;
  conflicts: LotoPointSummaryDto[];
  currentLotoPointTagNumber?: string;
}

@Component({
  selector: 'app-equipment-conflict-dialog',
  standalone: true,
  imports: [CommonModule, RfPopupProjectionComponent],
  templateUrl: './equipment-conflict-dialog.component.html',
  styleUrl: './equipment-conflict-dialog.component.css'
})
export class EquipmentConflictDialogComponent {
  @Input() isOpen = false;
  @Input() data: ConflictDialogData | null = null;

  confirmed = output<EquipmentDto>();
  cancelled = output<void>();

  onConfirm() {
    if (this.data?.equipment) {
      this.confirmed.emit(this.data.equipment);
    }
  }

  onCancel() {
    this.cancelled.emit();
  }

  getConflictSummary(): string {
    if (!this.data?.conflicts.length) return '';
    const count = this.data.conflicts.length;
    return count === 1
      ? '1 existing LOTO point'
      : `${count} existing LOTO points`;
  }
}
