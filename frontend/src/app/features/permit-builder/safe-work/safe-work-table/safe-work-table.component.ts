import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrentSafeWorkService } from '../../../../services/current-items-services/current-safe-work.service';
import { Column } from '../../../../models/column.model';
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';
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
import { SafeWorkTableClickService } from './safe-work-table-click.service';

@Component({
  selector: 'app-safe-work-table',
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
      useClass: SafeWorkTableClickService,
    },
  ],
  templateUrl: './safe-work-table.component.html',
  styleUrl: './safe-work-table.component.css',
})
export class SafeWorkTableComponent {
  private currentSafeWorkService = inject(CurrentSafeWorkService);

  items = toSignal(this.currentSafeWorkService.allActiveSafeWorks$, { initialValue: [] });
  columns = signal<Column[]>(SafeWorkDto.toTableColumns());
}
