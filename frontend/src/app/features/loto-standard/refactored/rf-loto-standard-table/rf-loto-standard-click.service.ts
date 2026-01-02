import { Injectable, inject } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { Column } from '../../../../models/column.model';
import {
  LotoStandardDto,
  LotoStandardModel,
} from '../../../../models/loto/loto-standard.model';
import { RfLotoStandardStateService } from '../services/rf-loto-standard-state.service';
import { LotoStandardContextMenuService } from '../services/loto-standard-context-menu.service';

@Injectable({
  providedIn: 'root',
})
export class RfLotoStandardClickService extends TableClickService {
  private lotoStandardStateService = inject(RfLotoStandardStateService);
  private contextMenuService = inject(LotoStandardContextMenuService);

  constructor() {
    super();
    console.log(`🔧 [${this.debugInstanceId}] RfLotoStandardClickService Initialized`);
  }

  /**
   * Override: Handle row double click for LOTO standards
   */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoStandardDto;
    console.log('🟢 LOTO Standard: Double click -', normalizedItem);
    console.log(`🆔 [${this.debugInstanceId}] LOTO Standard double click:`, item);

    // Fetch full entity from server instead of using incomplete table data
    if (normalizedItem?.id) {
      this.lotoStandardStateService.loadItemById(normalizedItem.id);
    } else {
      console.warn('Cannot load item: no ID found', normalizedItem);
    }
  }

  /**
   * Override: Handle row right click for LOTO standards
   */
  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoStandardDto;
    console.log('🔵 LOTO Standard: Right click -', normalizedItem);

    this.contextMenuService.showContextMenu(normalizedItem, event);
    this.contextMenuService.positionContextMenu(event, 220, 320);
  }

  /**
   * Override: Handle cell double click for LOTO standards
   */
  protected override handleCellDoubleClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item) as LotoStandardDto;
    console.log('LOTO Standard: Cell double click -', normalizedItem, column);

    // Fetch full entity from server instead of using incomplete table data
    if (normalizedItem?.id) {
      this.lotoStandardStateService.loadItemById(normalizedItem.id);
      // Use formFieldKey if available (for nested accessors), otherwise use accessorKey
      const fieldKey = column.formFieldKey || column.accessorKey;
      const field = fieldKey as keyof LotoStandardModel;
      this.lotoStandardStateService.openForm([field]);
    } else {
      console.warn('Cannot load item: no ID found', normalizedItem);
    }
  }

  /**
   * Override: Handle cell right click for LOTO standards
   */
  protected override handleCellRightClick(item: any, column: Column, event?: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoStandardDto;
    console.log('LOTO Standard: Cell right click -', normalizedItem, column);

    if (event) {
      this.contextMenuService.showContextMenu(normalizedItem, event);
      this.contextMenuService.positionContextMenu(event, 220, 320);
    }
  }
}
