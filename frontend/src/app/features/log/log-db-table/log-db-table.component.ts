import { Component } from '@angular/core';
import { LogTableComponent } from '../log-table/log-table.component';
import { TableSearchService } from '../../../shared/table/refactored/services/table-search.service';
import { TableStateService } from '../../../shared/table/refactored/services/table-state.service';
import { TableSelectionService } from '../../../shared/table/refactored/services/table-selection.service';
import { TableSortService } from '../../../shared/table/refactored/services/table-sort.service';
import { TableDragService } from '../../../shared/table/refactored/services/table-drag.service';
import { TableResizeService } from '../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../shared/table/refactored/services/table-sync.service';
import { TableDataService } from '../../../shared/table/refactored/services/table-data.service';
import { TableClickService } from '../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../shared/table/refactored/services/table-controls.service';

@Component({
  selector: 'app-log-db-table',
  standalone: true,
  imports: [LogTableComponent],
  providers: [
    TableSearchService,
    TableStateService,
    TableSelectionService,
    TableSortService,
    TableDragService,
    TableResizeService,
    TableSyncService,
    TableDataService,
    TableClickService,
    TableControlsService,
  ],
  template: `
    <div class="table-wrapper">
      <app-log-table [tableId]="'log-db-table'"></app-log-table>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow: hidden;
        width: 100%;
        height: 100%;
      }
      .table-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class LogDbTableComponent {}
