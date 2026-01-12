
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
import { LotoPointBulkEditService } from '../services/loto-point-bulk-edit.service';
import { RfLotoPointTableDataService } from '../rf-loto-point-table/rf-loto-point-table-data.service';

@Component({
  selector: 'app-loto-point-display-table',
  standalone: true,
  imports: [RfLotoPointTableComponent],
  providers: [
    TableSelectionService,
    TableStateService,
    TableDragService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    LotoPointBulkEditService,
    // LotoPointDisplayTableClickService,
    RfLotoPointTableDataService,
    {
      provide: TableDataService,
      useClass: RfLotoPointTableDataService,
    },
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
  // private clickService = inject(LotoPointDisplayTableClickService);
  private clickService = inject(TableClickService) as LotoPointDisplayTableClickService;


  inputItems = input<LotoPointDto[]>([]);
  isTableIsolated = input<boolean>(false);
  loadMoreEnabled = input<boolean>(false);
  hoverDebounceTime = input<number>(0);
  hoveredItemId = input<number | null>(null);
  /** ID of item to scroll to (triggered by external click events) */
  scrollToItemId = input<number | null>(null);

  selectedItemsEvent = output<LotoPointDto[]>();
  rowHoveredEvent = output<LotoPointDto | null>();
  rowClickedEvent = output<LotoPointDto>();
  /** Emitted when bulk edit is applied - parent should refresh data */
  bulkEditAppliedEvent = output<LotoPointDto[]>();

  constructor() {
    // Forward row clicked events from click service to output event
    this.clickService.rowClicked$.subscribe((item: LotoPointDto) => {
      this.rowClickedEvent.emit(item);
    });
  }
}
