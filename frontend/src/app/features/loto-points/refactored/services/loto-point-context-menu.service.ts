import { inject, Injectable } from "@angular/core";
import { ContextMenuService } from "../../../../shared/menu/context-menu/context-menu.service";
import { ContextMenuAction } from "../../../../shared/menu/context-menu/context-menu.component";
import { LotoPointDto, LotoPointModel } from "../../../../models/loto/loto-point.model";
import { LotoPointClipboardItem } from "../../../../models/loto/loto-point-clipboard.model";
import { RfLotoPointStateService } from "./rf-loto-point-state.service";
import { RfLotoPointApiService } from "./rf-loto-point-api.service";
import { map } from "rxjs";
import { BradyPrinterModalService } from "../../../../shared/brady-printer-manager/brady-printer-modal.service";

@Injectable({
    providedIn: "root"
})
export class LotoPointContextMenuService extends ContextMenuService {
  private stateService = inject(RfLotoPointStateService);
  private apiService = inject(RfLotoPointApiService);
  private bradyModalService = inject(BradyPrinterModalService)

  constructor() {
    super();
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
    if (item?.id) {
      this.stateService.loadItemById(item.id);
      this.stateService.openForm();
    }
  }

  /**
   * Override clipboard handler to fetch full DTO before adding to clipboard
   * Table data is incomplete, so we need to fetch from server to get all fields
   * including nested structures like zeroEnergy
   */
  override handleClipboard(item: any): void {
    if (!item?.id) {
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
      error: () => {
        // Fallback to table data if fetch fails
        super.handleClipboard(item);
      }
    });
  }

    private handleInspect(_item: LotoPointDto): void {
      // Implement inspect logic
    }
  
    private handlePrint(item: LotoPointDto): void {
      this.bradyModalService.openWithData({
        line1: item.tagNumber || '',
        line2: item.description || '',
        withQr: true
      });
    }
  
    private handleRelease(_item: LotoPointDto): void {
      // Implement release logic
    }


}