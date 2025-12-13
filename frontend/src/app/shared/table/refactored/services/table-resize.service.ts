
import { Injectable, signal } from '@angular/core';

export interface ResizeState {
  isResizing: boolean;
  resizingColumnId: string | null;
  startX: number;
  startWidth: number;
}

@Injectable()
export class TableResizeService {
  private resizeState = signal<ResizeState>({
    isResizing: false,
    resizingColumnId: null,
    startX: 0,
    startWidth: 0,
  });

  resizeState$ = this.resizeState.asReadonly();

  startResize(columnId: string, startX: number, currentWidth: number): void {
    this.resizeState.set({
      isResizing: true,
      resizingColumnId: columnId,
      startX,
      startWidth: currentWidth,
    });
  }

  updateResize(currentX: number): number {
    const state = this.resizeState();
    if (!state.isResizing) return state.startWidth;

    const delta = currentX - state.startX;
    const newWidth = Math.max(50, state.startWidth + delta); // Minimum 50px
    return newWidth;
  }

  endResize(): void {
    this.resizeState.set({
      isResizing: false,
      resizingColumnId: null,
      startX: 0,
      startWidth: 0,
    });
  }

  isResizing(): boolean {
    return this.resizeState().isResizing;
  }

  getResizingColumnId(): string | null {
    return this.resizeState().resizingColumnId;
  }
}
