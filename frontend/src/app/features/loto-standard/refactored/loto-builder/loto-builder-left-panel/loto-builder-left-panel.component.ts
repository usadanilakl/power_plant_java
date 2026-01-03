import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { RfFileLeftMenuComponent } from '../../../../files/refactored/rf-file-left-menu/rf-file-left-menu.component';
import { RfLotoPointLeftMenuComponent } from '../../../../loto-points/refactored/rf-loto-point-left-menu/rf-loto-point-left-menu.component';
import { RfFileTableComponent } from '../../../../files/refactored/rf-file-table/rf-file-table.component';
import { RfLotoPointTableComponent } from '../../../../loto-points/refactored/rf-loto-point-table/rf-loto-point-table.component';
import { TableSelectionService } from '../../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../../shared/table/refactored/services/table-drag.service';
import { TableClickService } from '../../../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../../../shared/table/refactored/services/table-controls.service';
import { TableStateService } from '../../../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../../../shared/table/refactored/services/table-data.service';
import { TableSearchService } from '../../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../../shared/table/refactored/services/table-sync.service';
import { LotoPointBulkEditService } from '../../../../loto-points/refactored/services/loto-point-bulk-edit.service';
import { RfLotoPointTableDataService } from '../../../../loto-points/refactored/rf-loto-point-table/rf-loto-point-table-data.service';

@Component({
  selector: 'app-loto-builder-left-panel',
  standalone: true,
  imports: [
    CommonModule,
    RfFileLeftMenuComponent,
    RfLotoPointLeftMenuComponent,
    RfFileTableComponent,
    RfLotoPointTableComponent,
  ],
  providers: [
    TableSelectionService,
    TableDragService,
    TableClickService,
    TableControlsService,
    TableStateService,
    TableDataService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    LotoPointBulkEditService,
    RfLotoPointTableDataService
  ],
  templateUrl: './loto-builder-left-panel.component.html',
  styleUrl: './loto-builder-left-panel.component.css',
})
export class LotoBuilderLeftPanelComponent {
  protected builderState = inject(LotoBuilderStateService);

  /**
   * Switch to file tab
   */
  selectFileTab(): void {
    this.builderState.leftMenuTab.set('file');
  }

  /**
   * Switch to LOTO point tab
   */
  selectLotoPointTab(): void {
    this.builderState.leftMenuTab.set('loto-point');
  }

  /**
   * Toggle display mode between table and toggle-menu
   */
  toggleDisplayMode(): void {
    const current = this.builderState.displayMode();
    this.builderState.displayMode.set(current === 'table' ? 'toggle-menu' : 'table');
  }
}
