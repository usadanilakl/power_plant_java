import { Component, inject, computed, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TableComponent } from '../../../shared/table/refactored/table.component';
import { TableSearchService } from '../../../shared/table/refactored/services/table-search.service';
import { TableStateService } from '../../../shared/table/refactored/services/table-state.service';
import { TableSelectionService } from '../../../shared/table/refactored/services/table-selection.service';
import { TableSortService } from '../../../shared/table/refactored/services/table-sort.service';
import { TableDragService } from '../../../shared/table/refactored/services/table-drag.service';
import { TableResizeService } from '../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../shared/table/refactored/services/table-sync.service';
import { TableClickService } from '../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../shared/table/refactored/services/table-controls.service';
import { TableDataService } from '../../../shared/table/refactored/services/table-data.service';
import { RfUserStateService } from '../services/rf-user-state.service';
import { UserDto } from '../../../models/user.model';
import { Column } from '../../../models/column.model';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [TableComponent],
  providers: [
    TableSearchService,
    TableStateService,
    TableSelectionService,
    TableSortService,
    TableDragService,
    TableResizeService,
    TableSyncService,
    TableClickService,
    TableControlsService,
    TableDataService,
  ],
  template: `
    <div class="table-wrapper">
      <app-table
        [tableId]="'users'"
        [items]="items()"
        [columns]="columns"
        (selectedItemsEvent)="selectedItemsEvent.emit($event)"
        (rowDoubleClicked)="onRowDoubleClick($event)">
      </app-table>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .table-wrapper {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
  `]
})
export class UserTableComponent {
  private stateService = inject(RfUserStateService);

  selectedItemsEvent = output<UserDto[]>();

  private items$ = toSignal(this.stateService.allUsers$, { initialValue: [] as UserDto[] });
  items = computed(() => this.items$());

  columns: Column[] = UserDto.toTableColumns();

  onRowDoubleClick(item: any): void {
    const user = UserDto.fromJson(item);
    this.stateService.openForm(user);
  }
}
