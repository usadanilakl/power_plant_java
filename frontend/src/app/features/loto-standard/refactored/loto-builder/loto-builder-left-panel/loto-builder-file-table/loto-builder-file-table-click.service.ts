import { inject, Injectable } from '@angular/core';
import { CurrentFileService } from '../../../../../../services/current-file.service';
import { FileDto } from '../../../../../../models/file/file.model';
import { TableClickService } from '../../../../../../shared/table/refactored/services/table-click.service';

/**
 * Custom click service for file table in LOTO builder.
 * Opens files in the right panel when clicked.
 * Extends TableClickService directly to avoid dependency on RfFileClickService's injections.
 */
@Injectable()
export class LotoBuilderFileTableClickService extends TableClickService {
  private currentFileService = inject(CurrentFileService);

  /**
   * Check if item is a file (not a folder)
   */
  private isFile(item: any): boolean {
    // Folders typically have isFolder flag or objectType 'Folder'
    if (item.isFolder || item.objectType === 'Folder') {
      return false;
    }
    // Files have an id and typically a fileLink or extension
    return !!(item.id && (item.fileLink || item.extension || item.objectType === 'File'));
  }

  /**
   * Override left click to load file in the right panel
   */
  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    // Call base implementation for selection handling
    super.handleRowLeftClick(item, event);

    const normalizedItem = this.normalizeItem(item);
    console.log('[LotoBuilderFileTable] Left click:', normalizedItem, 'isFile:', this.isFile(normalizedItem));

    // Only open files, not folders
    if (this.isFile(normalizedItem)) {
      this.currentFileService.setCurrentFile(normalizedItem as FileDto);
    }
  }

  /**
   * Override double click to load file in the right panel
   */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);
    console.log('[LotoBuilderFileTable] Double click:', normalizedItem, 'isFile:', this.isFile(normalizedItem));

    // Only open files, not folders
    if (this.isFile(normalizedItem)) {
      this.currentFileService.setCurrentFile(normalizedItem as FileDto);
    }
  }
}
