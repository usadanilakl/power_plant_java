import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Column } from '../../../../models/column.model';
import { WorkAreaDto } from '../../../../models/permits/work-area.model';
import { TableComponent } from '../../../../shared/table/refactored/table.component';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../../shared/table/refactored/services/table-controls.service';
import { TableDataService } from '../../../../shared/table/refactored/services/table-data.service';
import { TableDragService } from '../../../../shared/table/refactored/services/table-drag.service';
import { TableResizeService } from '../../../../shared/table/refactored/services/table-resize.service';
import { TableSearchService } from '../../../../shared/table/refactored/services/table-search.service';
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';
import { TableSortService } from '../../../../shared/table/refactored/services/table-sort.service';
import { TableStateService } from '../../../../shared/table/refactored/services/table-state.service';
import { TableSyncService } from '../../../../shared/table/refactored/services/table-sync.service';
import { WorkAreaNavTableClickService } from './work-area-nav-table-click.service';

@Component({
  selector: 'app-work-area-nav-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
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
    {
      provide: TableClickService,
      useClass: WorkAreaNavTableClickService,
    },
  ],
  template: `
    <app-table
      [tableId]="tableId()"
      [items]="items()"
      [columns]="columns()"
      [isTableIsolated]="true"
      (selectedItemsEvent)="onSelectedItems($event)"
      (rowDoubleClicked)="itemDoubleClicked.emit($event)"
    ></app-table>
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

    :host app-table {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
    }
  `],
})
export class WorkAreaNavTableComponent {
  tableId = input<string>('work-area-nav-table');
  items = input<WorkAreaDto[]>([]);
  columns = input<Column[]>([]);

  itemSelected = output<WorkAreaDto | null>();
  itemDoubleClicked = output<WorkAreaDto>();

  onSelectedItems(items: WorkAreaDto[]): void {
    this.itemSelected.emit(items.length > 0 ? items[0] : null);
  }
}
