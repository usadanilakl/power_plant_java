import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrentHotWorkService } from '../../../../services/current-items-services/current-hot-work.service';
import { Column } from '../../../../models/column.model';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';
import { TableComponent } from '../../../../shared/table/refactored/table.component';
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../shared/table/refactored/services/table-drag.service';
import { TableStateService } from '../../../../shared/table/refactored/services/table-state.service';
import { TableSearchService } from '../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../shared/table/refactored/services/table-sync.service';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../../shared/table/refactored/services/table-controls.service';
import { TableDataService } from '../../../../shared/table/refactored/services/table-data.service';
import { HotWorkTableClickService } from './hot-work-table-click.service';

@Component({
  selector: 'app-hot-work-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  providers: [
    TableSelectionService,
    TableStateService,
    TableDragService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    TableControlsService,
    TableDataService,
    {
      provide: TableClickService,
      useClass: HotWorkTableClickService,
    },
  ],
  templateUrl: './hot-work-table.component.html',
  styleUrl: './hot-work-table.component.css',
})
export class HotWorkTableComponent {
  private currentHotWorkService = inject(CurrentHotWorkService);

  items = toSignal(this.currentHotWorkService.allActiveHotWorks$, { initialValue: [] });
  columns = signal<Column[]>(HotWorkDto.toTableColumns());
}
