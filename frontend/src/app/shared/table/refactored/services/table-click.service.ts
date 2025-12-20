
import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { TableSelectionService } from './table-selection.service';
import { TableStateService } from './table-state.service';
import { Column } from '../../../../models/column.model';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class TableClickService {
  private selectionService = inject(TableSelectionService);
  protected stateService = inject(TableStateService);
  private destroyRef = inject(DestroyRef);

  // Internal state
  private lastClickedCell = signal<{ item: any; column: Column } | null>(null);
  private lastClickedRow = signal<{ item: any; event: MouseEvent } | null>(null);
  private singleClickTimeout: any = null;
  private doubleClickWindow = 300; // ms
  private isProcessingDoubleClick = false;

  allItems = signal<any[]>([]);
  hoverDebounceTime = signal<number>(300); // ms

  private hoverSubject = new Subject<any>();
  hoveredRow = signal<any | null>(null);
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
      console.log('Single click cancelled - double click detected');
      this.handleRowDoubleClick(item, event);
      return;
    }

    this.singleClickTimeout = setTimeout(() => {
      this.singleClickTimeout = null;
      console.log('Single click executed');
      this.handleRowLeftClick(item, event);
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
    console.log('🔴 Default: Single click detected on item:', normalizedItem);

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
      this.selectionService.clearSelection();
      if (this.stateService.tableMode() === 'cell' && this.lastClickedCell()) {
        // Cell mode - handled by cellClicked
      } else {
        this.lastClickedRow.set({ item: normalizedItem, event });
      }
    }
  }
  
public debugInstanceId = `TableClickService-${Math.random().toString(36).substr(2, 9)}`;
  /**
   * Default row double click handler - OVERRIDE in subclasses
   */
  protected handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);
    console.log('🟢 Default: Double click detected on item:', normalizedItem);
    console.log(`🆔 [${this.debugInstanceId}] Base double click:`, item);

    if (this.stateService.tableMode() === 'cell') {
      const lastCell = this.lastClickedCell();
      if (!lastCell) {
        console.warn('Cell mode active but no cell was clicked');
      }
    }
  }

  /**
   * Default row right click handler - OVERRIDE in subclasses
   */
  protected handleRowRightClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);
    console.log('🔵 Default: Right click detected on item:', normalizedItem);

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
    console.log('🟡 Default: Middle click detected on item:', normalizedItem);
  }

  /**
   * Default cell click handler - OVERRIDE in subclasses
   */
  protected handleCellClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item);
    console.log('Default: Cell clicked -', normalizedItem, column);
  }

  /**
   * Default cell double click handler - OVERRIDE in subclasses
   */
  protected handleCellDoubleClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item);
    console.log('Default: Cell double clicked -', normalizedItem, column);
  }

  /**
   * Default cell right click handler - OVERRIDE in subclasses
   */
  protected handleCellRightClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item);
    console.log('Default: Cell right clicked -', normalizedItem, column);
  }

  /**
   * Default cell middle click handler - OVERRIDE in subclasses
   */
  protected handleCellMiddleClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item);
    console.log('Default: Cell middle clicked -', normalizedItem, column);
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
}

// import { inject, Injectable, signal, effect, DestroyRef, computed } from '@angular/core';
// import { TableSelectionService } from './table-selection.service';
// import { TableStateService } from './table-state.service';
// import { Column } from '../../../../models/column.model';
// import { debounceTime, Subject } from 'rxjs';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// @Injectable()
// export class TableClickService {
//   private selectionService = inject(TableSelectionService);
//   private stateService = inject(TableStateService);
//   private destroyRef = inject(DestroyRef);

//   // Output signals - component subscribes to these
//   rowLeftClicked = signal<{ item: any; event: MouseEvent } | null>(null);
//   // rowDoubleClicked = signal<any>(null);  
//   private _rowDoubleClicked = signal<{item: any, event?: MouseEvent} | null>(null);
//   rowDoubleClicked = computed(() => this._rowDoubleClicked());

//   rowRightClicked = signal<{ item: any; event: MouseEvent } | null>(null);
//   rowMiddleClicked = signal<{ item: any; event: MouseEvent } | null>(null);
  
//   cellClicked = signal<{ item: any; column: Column } | null>(null);
//   cellDoubleClicked = signal<{ item: any; column: Column } | null>(null);
//   cellRightClicked = signal<{ item: any; column: Column } | null>(null);
//   cellMiddleClicked = signal<{ item: any; column: Column } | null>(null);

//   // Internal state
//   private lastClickedCell = signal<{ item: any; column: Column } | null>(null);
//   private lastClickedRow = signal<{ item: any; event: MouseEvent } | null>(null);
//   private singleClickTimeout: any = null;
//   private doubleClickWindow = 300; // ms
//   private isProcessingDoubleClick = false;

//   allItems = signal<any[]>([]);
//   hoverDebounceTime = signal<number>(300); // ms

//   private hoverSubject = new Subject<any>();
//   hoveredRow = signal<any | null>(null);
//   hoveredCell = signal<{ item: any; column: Column } | null>(null);

//   constructor() {
//     this.setupHoverHandlers();
//   }

//   private setupHoverHandlers(): void {
//     this.hoverSubject
//       .pipe(
//         debounceTime(this.hoverDebounceTime()),
//         takeUntilDestroyed(this.destroyRef)
//       )
//       .subscribe((item) => {
//         this.hoveredRow.set(item);
//       });
//   }

//   onDestroy(): void {
//     this.hoverSubject.complete();
//     // Clean up any pending timeouts
//     if (this.singleClickTimeout) {
//       clearTimeout(this.singleClickTimeout);
//     }
//   }



//   /**
//    * Register a cell click to track context for middle/right clicks
//    */
//   registerCellClick(item: any, column: Column, event: MouseEvent): void {
//     this.lastClickedCell.set({ item, column });
//   }

//   /**
//    * Handle row click - delegates to single/double click logic
//    */
//   onRowClick(item: any, event: MouseEvent): void {
//     event.preventDefault();

//     // Cancel any pending single click
//     if (this.singleClickTimeout) {
//       clearTimeout(this.singleClickTimeout);
//       this.singleClickTimeout = null;
//       console.log('Single click cancelled - double click detected');
//       this.handleRowDoubleClick(item, event);
//       return;
//     }

//     // Schedule single click
//     this.singleClickTimeout = setTimeout(() => {
//       this.singleClickTimeout = null;
//       console.log('Single click executed');
//       this.handleRowSingleClick(item, event);
//     }, this.doubleClickWindow);
//   }

//   /**
//    * Handle single row click logic
//    */
//   private handleRowSingleClick(item: any, event: MouseEvent): void {
//     const normalizedItem = this.normalizeItem(item);
//     console.log('🔴 Single click detected on item:', item);

//     if (event.ctrlKey) {
//       this.selectionService.toggleItem(normalizedItem);
//       console.log('Selected items in control mode:', this.selectionService.selectedItems());
//     } else if (event.shiftKey) {
//       const lastItem = this.lastClickedRow()?.item;
//       if (!lastItem) {
//         this.selectionService.selectItem(normalizedItem);
//       } else {
//         this.selectionService.selectRange(this.allItems(), lastItem, normalizedItem);
//       }
//     } else {
//       this.selectionService.clearSelection();
//       if (this.stateService.tableMode() === 'cell' && this.lastClickedCell()) {
//         this.cellClicked.set({
//           item: normalizedItem,
//           column: this.lastClickedCell()!.column,
//         });
//       } else {
//         this.rowLeftClicked.set({ item: normalizedItem, event });
//         this.lastClickedRow.set({ item: normalizedItem, event });
//         console.log('Row clicked item:', normalizedItem);
//       }
//     }
//   }

//   /**
//    * Handle row double click
//    */
//   onRowDoubleClick(item: any, event: MouseEvent): void {
//     event.preventDefault();
//     this.handleRowDoubleClick(item, event);
//   }

//   private handleRowDoubleClick(item: any, event: MouseEvent): void {
//     if (this.isProcessingDoubleClick) {
//       return;
//     }

//     this.isProcessingDoubleClick = true;
//     setTimeout(() => {
//       this.isProcessingDoubleClick = false;
//     }, 600);

//     const normalizedItem = this.normalizeItem(item);

//     if (this.stateService.tableMode() === 'cell') {
//       const lastCell = this.lastClickedCell();
//       if (!lastCell) {
//         console.warn('Cell mode active but no cell was clicked');
//       }
//       this.cellDoubleClicked.set({
//         item: normalizedItem,
//         column: lastCell?.column || ({ id: 'unknown' } as Column),
//       });
//     } else {
//       this._rowDoubleClicked.set({item: normalizedItem, event});
//     }
//   }

//   /**
//    * Handle row right click
//    */
//   onRowRightClick(item: any, event: MouseEvent): void {
//     event.preventDefault();
//     const normalizedItem = this.normalizeItem(item);

//     if (this.stateService.tableMode() === 'cell') {
//       const lastCell = this.lastClickedCell();
//       if (lastCell) {
//         this.cellRightClicked.set({
//           item: normalizedItem,
//           column: lastCell.column,
//         });
//       } else {
//         console.warn('Cell mode active but no cell was clicked');
//         this.rowRightClicked.set({ item: normalizedItem, event });
//       }
//     } else {
//       this.rowRightClicked.set({ item: normalizedItem, event });
//     }
//   }

//   /**
//    * Handle row middle click
//    */
//   onRowMiddleClick(item: any, event: MouseEvent): void {
//     event.preventDefault();
//     event.stopPropagation();

//     const normalizedItem = this.normalizeItem(item);
//     console.log('Middle click detected');

//     if (this.stateService.tableMode() === 'cell') {
//       const lastCell = this.lastClickedCell();
//       if (lastCell) {
//         this.cellMiddleClicked.set({
//           item: normalizedItem,
//           column: lastCell.column,
//         });
//       }
//     } else {
//       this.rowMiddleClicked.set({ item: normalizedItem, event });
//     }
//   }

//   /**
//    * Handle cell click
//    */
//   onCellClick(item: any, column: Column, event: MouseEvent): void {
//     const normalizedItem = this.normalizeItem(item);
//     this.registerCellClick(normalizedItem, column, event);
//     this.cellClicked.set({ item: normalizedItem, column });
//   }

//   /**
//    * Handle cell double click
//    */
//   onCellDoubleClick(item: any, column: Column): void {
//     const normalizedItem = this.normalizeItem(item);
//     this.cellDoubleClicked.set({ item: normalizedItem, column });
//   }

//   /**
//    * Handle cell right click
//    */
//   onCellRightClick(item: any, column: Column, event: MouseEvent): void {
//     const normalizedItem = this.normalizeItem(item);
//     this.registerCellClick(normalizedItem, column, event);
//     this.cellRightClicked.set({ item: normalizedItem, column });
//   }

//   /**
//    * Handle cell middle click
//    */
//   onCellMiddleClick(item: any, column: Column): void {
//     const normalizedItem = this.normalizeItem(item);
//     this.cellMiddleClicked.set({ item: normalizedItem, column });
//   }

//   /**
//    * Normalize item by finding it in this.allItems() array
//    */
//   private normalizeItem(item: any): any {
//     return this.allItems().find((i) => i.id === item.id) || item;
//   }

//   /**
//    * Clear selection
//    */
//   clearSelection(): void {
//     this.selectionService.clearSelection();
//   }



//   // Add method to handle cell hover
//   onCellHover(item: any, column: Column): void {
//     if (this.stateService.tableMode() !== 'cell') return;
//     this.hoveredCell.set({ item, column });
//   }

//   // Add method to handle cell leave
//   onCellLeave(): void {
//     this.hoveredCell.set(null);
//   }

//   // Add method to check if cell should be highlighted
//   isCellHighlighted(item: any, column: Column): boolean {
//     const hovered = this.hoveredCell();
//     return (
//       hovered !== null &&
//       hovered.item.id === item.id &&
//       hovered.column.id === column.id
//     );
//   }

//   // Add method to get cell style with hover highlight
//   getCellStyleWithHover(item: any, column: Column): { [key: string]: string } {
//     // Get base conditional styling
//     let style: { [key: string]: string } = {};

//     if (column.conditionalStyling) {
//       style = column.conditionalStyling(item, column);
//     }

//     // Add hover styling on top
//     if (this.isCellHighlighted(item, column)) {
//       return {
//         ...style,
//         'box-shadow': 'inset 0 0 4px rgba(33, 150, 243, 0.3)',
//         outline: '2px solid rgba(33, 150, 243, 0.5)',
//       };
//     }

//     return style;
//   }

//   onRowHover(item: any): void {
//     this.hoverSubject.next(item);
//   }
// }




// import { Injectable } from '@angular/core';
// import { Subject, debounceTime, filter } from 'rxjs';
// import { ClickState } from '../models/table.types';

// @Injectable({
//   providedIn: 'root'
// })
// export class TableClickService {
//   private clickState: ClickState = {
//     lastClickTime: 0,
//     isDoubleClickHandled: false
//   };

//   private clickSubject = new Subject<MouseEvent>();
//   private doubleClickSubject = new Subject<MouseEvent>();
//   private singleClickSubject = new Subject<MouseEvent>();

//   doubleClick$ = this.doubleClickSubject.asObservable();
//   singleClick$ = this.singleClickSubject.asObservable();

//   constructor() {
//     this.initializeClickDetection();
//   }

//   private initializeClickDetection(): void {
//     this.clickSubject.pipe(
//       debounceTime(300)
//     ).subscribe(event => {
//       if (!this.clickState.isDoubleClickHandled) {
//         this.singleClickSubject.next(event);
//       }
//       this.clickState.isDoubleClickHandled = false;
//     });
//   }

//   handleClick(event: MouseEvent): void {
//     const currentTime = Date.now();
//     const timeSinceLastClick = currentTime - this.clickState.lastClickTime;

//     if (timeSinceLastClick < 300 && !this.clickState.isDoubleClickHandled) {
//       this.clickState.isDoubleClickHandled = true;
//       this.doubleClickSubject.next(event);
//     } else {
//       this.clickState.lastClickTime = currentTime;
//       this.clickSubject.next(event);
//     }
//   }

//   isDoubleClickHandled(): boolean {
//     return this.clickState.isDoubleClickHandled;
//   }

//   reset(): void {
//     this.clickState = {
//       lastClickTime: 0,
//       isDoubleClickHandled: false
//     };
//   }
// }
