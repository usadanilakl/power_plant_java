import { inject, Injectable, signal } from "@angular/core";
import { DragState } from "../models/table.types";
import { TableDataService } from "./table-data.service";
import { TableSearchService } from "./table-search.service";


@Injectable()
export class TableDragService {
  dataService = inject(TableDataService);
  searchService = inject(TableSearchService);

  dragState = signal<DragState & { startIndex: number | null }>({
    isDragging: false,
    draggedItem: null,
    startPosition: { x: 0, y: 0 },
    ghostRowIndex: null,
    startIndex: null, // Add startIndex to the state
  });

  startDrag(item: any, position: { x: number; y: number }): void {
    // Ensure item has index before dragging
    if (!item.hasOwnProperty('index')) {
      console.warn('Item missing index property during drag start');
    }

    this.dragState.update((state) => ({
      ...state,
      isDragging: true,
      draggedItem: { ...item }, // Create a copy to preserve original state
      startPosition: position,
      ghostRowIndex: item.index, // Initialize ghost row to current position
      startIndex: item.index, // <<< Store the original index here
    }));
  }

  updateGhostRow(rowIndex: number | null): void {
    this.dragState.update((state) => ({
      ...state,
      ghostRowIndex: rowIndex,
    }));
  }
  /**
   * Resets the drag state to its initial values, effectively ending the drag operation.
   * This should be called when the user releases the mouse button after dragging an item.
   */
  endDrag(): void {
    this.dragState.set({
      isDragging: false,
      draggedItem: null,
      startPosition: { x: 0, y: 0 },
      ghostRowIndex: null,
      startIndex: null, // Reset startIndex
    });
  }

  getDragState(): DragState & { startIndex: number | null } {
    return this.dragState();
  }

  // ============ Drag and Drop Methods ============

  onMouseDown(event: MouseEvent, item: any): void {
    if (this.dataService.isDragAndDropEnabled()) {
      // Ensure item has index property before starting drag
      if (!item.hasOwnProperty('index')) {
        const itemIndex = this.dataService.filteredItems.indexOf(item);
        item.index = itemIndex;
      }
      this.startDrag(item, { x: event.clientX, y: event.clientY });
      event.preventDefault();
    }
  }

  onMouseUp(event: MouseEvent): void {
    const dragState = this.getDragState();
    if (dragState.isDragging && dragState.startIndex !== null) {
      const hovered = this.dataService.hoveredRow();
      if (hovered) {
        const toIndex = this.dataService.filteredItems.findIndex(
          (item) => item === hovered
        );
        if (toIndex !== -1) {
          this.moveItem(dragState.startIndex, toIndex);
        } else {
        }
      } else {
      }
    }
    this.endDrag();
  }

  private moveItem(fromIndex: number, toIndex: number): void {
    requestAnimationFrame(() => {
      // Find the actual item from filteredItems
      const movedItem = this.dataService.filteredItems[fromIndex];

      // Find the original index in the master _items array
      const originalFromIndex = this.dataService
        .items()
        .findIndex((i) => i === movedItem);

      // Find the target item in filteredItems to determine where to move in _items
      const targetItem = this.dataService.filteredItems[toIndex];
      const originalToIndex = this.dataService
        .items()
        .findIndex((i) => i === targetItem);

      if (originalFromIndex !== -1 && originalToIndex !== -1) {
        // Perform the move in the master array
        const [itemToMove] = this.dataService
          .items()
          .splice(originalFromIndex, 1);
        this.dataService.items().splice(originalToIndex, 0, itemToMove);

        // Re-apply filtering and sorting to get the new filteredItems
        this.searchService.updateFilteredItems();

        // Emit the reordered master list
        this.dataService.itemsReordered.set([...this.dataService.items()]);
      }
    });
  }

  onDragOver(event: MouseEvent): void {
    event.preventDefault();
  }

  isItemDragged(item: any): boolean {
    const dragState = this.getDragState();
    return dragState.draggedItem?.id === item.id;
  }
}