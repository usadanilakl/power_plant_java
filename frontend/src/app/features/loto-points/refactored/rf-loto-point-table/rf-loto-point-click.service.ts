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
    console.log(`��� [${this.debugInstanceId}] Initialized`);
  }

  /**
   * Override: Handle row double click for LOTO points
   */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    console.log('🟢 LOTO: Double click -', normalizedItem);
    console.log(`🆔 [${this.debugInstanceId}] LOTO double click:`, item);

    // Fetch full entity from server instead of using incomplete table data
    if (normalizedItem?.id) {
      this.lotoStateService.loadItemById(normalizedItem.id);
    } else {
      console.warn('Cannot load item: no ID found', normalizedItem);
    }
  }

  /**
   * Override: Handle row right click for LOTO points
   */
  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    console.log('🔵 LOTO: Right click -', normalizedItem);

    this.contextMenuService.showContextMenu(normalizedItem, event);
    this.contextMenuService.positionContextMenu(event, 220, 320);
  }

  /**
   * Override: Handle cell double click for LOTO points
   */
  protected override handleCellDoubleClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    console.log('LOTO: Cell double click -', normalizedItem, column);

    // Fetch full entity from server instead of using incomplete table data
    if (normalizedItem?.id) {
      this.lotoStateService.loadItemById(normalizedItem.id);
      // Use formFieldKey if available (for nested accessors like 'zeroEnergy.method'), otherwise use accessorKey
      const fieldKey = column.formFieldKey || column.accessorKey;
      const field = fieldKey as keyof LotoPointModel;
      this.lotoStateService.openForm([field]);
    } else {
      console.warn('Cannot load item: no ID found', normalizedItem);
    }
  }

  /**
   * Override: Handle cell right click for LOTO points
   */
  protected override handleCellRightClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    console.log('LOTO: Cell right click -', normalizedItem, column);

    // Custom context menu for cell
  }
}
