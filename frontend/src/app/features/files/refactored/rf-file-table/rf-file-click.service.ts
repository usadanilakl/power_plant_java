import { Injectable, inject } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { FileContextMenuService } from '../services/file-context-menu.service';
import { Column } from '../../../../models/column.model';
import { FileDto } from '../../../../models/file/file.model';
import { RfFileStateService } from '../services/rf-file-state.service';

@Injectable()
export class RfFileClickService extends TableClickService {
  private fileStateService = inject(RfFileStateService);
  private contextMenuService = inject(FileContextMenuService);

  /**
   * Override: Handle row double click for files
   */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as FileDto;
    console.log('File: Double click -', normalizedItem);

    // Fetch full entity from server and open form
    if (normalizedItem?.id) {
      this.contextMenuService.handleViewDetails(normalizedItem);
    } else {
      console.warn('Cannot load item: no ID found', normalizedItem);
    }
  }

  /**
   * Override: Handle row right click for files
   */
  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as FileDto;
    console.log('File: Right click -', normalizedItem);

    this.contextMenuService.showContextMenu(normalizedItem, event);
    this.contextMenuService.positionContextMenu(event, 220, 320);
  }

  /**
   * Override: Handle cell double click for files
   */
  protected override handleCellDoubleClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item) as FileDto;
    console.log('File: Cell double click -', normalizedItem, column);

    // Fetch full entity from server and open form with specific field
    if (normalizedItem?.id) {
      const fieldKey = column.formFieldKey || column.accessorKey;
      const field = fieldKey as keyof FileDto;
      this.contextMenuService.handleViewDetails(normalizedItem);
      // Note: Could pass field to openForm if needed
    } else {
      console.warn('Cannot load item: no ID found', normalizedItem);
    }
  }

  /**
   * Override: Handle cell right click for files
   */
  protected override handleCellRightClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item) as FileDto;
    console.log('File: Cell right click -', normalizedItem, column);

    // Show context menu for cell
    this.contextMenuService.showContextMenu(normalizedItem, undefined);
  }
}
