import { Injectable, inject } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { RfSdsContextMenuService } from './rf-sds-context-menu.service';

@Injectable({ providedIn: 'root' })
export class RfSdsTableClickService extends TableClickService {
  private contextMenuService = inject(RfSdsContextMenuService);

  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    const normalized = this.normalizeItem(item);
    this.contextMenuService.showContextMenu(normalized, event);
    this.contextMenuService.positionContextMenu(event, 220, 320);
  }
}
