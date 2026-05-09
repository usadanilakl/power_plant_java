import { Injectable, inject } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { RfInventoryContextMenuService } from './rf-inventory-context-menu.service';

@Injectable({ providedIn: 'root' })
export class RfInventoryTableClickService extends TableClickService {
  private contextMenuService = inject(RfInventoryContextMenuService);

  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    const normalized = this.normalizeItem(item);
    this.contextMenuService.showContextMenu(normalized, event);
    this.contextMenuService.positionContextMenu(event, 220, 320);
  }
}
