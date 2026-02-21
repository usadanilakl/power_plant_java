import { inject, Injectable } from '@angular/core';
import { TableClickService } from '../../../../../shared/table/refactored/services/table-click.service';
import { WorkRequestContextMenuService } from '../services/work-request-context-menu.service';
import { WorkRequestDto } from '../../../../../models/permits/work-request.model';
import { RfWorkRequestStateService } from '../services/rf-work-request-state.service';
import { AttachmentDialogService } from '../../../../../shared/attachment-dialog/attachment-dialog.service';
import { Column } from '../../../../../models/column.model';

@Injectable()
export class WorkRequestTableClickService extends TableClickService {
  private contextMenuService = inject(WorkRequestContextMenuService);
  private wrStateService = inject(RfWorkRequestStateService);
  private attachmentDialogService = inject(AttachmentDialogService);

  constructor() {
    super();
  }

  /**
   * Override: Handle row left click — intercept attachment column clicks
   */
  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const cell = target.closest('td');
    const columnId = cell?.getAttribute('data-column-id');

    if (columnId === 'attachmentCount') {
      const normalizedItem = this.normalizeItem(item) as WorkRequestDto;
      if (normalizedItem?.attachmentCount && normalizedItem.attachmentCount > 0) {
        this.attachmentDialogService.open('WorkRequest', normalizedItem.id!);
        return;
      }
    }

    super.handleRowLeftClick(item, event);
  }

  /**
   * Override: Handle row double click for work requests
   */
  protected override handleRowDoubleClick(item: any, _event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as WorkRequestDto;

    if (normalizedItem?.id) {
      this.wrStateService.loadItemById(normalizedItem.id);
    }
  }

  /**
   * Override: Handle row right click for work requests
   */
  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as WorkRequestDto;

    this.contextMenuService.showContextMenu(normalizedItem, event);
    this.contextMenuService.positionContextMenu(event, 220, 200);
  }
}
