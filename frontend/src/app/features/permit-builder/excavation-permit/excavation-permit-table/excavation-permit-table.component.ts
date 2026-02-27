import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrentExcavationPermitService } from '../../../../services/current-items-services/current-excavation-permit.service';
import { ExcavationPermitDto } from '../../../../models/permits/excavation-permit.model';
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
import { ExcavationPermitTableClickService } from './excavation-permit-table-click.service';

@Component({
  selector: 'app-excavation-permit-table',
  standalone: true,
  imports: [TableComponent],
  providers: [
    TableSelectionService, TableStateService, TableDragService, TableSearchService,
    TableSortService, TableResizeService, TableSyncService, TableControlsService,
    TableDataService,
    { provide: TableClickService, useClass: ExcavationPermitTableClickService },
  ],
  templateUrl: './excavation-permit-table.component.html',
  styleUrl: './excavation-permit-table.component.css'
})
export class ExcavationPermitTableComponent {
  private currentService = inject(CurrentExcavationPermitService);
  items = toSignal(this.currentService.allActivePermits$, { initialValue: [] });
  columns = signal<Column[]>(ExcavationPermitDto.toTableColumns());
}
