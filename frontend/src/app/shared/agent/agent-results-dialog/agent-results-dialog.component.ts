import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { RfLotoPointTableComponent } from '../../../features/loto-points/refactored/rf-loto-point-table/rf-loto-point-table.component';
import { RfLotoPointStateService } from '../../../features/loto-points/refactored/services/rf-loto-point-state.service';
import { RfLotoPointTableDataService } from '../../../features/loto-points/refactored/rf-loto-point-table/rf-loto-point-table-data.service';
import { RfLotoPointClickService } from '../../../features/loto-points/refactored/rf-loto-point-table/rf-loto-point-click.service';
import { LotoPointBulkEditService } from '../../../features/loto-points/refactored/services/loto-point-bulk-edit.service';
import { LotoPointContextMenuService } from '../../../features/loto-points/refactored/services/loto-point-context-menu.service';
import { RfPopupProjectionComponent } from '../../popup-projection/rf-popup-projection.component';
import { RfLotoPointFormComponent } from '../../../features/loto-points/refactored/rf-loto-point-form/rf-loto-point-form.component';
import { TableSelectionService } from '../../table/refactored/services/table-selection.service';
import { TableStateService } from '../../table/refactored/services/table-state.service';
import { TableDragService } from '../../table/refactored/services/table-drag.service';
import { TableSearchService } from '../../table/refactored/services/table-search.service';
import { TableSortService } from '../../table/refactored/services/table-sort.service';
import { TableResizeService } from '../../table/refactored/services/table-resize.service';
import { TableSyncService } from '../../table/refactored/services/table-sync.service';
import { TableClickService } from '../../table/refactored/services/table-click.service';
import { TableControlsService } from '../../table/refactored/services/table-controls.service';
import { TableDataService } from '../../table/refactored/services/table-data.service';

export interface AgentResultsDialogData {
  items: LotoPointDto[];
}

@Component({
  selector: 'app-agent-results-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    RfLotoPointTableComponent,
    RfPopupProjectionComponent,
    RfLotoPointFormComponent,
  ],
  providers: [
    RfLotoPointStateService,
    LotoPointContextMenuService,
    TableSelectionService,
    TableStateService,
    TableDragService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    TableControlsService,
    LotoPointBulkEditService,
    RfLotoPointTableDataService,
    { provide: TableClickService, useClass: RfLotoPointClickService },
    { provide: TableDataService, useClass: RfLotoPointTableDataService },
  ],
  template: `
    <div class="dialog-header">
      <h3>Search Results ({{ items.length }})</h3>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <div class="dialog-content">
      <app-rf-loto-point-table
        [tableId]="'agent-results-table'"
        [inputItems]="items"
        [isTableIsolated]="true"
        [enableDragDrop]="false"
        [loadMoreEnabled]="false"
        (rowDoubleClickedEvent)="onItemDoubleClick($event)">
      </app-rf-loto-point-table>
    </div>

    @if (stateService.isLotoPointFormOpen()) {
      <app-rf-popup-projection
        [isOpen]="true"
        [fullHeight]="true"
        [zIndex]="10002"
        (close)="stateService.closeForm()">
        <app-rf-loto-point-form [fieldsInput]="stateService.formFields()"></app-rf-loto-point-form>
      </app-rf-popup-projection>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: var(--surface-color, #1e1e2e);
    }
    .dialog-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--text-primary, #e0e0e0);
    }
    .dialog-content {
      flex: 1;
      overflow: hidden;
      min-height: 400px;
    }
  `],
})
export class AgentResultsDialogComponent {
  private data = inject<AgentResultsDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AgentResultsDialogComponent>);
  private router = inject(Router);
  stateService = inject(RfLotoPointStateService);

  items = this.data.items;

  onItemDoubleClick(item: LotoPointDto): void {
    if (item?.id) {
      this.stateService.loadAndOpenItem(item.id);
    }
  }
}
