import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfLotoStandardTableComponent } from '../rf-loto-standard-table/rf-loto-standard-table.component';
import { RfLotoStandardClickService } from '../rf-loto-standard-table/rf-loto-standard-click.service';
import { LotoStandardTableControlService } from '../rf-loto-standard-table/rf-loto-standard-table-control.service';
import { RfLotoStandardTableDataService } from '../rf-loto-standard-table/rf-loto-standard-table-data.service';
import { LotoStandardBulkEditService } from '../services/loto-standard-bulk-edit.service';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../../shared/table/refactored/services/table-controls.service';
import { TableDataService } from '../../../../shared/table/refactored/services/table-data.service';
import { TableSearchService } from '../../../../shared/table/refactored/services/table-search.service';
import { TableStateService } from '../../../../shared/table/refactored/services/table-state.service';
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';
import { TableSortService } from '../../../../shared/table/refactored/services/table-sort.service';
import { TableDragService } from '../../../../shared/table/refactored/services/table-drag.service';
import { TableResizeService } from '../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../shared/table/refactored/services/table-sync.service';

/**
 * Thin wrapper around RfLotoStandardTableComponent for use in left panel navigation.
 * Provides required table services at component level.
 */
@Component({
  selector: 'app-rf-loto-standard-nav-table',
  standalone: true,
  imports: [CommonModule, RfLotoStandardTableComponent],
  providers: [
    TableSearchService,
    TableStateService,
    TableSelectionService,
    TableSortService,
    TableDragService,
    TableResizeService,
    TableSyncService,
    RfLotoStandardTableDataService,
    LotoStandardBulkEditService,
    { provide: TableClickService, useClass: RfLotoStandardClickService },
    { provide: TableControlsService, useClass: LotoStandardTableControlService },
    { provide: TableDataService, useExisting: RfLotoStandardTableDataService },
  ],
  template: `
    <app-rf-loto-standard-table
      [tableId]="tableId()"
      [isTableIsolated]="isTableIsolated()"
      [loadMoreEnabled]="loadMoreEnabled()"
      [enableDragDrop]="enableDragDrop()"
    ></app-rf-loto-standard-table>
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

    :host app-rf-loto-standard-table {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
    }
  `],
})
export class RfLotoStandardNavTableComponent {
  tableId = input<string>('rf-loto-standard-nav-table');
  isTableIsolated = input<boolean>(false);
  loadMoreEnabled = input<boolean>(true);
  enableDragDrop = input<boolean>(false);
}
