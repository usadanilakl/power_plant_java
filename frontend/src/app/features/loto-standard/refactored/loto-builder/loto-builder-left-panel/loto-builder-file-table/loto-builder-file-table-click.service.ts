import { inject, Injectable } from '@angular/core';
import { CurrentFileService } from '../../../../../../services/current-file.service';
import { FileDto } from '../../../../../../models/file/file.model';
import { RfFileClickService } from '../../../../../files/refactored/rf-file-table/rf-file-click.service';

/**
 * Custom click service for file table in LOTO builder.
 * Opens files in the right panel when clicked.
 * Inherits context menu handling from RfFileClickService.
 */
@Injectable()
export class LotoBuilderFileTableClickService extends RfFileClickService {
  private currentFileService = inject(CurrentFileService);

  /**
   * Override left click to load file in the right panel
   */
  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);
    console.log('[LotoBuilderFileTable] Opening file:', normalizedItem);

    if (normalizedItem instanceof FileDto || normalizedItem.id) {
      this.currentFileService.setCurrentFile(normalizedItem as FileDto);
    }
  }

  /**
   * Override double click to load file in the right panel
   */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);
    console.log('[LotoBuilderFileTable] Double click - opening file:', normalizedItem);

    if (normalizedItem instanceof FileDto || normalizedItem.id) {
      this.currentFileService.setCurrentFile(normalizedItem as FileDto);
    }
  }
}
