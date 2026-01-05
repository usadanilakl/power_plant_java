import { inject, Injectable } from "@angular/core";
import { ContextMenuService } from "../../../../shared/menu/context-menu/context-menu.service";
import { ContextMenuAction } from "../../../../shared/menu/context-menu/context-menu.component";
import { LotoPointDto, LotoPointModel } from "../../../../models/loto/loto-point.model";
import { LotoPointClipboardItem } from "../../../../models/loto/loto-point-clipboard.model";
import { RfLotoPointStateService } from "./rf-loto-point-state.service";
import { RfLotoPointApiService } from "./rf-loto-point-api.service";
import { map } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class LotoPointContextMenuService extends ContextMenuService {
  private stateService = inject(RfLotoPointStateService);
  private apiService = inject(RfLotoPointApiService);

  constructor() {
    super();
    console.log('[LotoPointContextMenuService] Constructor called');
    // Initialize actions in constructor to ensure proper this binding
    this.contextMenuActions = this.buildContextMenuActions();
  }

  private buildContextMenuActions(): ContextMenuAction[] {
    return [
      {
        id: 'view',
        label: 'View Details',
        icon: '👁️',
        action: (item) => this.handleViewDetails(item),
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: '✏️',
        action: (item) => this.handleEdit(item),
      },
      {
        id: 'clipboard',
        label: 'Add to Clipboard',
        icon: '📋',
        action: (item) => this.handleClipboard(item),
      },
      {
        id: 'divider1',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'verify',
        label: 'Mark as Verified',
        icon: '✓',
        action: (item) => this.handleVerify(item),
      },
      {
        id: 'divider2',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: '🗑️',
        action: (item) => this.handleDelete(item),
      },
      // Custom LOTO Point actions
      {
        id:'inspect',
        label: 'Inspect',
        icon: '🔍',
        action: (item) => this.handleInspect(item),
      },
      {
        id: 'divider3',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'print',
        label: 'Print',
        icon: '🖨️',
        action: (item) => this.handlePrint(item),
      },
      {
        id: 'divider4',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'release',
        label: 'Release',
        icon: '🔓',
        action: (item) => this.handleRelease(item),
      },
    ];
  }

  override clipboardFormatter(items: LotoPointModel[]): LotoPointClipboardItem[] {
    return items.map(i=>new LotoPointClipboardItem(i))
  }

  override handleViewDetails(item: any): void {
    console.log('[LotoPointContextMenu] handleViewDetails called with item:', item);
    if (item?.id) {
      console.log('[LotoPointContextMenu] Loading item by ID:', item.id);
      this.stateService.loadItemById(item.id);
      console.log('[LotoPointContextMenu] Calling openForm()');
      this.stateService.openForm();
      console.log('[LotoPointContextMenu] isLotoPointFormOpen after openForm:', this.stateService.isLotoPointFormOpen());
    } else {
      console.warn('Cannot view details: item has no ID', item);
    }
  }

  /**
   * Override clipboard handler to fetch full DTO before adding to clipboard
   * Table data is incomplete, so we need to fetch from server to get all fields
   * including nested structures like zeroEnergy
   */
  override handleClipboard(item: any): void {

    if (!item?.id) {
      console.warn('[LotoPointContextMenu] Cannot add to clipboard: item has no ID', item);
      return;
    }

    // Fetch full DTO from server using API service
    this.apiService.getLotoPointById(item.id + '').pipe(
      map(response => LotoPointDto.fromJson(response.responseData))
    ).subscribe({
      next: (fullDto: LotoPointDto) => {
        // Now add the complete DTO to clipboard
        super.handleClipboard(fullDto);
      },
      error: (error: any) => {
        console.error('[LotoPointContextMenu] Failed to fetch full DTO:', error);
        // Fallback to table data if fetch fails
        super.handleClipboard(item);
      }
    });
  }

    private handleInspect(item: LotoPointDto): void {
      console.log('Inspecting:', item);
      // Implement inspect logic
    }
  
    private handlePrint(item: LotoPointDto): void {
      console.log('Printing:', item);
      // Implement print logic
    }
  
    private handleRelease(item: LotoPointDto): void {
      console.log('Releasing:', item);
      // Implement release logic
    }


}