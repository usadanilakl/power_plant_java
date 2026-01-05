import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfFileTableComponent } from '../../../../../files/refactored/rf-file-table/rf-file-table.component';
import { TableClickService } from '../../../../../../shared/table/refactored/services/table-click.service';
import { LotoBuilderFileTableClickService } from './loto-builder-file-table-click.service';
import { TableSelectionService } from '../../../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../../../shared/table/refactored/services/table-drag.service';
import { TableControlsService } from '../../../../../../shared/table/refactored/services/table-controls.service';
import { TableStateService } from '../../../../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../../../../shared/table/refactored/services/table-data.service';
import { TableSearchService } from '../../../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../../../shared/table/refactored/services/table-sync.service';

/**
 * Wrapper component for file table in LOTO builder.
 * Uses custom click service to open files in the right panel.
 */
@Component({
  selector: 'app-loto-builder-file-table',
  standalone: true,
  imports: [CommonModule, RfFileTableComponent],
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
    { provide: TableClickService, useClass: LotoBuilderFileTableClickService }
  ],
  template: `
    <app-rf-file-table
      [tableId]="tableId()"
      [isTableIsolated]="isTableIsolated()"
      [loadMoreEnabled]="loadMoreEnabled()"
      [enableDragDrop]="enableDragDrop()"
    ></app-rf-file-table>
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

    :host app-rf-file-table {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
    }
  `],
})
export class LotoBuilderFileTableComponent {
  tableId = input<string>('loto-builder-file-table');
  isTableIsolated = input<boolean>(false);
  loadMoreEnabled = input<boolean>(true);
  enableDragDrop = input<boolean>(false);
}
