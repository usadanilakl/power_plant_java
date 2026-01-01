import { Component } from '@angular/core';
import { RfLotoStandardTableComponent } from '../rf-loto-standard-table/rf-loto-standard-table.component';
import { RfLotoStandardClickService } from '../rf-loto-standard-table/rf-loto-standard-click.service';
import { LotoStandardTableControlService } from '../rf-loto-standard-table/rf-loto-standard-table-control.service';
import { RfLotoStandardTableDataService } from '../rf-loto-standard-table/rf-loto-standard-table-data.service';
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

@Component({
  selector: 'app-rf-loto-standard-main-table-view',
  standalone: true,
  imports: [RfLotoStandardTableComponent],
  providers: [
    TableSearchService,
    TableStateService,
    TableSelectionService,
    TableSortService,
    TableDragService,
    TableResizeService,
    TableSyncService,
    RfLotoStandardTableDataService,
    { provide: TableClickService, useClass: RfLotoStandardClickService },
    { provide: TableControlsService, useClass: LotoStandardTableControlService },
    { provide: TableDataService, useExisting: RfLotoStandardTableDataService },
  ],
  template: `
    <div class="loto-standard-main-view">
      <app-rf-loto-standard-table
        [tableId]="'main-loto-standard-table'"
        [isTableIsolated]="false"
        [loadMoreEnabled]="true"
      ></app-rf-loto-standard-table>
    </div>
  `,
  styles: [`
    .loto-standard-main-view {
      width: 100%;
      height: 100%;
      padding: 16px;
    }
  `]
})
export class RfLotoStandardMainTableViewComponent {}
