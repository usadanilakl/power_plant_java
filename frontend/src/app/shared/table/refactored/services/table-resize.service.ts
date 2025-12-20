
import { DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { TableDataService } from './table-data.service';
import { TableSyncService } from './table-sync.service';
import { isPlatformBrowser } from '@angular/common';

export interface ResizeState {
  isResizing: boolean;
  resizingColumnId: string | null;
  startX: number;
  startWidth: number;
}

@Injectable( )
export class TableResizeService {
  dataService = inject(TableDataService);
  syncService = inject(TableSyncService);
  destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  private resizeState = signal<ResizeState>({
    isResizing: false,
    resizingColumnId: null,
    startX: 0,
    startWidth: 0,
  });
  private columnWidths = new Map<string, number>();
  private resizeMouseMoveListener: ((e: MouseEvent) => void) | null = null;
  private resizeMouseUpListener: (() => void) | null = null;

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

  // ============ Resize Methods ============//

  setupResizeListeners(): void {
    this.resizeMouseMoveListener = (e: MouseEvent) => this.onResizeMouseMove(e);
    this.resizeMouseUpListener = () => this.onResizeMouseUp();

    document.addEventListener('mousemove', this.resizeMouseMoveListener);
    document.addEventListener('mouseup', this.resizeMouseUpListener);

    this.destroyRef.onDestroy(() => {
      if (this.resizeMouseMoveListener) {
        document.removeEventListener('mousemove', this.resizeMouseMoveListener);
      }
      if (this.resizeMouseUpListener) {
        document.removeEventListener('mouseup', this.resizeMouseUpListener);
      }
    });
  }

  onResizeStart(
    event: MouseEvent,
    columnId: string,
    currentWidth: number
  ): void {
    if (!isPlatformBrowser(this.platformId)) return;

    event.preventDefault();
    event.stopPropagation();

    this.startResize(columnId, event.clientX, currentWidth);
  }

  private onResizeMouseMove(event: MouseEvent): void {
    if (!this.isResizing()) return;

    const newWidth = this.updateResize(event.clientX);
    const columnId = this.getResizingColumnId();

    if (columnId) {
      this.columnWidths.set(columnId, newWidth);
      this.updateColumnWidth(columnId, newWidth);
      // Sync widths immediately during resize
      this.syncService.synchronizeColumnWidths();
    }
  }

  private onResizeMouseUp(): void {
    if (this.isResizing()) {
      this.endResize();
      this.syncService.synchronizeColumnWidths();
    }
  }

  private updateColumnWidth(columnId: string, width: number): void {
    const column = this.dataService.columns().find((col) => col.id === columnId);
    if (column) {
      column.width = width;
    }
  }

  getColumnWidth(columnId: string): number {
    return (
      this.columnWidths.get(columnId) ||
      this.dataService.columns().find((col) => col.id === columnId)?.width ||
      120
    );
  }
}
