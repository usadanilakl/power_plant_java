import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulkEditMenuComponent } from '../../../../shared/bulk-edit/bulk-edit-menu/bulk-edit-menu.component';
import { LotoPointBulkEditService } from '../services/loto-point-bulk-edit.service';
import { RfLotoPointTableDataService } from '../rf-loto-point-table/rf-loto-point-table-data.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';

/**
 * LOTO Point specific bulk edit form component
 * Connects the generic bulk edit menu to LOTO point table data
 */
@Component({
  selector: 'app-loto-point-bulk-edit-form',
  standalone: true,
  imports: [CommonModule, BulkEditMenuComponent],
  templateUrl: './loto-point-bulk-edit-form.component.html',
  styleUrl: './loto-point-bulk-edit-form.component.css'
})
export class LotoPointBulkEditFormComponent {
  // Services
  bulkEditService = inject(LotoPointBulkEditService);
  tableDataService = inject(RfLotoPointTableDataService);

  // Outputs
  bulkEditApplied = output<LotoPointDto[]>();

  // Delegate to services
  selectedItems = this.tableDataService.selectedItems;
  isBulkEditOpen = this.bulkEditService.isBulkEditOpen;

  /**
   * Clipboard configuration functions - same as loto point form
   */
  hasValidData = (entity: LotoPointDto): boolean => {
    return !!(entity.id || entity.tagNumber || entity.description);
  };

  getItemSummary = (item: LotoPointDto): string => {
    return `${item.tagNumber || 'N/A'} - ${item.description || 'No description'}`;
  };

  /**
   * Handle successful bulk edit application
   */
  onBulkEditApplied(updatedItems: LotoPointDto[]): void {
    // Emit updated items so parent can refresh data
    this.bulkEditApplied.emit(updatedItems);
  }

  /**
   * Handle menu close
   */
  onClose(): void {
    this.bulkEditService.closeBulkEdit();
  }
}
