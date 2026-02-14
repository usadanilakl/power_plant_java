import { inject, Injectable, signal } from "@angular/core";
import { ContextMenuService } from "../../../../shared/menu/context-menu/context-menu.service";
import { ContextMenuAction } from "../../../../shared/menu/context-menu/context-menu.component";
import { LotoStandardDto, LotoStandardModel } from "../../../../models/loto/loto-standard.model";
import { RfLotoStandardStateService } from "./rf-loto-standard-state.service";
import { RfLotoStandardApiService } from "./rf-loto-standard-api.service";
import { map } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class LotoStandardContextMenuService extends ContextMenuService {
  private stateService = inject(RfLotoStandardStateService);
  private apiService = inject(RfLotoStandardApiService);

  /** Signal to trigger the counterpart standard dialog from the page component */
  counterpartDialogSourceId = signal<number | null>(null);

  customMenuActions: ContextMenuAction[] = [
      {
        id:'view-loto-points',
        label: 'View LOTO Points',
        icon: '📋',
        action: (item) => this.handleViewLotoPoints(item),
      },
      {
        id: 'divider2',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'duplicate',
        label: 'Duplicate Standard',
        icon: '📑',
        action: (item) => this.handleDuplicate(item),
      },
      {
        id: 'generate-counterpart',
        label: 'Generate Counterpart',
        icon: '🔄',
        action: (item) => this.handleGenerateCounterpart(item),
      },
      {
        id: 'divider3',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'verify',
        label: 'Toggle Verified',
        icon: '✓',
        action: (item) => this.handleToggleVerified(item),
      },
  ]

  override contextMenuActions: ContextMenuAction[] = [
    ...this.contextDefaultMenuActions,
    ...this.customMenuActions,
  ]

  override clipboardFormatter(items: LotoStandardModel[]): any[] {
    return items.map(i => ({
      id: i.id,
      name: i.name,
      description: i.description,
      lotoPoints: i.lotoPoints,
      isVerified: i.isVerified
    }));
  }

  override handleViewDetails(item: any): void {
    // Fetch full entity from server instead of using incomplete table data
    if (item?.id) {
      this.stateService.loadItemById(item.id);
    } else {
      console.warn('Cannot view details: item has no ID', item);
    }
  }

  /**
   * Override clipboard handler to fetch full DTO before adding to clipboard
   */
  override handleClipboard(item: any): void {
    console.log('[LotoStandardContextMenu] Clipboard requested for item:', item);

    if (!item?.id) {
      console.warn('[LotoStandardContextMenu] Cannot add to clipboard: item has no ID', item);
      return;
    }

    // Fetch full DTO from server using API service
    this.apiService.getLotoStandardById(item.id + '').pipe(
      map(response => LotoStandardDto.fromJson(response.responseData))
    ).subscribe({
      next: (fullDto: LotoStandardDto) => {
        console.log('[LotoStandardContextMenu] Full DTO fetched:', fullDto);
        // Now add the complete DTO to clipboard
        super.handleClipboard(fullDto);
      },
      error: (error: any) => {
        console.error('[LotoStandardContextMenu] Failed to fetch full DTO:', error);
        // Fallback to table data if fetch fails
        super.handleClipboard(item);
      }
    });
  }

  private handleViewLotoPoints(item: LotoStandardDto): void {
    console.log('Viewing LOTO Points for:', item);
    // Open form to view/edit loto points in double table
    if (item?.id) {
      this.stateService.loadItemById(item.id);
    }
  }

  private handleDuplicate(item: LotoStandardDto): void {
    console.log('Duplicating standard:', item);
    // Create a copy without ID
    const duplicate = new LotoStandardDto({
      ...item,
      id: undefined,
      name: `${item.name} (Copy)`
    });
    this.stateService.setSelectedItem(duplicate);
    this.stateService.openForm();
  }

  private handleGenerateCounterpart(item: LotoStandardDto): void {
    if (item?.id) {
      this.counterpartDialogSourceId.set(item.id);
    }
  }

  private handleToggleVerified(item: LotoStandardDto): void {
    console.log('Toggling verified status for:', item);
    const updated = new LotoStandardDto({
      ...item,
      isVerified: !item.isVerified
    });
    this.apiService.saveLotoStandard(updated).subscribe({
      next: (response) => {
        console.log('Verified status updated:', response.responseData);
        // Refresh table or update local state
      },
      error: (error) => {
        console.error('Failed to update verified status:', error);
      }
    });
  }
}
