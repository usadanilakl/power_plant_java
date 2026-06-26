import { inject, Injectable } from '@angular/core';
import { CurrentFileService } from '../../../../services/current-file.service';
import { FileDto } from '../../../../models/file/file.model';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { FileContextMenuService } from '../services/file-context-menu.service';

/**
 * Default click service for the file navigation table.
 * Sets the clicked file as the current file in CurrentFileService and shows the
 * shared file context menu on right-click (parity with the toggle/tree view).
 */
@Injectable()
export class RfFileNavClickService extends TableClickService {
  private currentFileService = inject(CurrentFileService);
  private contextMenuService = inject(FileContextMenuService);

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
      this.currentFileService.setCurrentFile(this.normalizeForViewer(normalizedItem as FileDto));
    }
  }

  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);
    if (this.isFile(normalizedItem)) {
      this.currentFileService.setCurrentFile(this.normalizeForViewer(normalizedItem as FileDto));
    }
  }

  /**
   * Auto-convert PDF→JPG (when a JPG variant exists) so the file viewer renders
   * the raster by default — same behavior as the tree's handleFileEditClick.
   * Without this, files opened from the table appeared "randomly" as PDFs while
   * tree-opened files were always JPGs, and the user had to toggle format to
   * see consistent content. The toggle button still flips back to PDF on demand.
   *
   * Uses a transient FileDto copy so we don't mutate the table state's row.
   */
  private normalizeForViewer(file: FileDto): FileDto {
    const hasJpg = (file.extensions ?? []).some(e => e?.toLowerCase() === 'jpg');
    if (!file.fileLink?.toLowerCase().endsWith('.pdf') || !hasJpg) {
      return file;
    }
    return new FileDto({
      ...file,
      fileLink: file.fileLink.replace(/\.pdf$/i, '.jpg'),
      extension: 'jpg',
    });
  }

  /**
   * Right-click opens the shared FileContextMenu (Edit / Delete / etc.) so the
   * table view has feature parity with the tree (which wires it via
   * RfFileLeftMenuComponent.onItemRightClick).
   */
  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);
    if (!this.isFile(normalizedItem)) return;
    this.contextMenuService.showContextMenu(normalizedItem, event);
  }
}
