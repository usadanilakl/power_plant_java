import { inject, Injectable } from '@angular/core';
import { CurrentFileService } from '../../../../services/current-file.service';
import { FileDto } from '../../../../models/file/file.model';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';

/**
 * Default click service for the file navigation table.
 * Sets the clicked file as the current file in CurrentFileService.
 */
@Injectable()
export class RfFileNavClickService extends TableClickService {
  private currentFileService = inject(CurrentFileService);

  private isFile(item: any): boolean {
    if (item.isFolder || item.objectType === 'Folder') {
      return false;
    }
    return !!(item.id && (item.fileLink || item.extension || item.objectType === 'File'));
  }

  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    super.handleRowLeftClick(item, event);
    const normalizedItem = this.normalizeItem(item);
    if (this.isFile(normalizedItem)) {
      this.currentFileService.setCurrentFile(normalizedItem as FileDto);
    }
  }

  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);
    if (this.isFile(normalizedItem)) {
      this.currentFileService.setCurrentFile(normalizedItem as FileDto);
    }
  }
}
