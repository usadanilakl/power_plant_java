import { computed, inject, Injectable, signal } from "@angular/core";
import { ContextMenuAction } from "./context-menu.component";
import { ClipboardService } from "../../clipboard/clipboard.service";

@Injectable({
    providedIn: "root"
})
export class ContextMenuService {

  protected clibpoardService = inject(ClipboardService);
      // Context menu state
  contextMenuVisible = signal<boolean>(false);
  contextMenuPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  contextMenuSelectedItem = signal<any | null>(null);
  contextDefaultMenuActions: ContextMenuAction[] =[
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
        disabled: computed(() => this.contextMenuSelectedItem()?.isVerified ?? false)(),
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
    ]

    contextMenuActions = this.contextDefaultMenuActions;

  /**
   * Context menu action handlers
   */
  private handleViewDetails(item: any): void {
    console.log('Viewing details for:', item);
    // Implement view details logic
  }

  private handleEdit(item: any): void {
    console.log('Editing:', item);
    // Implement edit logic
  }

  private handleClipboard(item: any): void {
    this.clibpoardService.addItem(item);
  }

  private handleVerify(item: any): void {
    console.log('Verifying:', item);
    // Implement verify logic
  }

  private handleDelete(item: any): void {
    console.log('Deleting:', item);
    // Implement delete logic
  }

  /**
   * Show context menu at specified position
   */
  showContextMenu(item: any, event?: MouseEvent): void {
    if (event) {
      this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
      event.preventDefault();
      event.stopPropagation();
    }
    this.contextMenuSelectedItem.set(item);
    this.contextMenuVisible.set(true);
  }

  /**
   * Close context menu
   */
  closeContextMenu(): void {
    this.contextMenuVisible.set(false);
    this.contextMenuSelectedItem.set(null);
  }

  
  positionContextMenu(event: MouseEvent, menuWidth: number = 200, menuHeight: number = 300): void {
    let x = event.clientX;
    let y = event.clientY;
  
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
  
    // Add padding to prevent menu from touching edges
    const padding = 10;
  
    // Check if menu would overflow on the right
    if (x + menuWidth + padding > viewportWidth) {
      x = viewportWidth - menuWidth - padding;
    }
  
    // Check if menu would overflow on the bottom
    if (y + menuHeight + padding > viewportHeight) {
      y = viewportHeight - menuHeight - padding;
    }
  
    // Ensure menu doesn't go off-screen on the left or top
    x = Math.max(padding, x);
    y = Math.max(padding, y);
  
    this.contextMenuPosition.set({ x, y });
  }
}