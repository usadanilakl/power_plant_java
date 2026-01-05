import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfLotoPointTableComponent } from '../../../../../loto-points/refactored/rf-loto-point-table/rf-loto-point-table.component';
import { TableClickService } from '../../../../../../shared/table/refactored/services/table-click.service';
import { LotoBuilderLotoPointTableClickService } from './loto-builder-loto-point-table-click.service';
import { TableSelectionService } from '../../../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../../../shared/table/refactored/services/table-drag.service';
import { TableControlsService } from '../../../../../../shared/table/refactored/services/table-controls.service';
import { TableStateService } from '../../../../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../../../../shared/table/refactored/services/table-data.service';
import { TableSearchService } from '../../../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../../../shared/table/refactored/services/table-sync.service';
import { LotoPointBulkEditService } from '../../../../../loto-points/refactored/services/loto-point-bulk-edit.service';
import { RfLotoPointTableDataService } from '../../../../../loto-points/refactored/rf-loto-point-table/rf-loto-point-table-data.service';

/**
 * Wrapper component for LOTO point table in LOTO builder.
 * Uses custom click service to open the file containing the equipment
 * and highlight the selected LOTO point.
 */
@Component({
  selector: 'app-loto-builder-loto-point-table',
  standalone: true,
  imports: [CommonModule, RfLotoPointTableComponent],
  providers: [
    TableSelectionService,
    TableDragService,
    TableControlsService,
    TableStateService,
    TableDataService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    LotoPointBulkEditService,
    RfLotoPointTableDataService,
    { provide: TableClickService, useClass: LotoBuilderLotoPointTableClickService },
  ],
  template: `
    <app-rf-loto-point-table
      [tableId]="tableId()"
      [isTableIsolated]="isTableIsolated()"
      [loadMoreEnabled]="loadMoreEnabled()"
      [enableDragDrop]="enableDragDrop()"
    ></app-rf-loto-point-table>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
    }

    :host app-rf-loto-point-table {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
    }
  `],
})
export class LotoBuilderLotoPointTableComponent {
  tableId = input<string>('loto-builder-loto-point-table');
  isTableIsolated = input<boolean>(false);
  loadMoreEnabled = input<boolean>(true);
  enableDragDrop = input<boolean>(false);
}
