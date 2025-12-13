import { Injectable, signal } from "@angular/core";
import { DragState } from "../models/table.types";


@Injectable({
  providedIn: 'root'
})
export class TableDragService {
  private dragState = signal<DragState & { startIndex: number | null }>({
    isDragging: false,
    draggedItem: null,
    startPosition: { x: 0, y: 0 },
    ghostRowIndex: null,
    startIndex: null // Add startIndex to the state
  });

  // Note: We don't expose startIndex in the public-facing type if not needed elsewhere
  dragState$ = this.dragState.asReadonly();

  startDrag(item: any, position: { x: number; y: number }): void {
    // Ensure item has index before dragging
    if (!item.hasOwnProperty('index')) {
      console.warn('Item missing index property during drag start');
    }
    
    this.dragState.update(state => ({
      ...state,
      isDragging: true,
      draggedItem: { ...item }, // Create a copy to preserve original state
      startPosition: position,
      ghostRowIndex: item.index, // Initialize ghost row to current position
      startIndex: item.index // <<< Store the original index here
    }));
  }

  updateGhostRow(rowIndex: number | null): void {
    this.dragState.update(state => ({
      ...state,
      ghostRowIndex: rowIndex
    }));
    console.log('Updated ghost row:', rowIndex);
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
      startIndex: null // Reset startIndex
    });
  }

  getDragState(): DragState & { startIndex: number | null } {
    return this.dragState();
  }
}