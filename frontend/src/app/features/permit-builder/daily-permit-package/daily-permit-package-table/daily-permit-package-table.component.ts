import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { Column } from '../../../../models/column.model';
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';
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
import { DailyPermitPackageTableClickService } from './daily-permit-package-table-click.service';

@Component({
  selector: 'app-daily-permit-package-table',
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
      useClass: DailyPermitPackageTableClickService,
    },
  ],
  templateUrl: './daily-permit-package-table.component.html',
  styleUrl: './daily-permit-package-table.component.css',
})
export class DailyPermitPackageTableComponent {
  private currentService = inject(CurrentDailyPermitPackageService);

  items = toSignal(this.currentService.allActiveDailyPermitPackages$, { initialValue: [] });
  columns = signal<Column[]>(DailyPermitPackageDto.toTableColumns());
}
