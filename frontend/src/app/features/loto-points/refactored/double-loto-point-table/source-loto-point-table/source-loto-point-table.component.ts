import { Component, inject, signal } from '@angular/core';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { DoubleLotoPointTableService } from '../double-loto-point-table.service';
import { ButtonColor } from '../../../../../shared/menu/buttons/buttons.component';
import { RfLotoPointTableComponent } from "../../rf-loto-point-table/rf-loto-point-table.component";
import { TableClickService } from '../../../../../shared/table/refactored/services/table-click.service';
import { SourceLotoPointTableClickService } from './source-loto-point-table-click.service';
import { TableSearchService } from '../../../../../shared/table/refactored/services/table-search.service';
import { TableControlsService } from '../../../../../shared/table/refactored/services/table-controls.service';
import { TableStateService } from '../../../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../../../shared/table/refactored/services/table-data.service';
import { TableSelectionService } from '../../../../../shared/table/refactored/services/table-selection.service';
import { TableSortService } from '../../../../../shared/table/refactored/services/table-sort.service';
import { TableDragService } from '../../../../../shared/table/refactored/services/table-drag.service';
import { TableResizeService } from '../../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../../shared/table/refactored/services/table-sync.service';
import { RfLotoPointTableDataService } from '../../rf-loto-point-table/rf-loto-point-table-data.service';
import { SourceLotoPointTableControlService } from './source-loto-point-table-control.service';
import { LotoPointBulkEditService } from '../../services/loto-point-bulk-edit.service';

@Component({
  selector: 'app-source-loto-point-table',
  imports: [RfLotoPointTableComponent],
  providers: [
    TableSearchService,
    TableStateService,
    TableSelectionService,
    TableSearchService,
    TableSortService,
    TableDragService,
    TableResizeService,
    TableSyncService,
    LotoPointBulkEditService,
    { provide: TableClickService, useClass: SourceLotoPointTableClickService },
    { provide: TableControlsService, useClass: SourceLotoPointTableControlService },
    { provide: TableDataService, useClass: RfLotoPointTableDataService },
  ],
  templateUrl: './source-loto-point-table.component.html',
  styleUrl: './source-loto-point-table.component.css',
})
export class SourceLotoPointTableComponent {
  doubleTableService = inject(DoubleLotoPointTableService);


}
