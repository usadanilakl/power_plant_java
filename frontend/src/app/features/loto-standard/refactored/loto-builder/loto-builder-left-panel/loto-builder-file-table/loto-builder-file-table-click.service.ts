import { inject, Injectable } from '@angular/core';
import { TableClickService } from '../../../../../../shared/table/refactored/services/table-click.service';
import { CurrentFileService } from '../../../../../../services/current-file.service';
import { FileDto } from '../../../../../../models/file/file.model';

/**
 * Custom click service for file table in LOTO builder.
 * Opens files in the right panel when double-clicked.
 */
@Injectable()
export class LotoBuilderFileTableClickService extends TableClickService {
  private currentFileService = inject(CurrentFileService);

  /**
   * Override double click to load file in the right panel
   */
  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);
    console.log('[LotoBuilderFileTable] Opening file:', normalizedItem);

    if (normalizedItem instanceof FileDto || normalizedItem.id) {
      this.currentFileService.setCurrentFile(normalizedItem as FileDto);
    }
  }
}
