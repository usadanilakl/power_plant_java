import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrentEnergizedWorkPermitService } from '../../../../services/current-items-services/current-energized-work-permit.service';
import { EnergizedWorkPermitDto } from '../../../../models/permits/energized-work-permit.model';
import { Column } from '../../../../models/column.model';
import { TableComponent } from '../../../../shared/table/refactored/table.component';
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';
import { TableStateService } from '../../../../shared/table/refactored/services/table-state.service';
import { TableDragService } from '../../../../shared/table/refactored/services/table-drag.service';
import { TableSearchService } from '../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../shared/table/refactored/services/table-sync.service';
import { TableControlsService } from '../../../../shared/table/refactored/services/table-controls.service';
import { TableDataService } from '../../../../shared/table/refactored/services/table-data.service';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { EnergizedWorkPermitTableClickService } from './energized-work-permit-table-click.service';

@Component({
  selector: 'app-energized-work-permit-table',
  standalone: true,
  imports: [TableComponent],
  providers: [
    TableSelectionService, TableStateService, TableDragService, TableSearchService,
    TableSortService, TableResizeService, TableSyncService, TableControlsService,
    TableDataService,
    { provide: TableClickService, useClass: EnergizedWorkPermitTableClickService },
  ],
  templateUrl: './energized-work-permit-table.component.html',
  styleUrl: './energized-work-permit-table.component.css'
})
export class EnergizedWorkPermitTableComponent {
  private currentService = inject(CurrentEnergizedWorkPermitService);
  items = toSignal(this.currentService.allActivePermits$, { initialValue: [] });
  columns = signal<Column[]>(EnergizedWorkPermitDto.toTableColumns());
}
