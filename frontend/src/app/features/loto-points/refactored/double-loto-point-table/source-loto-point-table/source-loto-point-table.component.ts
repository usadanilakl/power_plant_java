import { Component, inject, signal } from '@angular/core';
import { DoubleLotoPointTableService } from '../double-loto-point-table.service';
import { LotoPointDto, LotoPointFieldName } from '../../../../../models/loto/loto-point.model';
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
import { LotoPointContextMenuService } from '../../services/loto-point-context-menu.service';
import { DoubleLotoPointContextMenuService } from '../double-loto-point-context-menu.service';

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
    RfLotoPointTableDataService,
    { provide: TableClickService, useClass: SourceLotoPointTableClickService },
    { provide: TableControlsService, useClass: SourceLotoPointTableControlService },
    { provide: TableDataService, useExisting: RfLotoPointTableDataService },
    // Scoped context menu — adds "Add to Standard" / "Remove from Standard"
    // actions. Overrides the root-provided plant-wide singleton, but only
    // within this component's injector.
    { provide: LotoPointContextMenuService, useClass: DoubleLotoPointContextMenuService },
  ],
  templateUrl: './source-loto-point-table.component.html',
  styleUrl: './source-loto-point-table.component.css',
})
export class SourceLotoPointTableComponent {
  doubleTableService = inject(DoubleLotoPointTableService);

  /**
   * Explicit field list — matches the mapper's default set plus the
   * synthetic 'addToStandard' key AT THE END so the arrow column is
   * sticky-right (pinned to the right edge of the horizontal-scroll
   * viewport). Adding to a plain LOTO Points page's default list would
   * push the arrow into every point-listing table across the app; scoping
   * it here keeps the arrow confined to the LOTO Standard editor's
   * source/available pool.
   */
  sourceFields: LotoPointFieldName[] = [
    'processingStatus', 'tagNumber', 'description', 'specificLocation',
    'location', 'eqType', 'isoPos', 'normPos',
    'isLabeled', 'isLockable', 'zeroEnergy', 'equipmentList',
    'comment',
    'addToStandard',
  ];

  onAddToStandard(item: LotoPointDto): void {
    this.doubleTableService.addItemToSelected(item);
  }
}
