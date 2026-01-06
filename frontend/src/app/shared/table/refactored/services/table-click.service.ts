
import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { TableSelectionService } from './table-selection.service';
import { TableStateService } from './table-state.service';
import { Column } from '../../../../models/column.model';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableDataService } from './table-data.service';

@Injectable()
export class TableClickService {
  private selectionService = inject(TableSelectionService);
  protected stateService = inject(TableStateService);
  private dataService = inject(TableDataService);
  private destroyRef = inject(DestroyRef);
  
  public debugInstanceId = `TableClickService-${Math.random().toString(36).substr(2, 9)}`;

  // Internal state
  private lastClickedCell = signal<{ item: any; column: Column } | null>(null);
  private lastClickedRow = signal<{ item: any; event: MouseEvent } | null>(null);
  private singleClickTimeout: any = null;
  private doubleClickWindow = 300; // ms
  private isProcessingDoubleClick = false;

  allItems = signal<any[]>([]);
  hoverDebounceTime = signal<number>(300); // ms

  private hoverSubject = new Subject<any>();
  hoveredRow = this.dataService.hoveredRow;
  hoveredCell = signal<{ item: any; column: Column } | null>(null);

  constructor() {
    this.setupHoverHandlers();
  }

  private setupHoverHandlers(): void {
    this.hoverSubject
      .pipe(
        debounceTime(this.hoverDebounceTime()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((item) => {
        this.hoveredRow.set(item);
      });
  }

  onDestroy(): void {
    this.hoverSubject.complete();
    if (this.singleClickTimeout) {
      clearTimeout(this.singleClickTimeout);
    }
  }

  /**
   * Register a cell click to track context for middle/right clicks
   */
  registerCellClick(item: any, column: Column, event: MouseEvent): void {
    this.lastClickedCell.set({ item, column });
  }

  /**
   * Handle row click - delegates to single/double click logic
   */
  onRowClick(item: any, event: MouseEvent): void {
    event.preventDefault();

    if (this.singleClickTimeout) {
      clearTimeout(this.singleClickTimeout);
      this.singleClickTimeout = null;
      if(this.stateService.tableMode()==='row') this.handleRowDoubleClick(item, event);
      else if(this.stateService.tableMode()==='cell') this.handleCellDoubleClick(item, this.lastClickedCell()?.column!);
      return;
    }

    this.singleClickTimeout = setTimeout(() => {
      this.singleClickTimeout = null;
      if(this.stateService.tableMode()==='row') this.handleRowLeftClick(item, event);
      else this.handleCellClick(item, this.lastClickedCell()?.column!);
    }, this.doubleClickWindow);
  }

  /**
   * Handle row double click
   */
  onRowDoubleClick(item: any, event: MouseEvent): void {
    event.preventDefault();
    if (this.isProcessingDoubleClick) {
      return;
    }

    this.isProcessingDoubleClick = true;
    setTimeout(() => {
      this.isProcessingDoubleClick = false;
    }, 600);

    this.handleRowDoubleClick(item, event);
  }

  /**
   * Handle row right click
   */
  onRowRightClick(item: any, event: MouseEvent): void {
    event.preventDefault();
    this.handleRowRightClick(item, event);
  }

  /**
   * Handle row middle click
   */
  onRowMiddleClick(item: any, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.handleRowMiddleClick(item, event);
  }

  /**
   * Handle cell click
   */
  onCellClick(item: any, column: Column, event: MouseEvent): void {
    this.registerCellClick(item, column, event);
    this.handleCellClick(item, column);
  }

  /**
   * Handle cell double click
   */
  onCellDoubleClick(item: any, column: Column): void {
    this.handleCellDoubleClick(item, column);
  }

  /**
   * Handle cell right click
   */
  onCellRightClick(item: any, column: Column, event: MouseEvent): void {
    this.registerCellClick(item, column, event);
    this.handleCellRightClick(item, column);
  }

  /**
   * Handle cell middle click
   */
  onCellMiddleClick(item: any, column: Column): void {
    this.handleCellMiddleClick(item, column);
  }

  /**
   * Normalize item by finding it in this.allItems() array
   */
  protected normalizeItem(item: any): any {
    return this.allItems().find((i) => i.id === item.id) || item;
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectionService.clearSelection();
  }

  // ==================== OVERRIDABLE HANDLERS ====================
  // Override these methods in subclasses for custom behavior

  /**
   * Default row left click handler - OVERRIDE in subclasses
   */
    protected handleRowLeftClick(item: any, event: MouseEvent): void {
      const normalizedItem = this.normalizeItem(item);

      if (event.ctrlKey) {
        this.selectionService.toggleItem(normalizedItem);
      } else if (event.shiftKey) {
        const lastItem = this.lastClickedRow()?.item;
        if (!lastItem) {
          this.selectionService.selectItem(normalizedItem);
        } else {
          this.selectionService.selectRange(this.allItems(), lastItem, normalizedItem);
        }
      } else {
        // Clear previous selection and select the clicked item
        this.selectionService.clearSelection();
        if (this.stateService.tableMode() === 'cell' && this.lastClickedCell()) {
          // Cell mode - handled by cellClicked
        } else {
          this.selectionService.selectItem(normalizedItem);
          this.lastClickedRow.set({ item: normalizedItem, event });
        }
      }
    }

  /**
   * Default row double click handler - OVERRIDE in subclasses
   */
  protected handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);

    if (this.stateService.tableMode() === 'cell') {
      const lastCell = this.lastClickedCell();
      if (!lastCell) {
        console.warn('Cell mode active but no cell was clicked');
      }
    }

    // Emit double-click event through data service
    this.dataService.rowDoubleClicked.set(normalizedItem);
  }

  /**
   * Default row right click handler - OVERRIDE in subclasses
   */
  protected handleRowRightClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);

    if (this.stateService.tableMode() === 'cell') {
      const lastCell = this.lastClickedCell();
      if (!lastCell) {
        console.warn('Cell mode active but no cell was clicked');
      }
    }
  }

  /**
   * Default row middle click handler - OVERRIDE in subclasses
   */
  protected handleRowMiddleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);
  }

  /**
   * Default cell click handler - OVERRIDE in subclasses
   */
  protected handleCellClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item);
  }

  /**
   * Default cell double click handler - OVERRIDE in subclasses
   */
  protected handleCellDoubleClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item);
  }

  /**
   * Default cell right click handler - OVERRIDE in subclasses
   */
  protected handleCellRightClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item);
  }

  /**
   * Default cell middle click handler - OVERRIDE in subclasses
   */
  protected handleCellMiddleClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item);
  }

  // ==================== HOVER HANDLERS ====================

  /**
   * Handle cell hover
   */
  onCellHover(item: any, column: Column): void {
    if (this.stateService.tableMode() !== 'cell') return;
    this.hoveredCell.set({ item, column });
  }

  /**
   * Handle cell leave
   */
  onCellLeave(): void {
    this.hoveredCell.set(null);
  }

  /**
   * Check if cell should be highlighted
   */
  isCellHighlighted(item: any, column: Column): boolean {
    const hovered = this.hoveredCell();
    return (
      hovered !== null &&
      hovered.item.id === item.id &&
      hovered.column.id === column.id
    );
  }

  /**
   * Get cell style with hover highlight
   */
  getCellStyleWithHover(item: any, column: Column): { [key: string]: string } {
    let style: { [key: string]: string } = {};

    if (column.conditionalStyling) {
      style = column.conditionalStyling(item, column);
    }

    if (this.isCellHighlighted(item, column)) {
      return {
        ...style,
        'box-shadow': 'inset 0 0 4px rgba(33, 150, 243, 0.3)',
        outline: '2px solid rgba(33, 150, 243, 0.5)',
      };
    }

    return style;
  }

  /**
   * Handle row hover
   */
  onRowHover(item: any): void {
    this.hoverSubject.next(item);
  }

  /**
   * Handle row leave
   */
  onRowLeave(): void {
    this.hoverSubject.next(null);
  }
}