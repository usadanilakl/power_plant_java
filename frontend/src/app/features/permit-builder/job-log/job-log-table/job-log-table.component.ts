import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrentJobLogService } from '../../../../services/current-items-services/current-job-log.service';
import { Column } from '../../../../models/column.model';
import { JobLogDto } from '../../../../models/permits/job-log.model';
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
import { JobLogTableClickService } from './job-log-table-click.service';

@Component({
  selector: 'app-job-log-table',
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
      useClass: JobLogTableClickService,
    },
  ],
  templateUrl: './job-log-table.component.html',
  styleUrl: './job-log-table.component.css',
})
export class JobLogTableComponent {
  private currentJobLogService = inject(CurrentJobLogService);

  items = toSignal(this.currentJobLogService.allJobLogs$, { initialValue: [] });
  columns = signal<Column[]>(JobLogDto.toTableColumns());
}
