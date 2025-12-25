
import { Component, input, output, inject } from '@angular/core';
import { RfLotoPointTableComponent } from '../rf-loto-point-table/rf-loto-point-table.component';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../shared/table/refactored/services/table-drag.service';
import { TableStateService } from '../../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../../shared/table/refactored/services/table-data.service';
import { TableSearchService } from '../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../shared/table/refactored/services/table-sync.service';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../../shared/table/refactored/services/table-controls.service';
import { LotoPointDisplayTableClickService } from './loto-point-display-table-click.service';
import { LotoPointDisplayTableControlService } from './loto-point-display-table-control.service';

@Component({
  selector: 'app-loto-point-display-table',
  standalone: true,
  imports: [RfLotoPointTableComponent],
  providers: [
    TableSelectionService,
    TableDragService,
    TableStateService,
    TableDataService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    {
      provide: TableClickService,
      useClass: LotoPointDisplayTableClickService,
    },
    {
      provide: TableControlsService,
      useClass: LotoPointDisplayTableControlService,
    },
  ],
  templateUrl: './loto-point-display-table.component.html',
  styleUrl: './loto-point-display-table.component.css',
})
export class LotoPointDisplayTableComponent {
  inputItems = input<LotoPointDto[]>([]);
  isTableIsolated = input<boolean>(false);
  loadMoreEnabled = input<boolean>(false);
  
  selectedItemsEvent = output<LotoPointDto[]>();
}
