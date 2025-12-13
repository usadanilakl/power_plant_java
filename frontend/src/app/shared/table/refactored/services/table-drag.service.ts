
import { Injectable, signal } from '@angular/core';
import { DragState } from '../models/table.types';

@Injectable({
  providedIn: 'root'
})
export class TableDragService {
  private dragState = signal<DragState>({
    isDragging: false,
    draggedItem: null,
    startPosition: { x: 0, y: 0 },
    ghostRowIndex: null
  });

  dragState$ = this.dragState.asReadonly();

  startDrag(item: any, position: { x: number; y: number }): void {
    this.dragState.update(state => ({
      ...state,
      isDragging: true,
      draggedItem: item,
      startPosition: position
    }));
  }

  updateGhostRow(rowIndex: number | null): void {
    this.dragState.update(state => ({
      ...state,
      ghostRowIndex: rowIndex
    }));
  }

  endDrag(): void {
    this.dragState.set({
      isDragging: false,
      draggedItem: null,
      startPosition: { x: 0, y: 0 },
      ghostRowIndex: null
    });
  }

  getDragState(): DragState {
    return this.dragState();
  }
}
