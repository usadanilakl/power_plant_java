import { Injectable } from "@angular/core";
import { ContextMenuService } from "../../../../shared/menu/context-menu/context-menu.service";
import { ContextMenuAction } from "../../../../shared/menu/context-menu/context-menu.component";
import { LotoPointDto } from "../../../../models/loto/loto-point.model";

@Injectable({
    providedIn: "root"
})
export class LotoPointContextMenuService extends ContextMenuService {

  customMenuActions: ContextMenuAction[] = [
      {
        id:'inspect',
        label: 'Inspect',
        icon: '🔍',
        action: (item) => this.handleInspect(item),
      },
      {
        id: 'divider2',
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
        id: 'divider3',
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
  ]

  override contextMenuActions: ContextMenuAction[] = [
    ...this.contextDefaultMenuActions,
    ...this.customMenuActions,
  ]

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


// import { computed, Injectable, signal } from "@angular/core";
// import { LotoPointDto } from "../../../../models/loto/loto-point.model";
// import { ContextMenuAction } from "./loto-point-context-menu.component";

// @Injectable({
//     providedIn: "root"
// })
// export class LotoPointContextMenuService {
//       // Context menu state
//   contextMenuVisible = signal<boolean>(false);
//   contextMenuPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });
//   contextMenuSelectedItem = signal<LotoPointDto | null>(null);
//   contextMenuActions = computed<ContextMenuAction[]>(() => {
//     return [
//       {
//         id: 'view',
//         label: 'View Details',
//         icon: '👁️',
//         action: (item) => this.handleViewDetails(item),
//       },
//       {
//         id: 'edit',
//         label: 'Edit',
//         icon: '✏️',
//         action: (item) => this.handleEdit(item),
//       },
//       {
//         id: 'duplicate',
//         label: 'Duplicate',
//         icon: '📋',
//         action: (item) => this.handleDuplicate(item),
//       },
//       {
//         id: 'divider1',
//         label: '',
//         divider: true,
//         action: () => {},
//       },
//       {
//         id: 'verify',
//         label: 'Mark as Verified',
//         icon: '✓',
//         disabled: computed(() => this.contextMenuSelectedItem()?.isVerified ?? false)(),
//         action: (item) => this.handleVerify(item),
//       },
//       {
//         id: 'divider2',
//         label: '',
//         divider: true,
//         action: () => {},
//       },
//       {
//         id: 'delete',
//         label: 'Delete',
//         icon: '🗑️',
//         action: (item) => this.handleDelete(item),
//       },
//     ];
//   });

//   /**
//    * Context menu action handlers
//    */
//   private handleViewDetails(item: LotoPointDto): void {
//     console.log('Viewing details for:', item);
//     // Implement view details logic
//   }

//   private handleEdit(item: LotoPointDto): void {
//     console.log('Editing:', item);
//     // Implement edit logic
//   }

//   private handleDuplicate(item: LotoPointDto): void {
//     console.log('Duplicating:', item);
//     // Implement duplicate logic
//   }

//   private handleVerify(item: LotoPointDto): void {
//     console.log('Verifying:', item);
//     // Implement verify logic
//   }

//   private handleDelete(item: LotoPointDto): void {
//     console.log('Deleting:', item);
//     // Implement delete logic
//   }

//   /**
//    * Show context menu at specified position
//    */
//   showContextMenu(item: LotoPointDto, event?: MouseEvent): void {
//     if (event) {
//       this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
//       event.preventDefault();
//       event.stopPropagation();
//     }
//     this.contextMenuSelectedItem.set(item);
//     this.contextMenuVisible.set(true);
//   }

//   /**
//    * Close context menu
//    */
//   closeContextMenu(): void {
//     this.contextMenuVisible.set(false);
//     this.contextMenuSelectedItem.set(null);
//   }

  
//   positionContextMenu(event: MouseEvent, menuWidth: number = 200, menuHeight: number = 300): void {
//     let x = event.clientX;
//     let y = event.clientY;
  
//     // Get viewport dimensions
//     const viewportWidth = window.innerWidth;
//     const viewportHeight = window.innerHeight;
  
//     // Add padding to prevent menu from touching edges
//     const padding = 10;
  
//     // Check if menu would overflow on the right
//     if (x + menuWidth + padding > viewportWidth) {
//       x = viewportWidth - menuWidth - padding;
//     }
  
//     // Check if menu would overflow on the bottom
//     if (y + menuHeight + padding > viewportHeight) {
//       y = viewportHeight - menuHeight - padding;
//     }
  
//     // Ensure menu doesn't go off-screen on the left or top
//     x = Math.max(padding, x);
//     y = Math.max(padding, y);
  
//     this.contextMenuPosition.set({ x, y });
//   }
// }