import { Injectable, inject } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { LotoPointContextMenuService } from '../services/loto-point-context-menu.service';
import { Column } from '../../../../models/column.model';
import {
  LotoPointDto,
  LotoPointModel,
} from '../../../../models/loto/loto-point.model';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';

@Injectable({
  providedIn: 'root',
})
export class RfLotoPointClickService extends TableClickService {
  private lotoStateService = inject(RfLotoPointStateService);
  private contextMenuService = inject(LotoPointContextMenuService);

  constructor() {
    super();
  }

  /**
   * Override: Handle row double click for LOTO points
   */
  protected override handleRowDoubleClick(item: any, _event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;

    // Fetch full entity from server AND open the form popup — loadItemById
    // alone only sets selectedItem, leaving the page-level
    // isLotoPointFormOpen popup closed (was the bug behind "double-click
    // does nothing" in both the LOTO Standard editor's Points tab and
    // the Images tab, since LotoPointDisplayTable inherits this class).
    if (normalizedItem?.id) {
      this.lotoStateService.loadAndOpenItem(normalizedItem.id);
    }
  }

  /**
   * Override: Handle row right click for LOTO points
   */
  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;

    this.contextMenuService.showContextMenu(normalizedItem, event);
    this.contextMenuService.positionContextMenu(event, 220, 320);
  }

  /**
   * Override: Handle cell double click for LOTO points
   */
  protected override handleCellDoubleClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;

    // Fetch full entity from server instead of using incomplete table data
    if (normalizedItem?.id) {
      this.lotoStateService.loadItemById(normalizedItem.id);
      // Use formFieldKey if available (for nested accessors like 'zeroEnergy.method'), otherwise use accessorKey
      const fieldKey = column.formFieldKey || column.accessorKey;
      const field = fieldKey as keyof LotoPointModel;
      this.lotoStateService.openForm([field]);
    }
  }

  /**
   * Override: Handle cell right click for LOTO points
   */
  protected override handleCellRightClick(_item: any, _column: Column): void {
    // Custom context menu for cell
  }
}
