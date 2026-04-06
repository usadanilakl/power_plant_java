import { Injectable, inject } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { RfFieldListContextMenuService } from './rf-field-list-context-menu.service';

@Injectable()
export class RfFieldListTableClickService extends TableClickService {
  private contextMenuService = inject(RfFieldListContextMenuService);

  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    this.contextMenuService.showContextMenu(item, event);
    this.contextMenuService.positionContextMenu(event, 220, 280);
  }

  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    this.contextMenuService.viewDetails$.next(item);
  }
}
