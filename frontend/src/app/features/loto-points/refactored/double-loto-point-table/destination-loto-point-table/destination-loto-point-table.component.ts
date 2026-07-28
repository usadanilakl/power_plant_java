import { Component, inject } from '@angular/core';
import { RfLotoPointTableComponent } from "../../rf-loto-point-table/rf-loto-point-table.component";
import { DoubleLotoPointTableService } from '../double-loto-point-table.service';
import { LotoPointDto, LotoPointFieldName } from '../../../../../models/loto/loto-point.model';
import { TableClickService } from '../../../../../shared/table/refactored/services/table-click.service';
import { DestinationLotoPointTableClickService } from './destination-loto-point-table-click.service';
import { TableSelectionService } from '../../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../../shared/table/refactored/services/table-drag.service';
import { TableControlsService } from '../../../../../shared/table/refactored/services/table-controls.service';
import { TableStateService } from '../../../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../../../shared/table/refactored/services/table-data.service';
import { TableSearchService } from '../../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../../shared/table/refactored/services/table-sync.service';
import { DestinationLotoPointTableControlService } from './destination-loto-point-table-control.service';
import { LotoPointBulkEditService } from '../../services/loto-point-bulk-edit.service';
import { RfLotoPointTableDataService } from '../../rf-loto-point-table/rf-loto-point-table-data.service';
import { LotoPointContextMenuService } from '../../services/loto-point-context-menu.service';
import { DoubleLotoPointContextMenuService } from '../double-loto-point-context-menu.service';

@Component({
  selector: 'app-destination-loto-point-table',
  imports: [RfLotoPointTableComponent],
  providers: [
    TableSelectionService,
    TableDragService,
    TableStateService,
    TableSelectionService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    LotoPointBulkEditService,
    RfLotoPointTableDataService,
    {
      provide: TableClickService,
      useClass: DestinationLotoPointTableClickService,
    },
    {
      provide: TableControlsService,
      useClass: DestinationLotoPointTableControlService,
    },
    {
      provide: TableDataService,
      useExisting: RfLotoPointTableDataService,
    },
    // Scoped context menu with "Add to Standard" / "Remove from Standard".
    { provide: LotoPointContextMenuService, useClass: DoubleLotoPointContextMenuService },
  ],
  templateUrl: './destination-loto-point-table.component.html',
  styleUrl: './destination-loto-point-table.component.css',
})
export class DestinationLotoPointTableComponent {
  doubleTableService = inject(DoubleLotoPointTableService);

  /**
   * Explicit field list — 'removeFromStandard' is FIRST so the arrow
   * column is sticky-left (pinned to the left edge of the horizontal-
   * scroll viewport). Symmetrical to source's 'addToStandard' at the end.
   */
  destinationFields: LotoPointFieldName[] = [
    'removeFromStandard',
    'processingStatus', 'tagNumber', 'description', 'specificLocation',
    'location', 'eqType', 'isoPos', 'normPos',
    'isLabeled', 'isLockable', 'zeroEnergy', 'equipmentList',
    'comment',
  ];

  onItemsReordered(items: LotoPointDto[]): void {
    this.doubleTableService.onSelectedItemsReordered(items);
  }

  onRemoveFromStandard(item: LotoPointDto): void {
    this.doubleTableService.removeItemFromSelected(item);
  }
}
