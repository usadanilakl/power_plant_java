import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrentVentingPermitService } from '../../../../services/current-items-services/current-venting-permit.service';
import { Column } from '../../../../models/column.model';
import { VentingPermitDto } from '../../../../models/permits/venting-permit.model';
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
import { VentingPermitTableClickService } from './venting-permit-table-click.service';

@Component({
  selector: 'app-venting-permit-table',
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
      useClass: VentingPermitTableClickService,
    },
  ],
  templateUrl: './venting-permit-table.component.html',
  styleUrl: './venting-permit-table.component.css',
})
export class VentingPermitTableComponent {
  private currentVentingPermitService = inject(CurrentVentingPermitService);

  items = toSignal(this.currentVentingPermitService.allActivePermits$, { initialValue: [] });
  columns = signal<Column[]>(VentingPermitDto.toTableColumns());
}
