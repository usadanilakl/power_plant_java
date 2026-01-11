import { inject, Injectable } from "@angular/core";
import { LotoPointContextMenuService } from "../../../../../loto-points/refactored/services/loto-point-context-menu.service";
import { LotoBuilderStateService } from "../../services/loto-builder-state.service";
import { RfLotoPointApiService } from "../../../../../loto-points/refactored/services/rf-loto-point-api.service";
import { LotoPointDto } from "../../../../../../models/loto/loto-point.model";
import { ContextMenuAction } from "../../../../../../shared/menu/context-menu/context-menu.component";

/**
 * Custom context menu service for LOTO point table in LOTO builder.
 * Opens the builder's form popup instead of the standard form.
 */
@Injectable()
export class LotoBuilderLotoPointContextMenuService extends LotoPointContextMenuService {
  private builderState = inject(LotoBuilderStateService);
  private lotoPointApiService = inject(RfLotoPointApiService);

  constructor() {
    super();
    // Rebuild actions to ensure overridden methods are used
    this.contextMenuActions = this.buildBuilderContextMenuActions();
  }

  /**
   * Build context menu actions with proper binding to this class's methods
   */
  private buildBuilderContextMenuActions(): ContextMenuAction[] {
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
    ];
  }

  /**
   * Override to open builder's form popup instead of standard form
   */
  override handleViewDetails(item: any): void {
    if (!item?.id) {
      return;
    }

    // Fetch full LOTO point data from server
    this.lotoPointApiService.getLotoPointById(item.id.toString()).subscribe({
      next: (response) => {
        const fullLotoPoint = LotoPointDto.fromJson(response.responseData);
        // Open the builder's form popup with the full LOTO point data
        this.builderState.openLotoPointForm(fullLotoPoint);
      },
      error: (error) => {
        console.error('[LotoBuilderContextMenu] Error fetching LOTO point:', error);
        // Fall back to opening with partial data
        const partialLotoPoint = item instanceof LotoPointDto ? item : new LotoPointDto(item);
        this.builderState.openLotoPointForm(partialLotoPoint);
      }
    });
  }

  /**
   * Override to use builder's edit functionality
   */
  override handleEdit(item: any): void {
    // Same as view details in the builder context
    this.handleViewDetails(item);
  }
}
