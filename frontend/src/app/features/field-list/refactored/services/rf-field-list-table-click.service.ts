import { Injectable, inject } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { RfFieldListContextMenuService } from './rf-field-list-context-menu.service';
import { RfFieldListStateService } from './rf-field-list-state.service';

@Injectable()
export class RfFieldListTableClickService extends TableClickService {
  private contextMenuService = inject(RfFieldListContextMenuService);
  private fieldListState = inject(RfFieldListStateService);

  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalized = this.normalizeItem(item);
    if (normalized?.id) {
      this.fieldListState.openDetail(normalized);
    }
  }

  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    const normalized = this.normalizeItem(item);
    this.contextMenuService.showContextMenu(normalized, event);
    this.contextMenuService.positionContextMenu(event, 220, 280);
  }
}
