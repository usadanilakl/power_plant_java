import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulkEditMenuComponent } from '../../../../shared/bulk-edit/bulk-edit-menu/bulk-edit-menu.component';
import { LotoStandardBulkEditService } from '../services/loto-standard-bulk-edit.service';
import { RfLotoStandardTableDataService } from '../rf-loto-standard-table/rf-loto-standard-table-data.service';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';

/**
 * LOTO Standard specific bulk edit form component
 * Connects the generic bulk edit menu to LOTO standard table data
 */
@Component({
  selector: 'app-loto-standard-bulk-edit-form',
  standalone: true,
  imports: [CommonModule, BulkEditMenuComponent],
  templateUrl: './loto-standard-bulk-edit-form.component.html',
  styleUrl: './loto-standard-bulk-edit-form.component.css'
})
export class LotoStandardBulkEditFormComponent {
  // Services
  bulkEditService = inject(LotoStandardBulkEditService);
  tableDataService = inject(RfLotoStandardTableDataService);

  // Outputs
  bulkEditApplied = output<LotoStandardDto[]>();

  // Delegate to services
  selectedItems = this.tableDataService.selectedItems;
  isBulkEditOpen = this.bulkEditService.isBulkEditOpen;

  /**
   * Clipboard configuration functions
   */
  hasValidData = (entity: LotoStandardDto): boolean => {
    return !!(entity.id || entity.name || entity.description);
  };

  getItemSummary = (item: LotoStandardDto): string => {
    return `${item.name || 'N/A'} - ${item.description || 'No description'}`;
  };

  /**
   * Handle successful bulk edit application
   */
  onBulkEditApplied(updatedItems: LotoStandardDto[]): void {
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
