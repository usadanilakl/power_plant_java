import { inject, Injectable } from "@angular/core";
import { ContextMenuService } from "../../../../shared/menu/context-menu/context-menu.service";
import { ContextMenuAction } from "../../../../shared/menu/context-menu/context-menu.component";
import { FileDto } from "../../../../models/file/file.model";
import { RfFileStateService } from "./rf-file-state.service";
import { RfFileApiService } from "./rf-file-api.service";
import { map } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class FileContextMenuService extends ContextMenuService {
  private stateService = inject(RfFileStateService);
  private apiService = inject(RfFileApiService);

  customMenuActions: ContextMenuAction[] = [
      {
        id:'open',
        label: 'Open File',
        icon: '📂',
        action: (item) => this.handleOpen(item),
      },
      {
        id: 'divider2',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'download',
        label: 'Download',
        icon: '⬇️',
        action: (item) => this.handleDownload(item),
      },
      {
        id: 'divider3',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'loto-points',
        label: 'View LOTO Points',
        icon: '🔒',
        action: (item) => this.handleViewLotoPoints(item),
      },
  ]

  override contextMenuActions: ContextMenuAction[] = [
    ...this.contextDefaultMenuActions,
    ...this.customMenuActions,
  ]

  override clipboardFormatter(items: FileDto[]): any[] {
    return items.map(i => ({
      id: i.id,
      name: i.name,
      fileType: i.fileType?.name,
      system: i.system?.name,
      folder: i.folder,
    }))
  }

  override handleViewDetails(item: any): void {
    // Fetch full entity from server instead of using incomplete table data
    if (item?.id) {
      this.apiService.getFileById(item.id + '').pipe(
        map(response => FileDto.fromJson(response.responseData))
      ).subscribe({
        next: (fullDto: FileDto) => {
          this.stateService.setSelectedItem(fullDto);
          this.stateService.openForm();
        },
        error: (error: any) => {
          console.error('Failed to fetch file details:', error);
        }
      });
    } else {
      console.warn('Cannot view details: item has no ID', item);
    }
  }

  /**
   * Override clipboard handler to fetch full DTO before adding to clipboard
   * Table data is incomplete, so we need to fetch from server to get all fields
   */
  override handleClipboard(item: any): void {
    console.log('[FileContextMenu] Clipboard requested for item:', item);

    if (!item?.id) {
      console.warn('[FileContextMenu] Cannot add to clipboard: item has no ID', item);
      return;
    }

    // Fetch full DTO from server using API service
    this.apiService.getFileById(item.id + '').pipe(
      map(response => FileDto.fromJson(response.responseData))
    ).subscribe({
      next: (fullDto: FileDto) => {
        console.log('[FileContextMenu] Full DTO fetched:', fullDto);
        // Now add the complete DTO to clipboard
        super.handleClipboard(fullDto);
      },
      error: (error: any) => {
        console.error('[FileContextMenu] Failed to fetch full DTO:', error);
        // Fallback to table data if fetch fails
        super.handleClipboard(item);
      }
    });
  }

  private handleOpen(item: FileDto): void {
    console.log('Opening file:', item);
    if (item.fileLink) {
      window.open(item.fileLink, '_blank');
    }
  }

  private handleDownload(item: FileDto): void {
    console.log('Downloading:', item);
    if (item.id) {
      this.apiService.downloadFile(item.id + '').subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = item.name || 'download';
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error: any) => {
          console.error('Download failed:', error);
        }
      });
    }
  }

  private handleViewLotoPoints(item: FileDto): void {
    console.log('Viewing LOTO points for:', item);
    // Implement logic to show LOTO points associated with this file
    if (item.id) {
      this.apiService.getRelatedLotoPoints(item.id).subscribe({
        next: (response) => {
          console.log('Related LOTO points:', response.responseData);
          // Show in dialog or navigate to LOTO points view
        },
        error: (error: any) => {
          console.error('Failed to fetch LOTO points:', error);
        }
      });
    }
  }
}
