import { computed, inject, Injectable, signal } from "@angular/core";
import { DragState } from "../models/table.types";
import { TableDataService } from "./table-data.service";
import { TableSearchService } from "./table-search.service";
import { TableSelectionService } from "./table-selection.service";


@Injectable()
export class TableDragService {
  dataService = inject(TableDataService);
  searchService = inject(TableSearchService);
  private selectionService = inject(TableSelectionService);

  /**
   * Pointer travel (px) a mousedown→mouseup pair must exceed before it counts
   * as a drag. Without it every plain row click ends as a zero-distance "drop"
   * on the row it started from and emits a reorder — which downstream tables
   * turn into a server call (see the LOTO standard's points tab).
   */
  private static readonly DRAG_THRESHOLD_PX = 5;

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

  /** Drag-to-reorder is live only on an ordered table the user may re-order. */
  isReorderEnabled(): boolean {
    return this.dataService.isDragAndDropEnabled() && this.dataService.isReorderAllowed();
  }

  onMouseDown(event: MouseEvent, item: any): void {
    // Sequence mode owns the pointer: a drag started here would fight the
    // click that is supposed to record a position.
    if (this.sequenceMode()) return;
    if (this.isReorderEnabled()) {
      // Ensure item has index property before starting drag
      if (!item.hasOwnProperty('index')) {
        const itemIndex = this.dataService.filteredItems().indexOf(item);
        item.index = itemIndex;
      }
      this.startDrag(item, { x: event.clientX, y: event.clientY });
      event.preventDefault();
    }
  }

  onMouseUp(event: MouseEvent): void {
    const dragState = this.getDragState();
    if (
      dragState.isDragging &&
      dragState.startIndex !== null &&
      this.pointerMoved(event, dragState.startPosition)
    ) {
      const hovered = this.dataService.hoveredRow();
      if (hovered) {
        // Grabbing one row of a multi-row selection drags the whole selection.
        if (this.isDraggingSelectionBlock()) {
          this.moveSelectionTo(hovered);
        } else {
          const toIndex = this.dataService.filteredItems().findIndex(
            (item) => item === hovered
          );
          // Dropping a row back onto itself is not a reorder — stay silent so
          // no downstream reorder handler (and no server call) is triggered.
          if (toIndex !== -1 && toIndex !== dragState.startIndex) {
            this.moveItem(dragState.startIndex, toIndex);
          }
        }
      }
    }
    this.endDrag();
  }

  /** True when the pointer travelled far enough for this to be a drag, not a click. */
  private pointerMoved(event: MouseEvent, start: { x: number; y: number }): boolean {
    return (
      Math.abs(event.clientX - start.x) >= TableDragService.DRAG_THRESHOLD_PX ||
      Math.abs(event.clientY - start.y) >= TableDragService.DRAG_THRESHOLD_PX
    );
  }

  private moveItem(fromIndex: number, toIndex: number): void {
    requestAnimationFrame(() => {
      // Find the actual item from filteredItems
      const movedItem = this.dataService.filteredItems()[fromIndex];
      // Find the target item in filteredItems to determine where to move in _items
      const targetItem = this.dataService.filteredItems()[toIndex];

      // Work on a copy: items() is the very array the parent passed in via
      // [items], so splicing it in place would silently rewrite the caller's
      // model (and leave the owner with no pre-drag order to roll back to).
      const reordered = [...this.dataService.items()];
      const originalFromIndex = reordered.findIndex((i) => i === movedItem);
      const originalToIndex = reordered.findIndex((i) => i === targetItem);

      // Same slot in the master array => the order is unchanged; emitting here
      // would report a reorder that never happened.
      if (originalFromIndex !== -1 && originalToIndex !== -1 && originalFromIndex !== originalToIndex) {
        // Perform the move in the master array
        const [itemToMove] = reordered.splice(originalFromIndex, 1);
        reordered.splice(originalToIndex, 0, itemToMove);
        this.commitOrder(reordered);
      }
    });
  }

  onDragOver(event: MouseEvent): void {
    event.preventDefault();
  }

  isItemDragged(item: any): boolean {
    const dragState = this.getDragState();
    if (!dragState.isDragging) return false;
    // In a block drag every member of the selection travels, so all of them
    // read as dragged — otherwise only the grabbed row dims and the move looks
    // like it will apply to that one row.
    if (this.isDraggingSelectionBlock()) return this.selectionService.isItemSelected(item);
    return dragState.draggedItem?.id === item.id;
  }

  // ==========================================================================
  //  Bulk (block) reorder
  //  Drag any row that belongs to a multi-row selection and the whole
  //  selection travels to the drop point, keeping its internal order.
  // ==========================================================================

  /** Rows currently selected, in MASTER-list order (not click order). */
  private selectionBlock(): any[] {
    const ids = new Set(this.selectionService.selectedItems().map((i) => i.id));
    return this.dataService.items().filter((i) => ids.has(i.id));
  }

  /** True when the grabbed row is part of a selection of 2+ rows. */
  isDraggingSelectionBlock(): boolean {
    const dragged = this.getDragState().draggedItem;
    if (!dragged) return false;
    const selected = this.selectionService.selectedItems();
    return selected.length > 1 && selected.some((i) => i.id === dragged.id);
  }

  /**
   * Move every selected row to {@code target}, preserving their order relative
   * to each other. Insertion side matches single-row drag: a block dragged DOWN
   * lands after the target, a block dragged UP lands before it.
   */
  moveSelectionTo(target: any): void {
    const master = this.dataService.items();
    const ids = new Set(this.selectionService.selectedItems().map((i) => i.id));
    if (ids.size === 0 || ids.has(target?.id)) return; // dropped on itself

    const block = master.filter((i) => ids.has(i.id));
    const rest = master.filter((i) => !ids.has(i.id));
    if (block.length === 0) return;

    const targetInRest = rest.findIndex((i) => i.id === target.id);
    if (targetInRest === -1) return;

    const firstBlockIndex = master.findIndex((i) => ids.has(i.id));
    const targetIndex = master.findIndex((i) => i.id === target.id);
    const insertAt = targetIndex > firstBlockIndex ? targetInRest + 1 : targetInRest;

    const reordered = [...rest.slice(0, insertAt), ...block, ...rest.slice(insertAt)];
    if (this.isSameOrder(master, reordered)) return;
    requestAnimationFrame(() => this.commitOrder(reordered));
  }

  // ==========================================================================
  //  Sequence (click-to-order) mode
  //  The user turns it on, clicks rows in the order they want them, then
  //  applies. Picked rows take over the slots the picked rows already
  //  occupied, so unpicked rows never move — picking every row therefore
  //  spells out the whole order, and picking three rows just permutes those
  //  three.
  // ==========================================================================

  sequenceMode = signal<boolean>(false);
  /** Picked rows, in the order they were clicked. */
  private picks = signal<any[]>([]);
  pickedItems = this.picks.asReadonly();
  pickedCount = computed(() => this.picks().length);

  enterSequenceMode(): void {
    this.picks.set([]);
    this.sequenceMode.set(true);
  }

  exitSequenceMode(): void {
    this.sequenceMode.set(false);
    this.picks.set([]);
  }

  clearPicks(): void {
    this.picks.set([]);
  }

  /** 1-based badge number for a row, or null when it hasn't been picked. */
  pickPositionOf(item: any): number | null {
    const at = this.picks().findIndex((i) => i.id === item.id);
    return at === -1 ? null : at + 1;
  }

  /**
   * Record a click. Clicking an already-picked row un-picks it and the rows
   * after it renumber, so a mis-click is one click to undo.
   */
  pickItem(item: any): void {
    const current = this.picks();
    const at = current.findIndex((i) => i.id === item.id);
    this.picks.set(
      at === -1 ? [...current, item] : current.filter((_, idx) => idx !== at)
    );
  }

  /** Apply the clicked sequence to the master list and emit the new order. */
  applySequence(): void {
    const picks = this.picks();
    if (picks.length < 2) return;

    const master = [...this.dataService.items()];
    const slots = picks
      .map((p) => master.findIndex((i) => i.id === p.id))
      .filter((idx) => idx !== -1)
      .sort((a, b) => a - b);

    // A pick that is no longer in the list (removed underneath us) would shift
    // everything by one slot — bail rather than write a half-applied order.
    if (slots.length !== picks.length) {
      this.exitSequenceMode();
      return;
    }

    slots.forEach((slot, k) => (master[slot] = picks[k]));
    this.exitSequenceMode();
    if (this.isSameOrder(this.dataService.items(), master)) return;
    this.commitOrder(master);
  }

  // ==========================================================================

  /** Publish a new master order: local view first, then out to the host. */
  private commitOrder(reordered: any[]): void {
    this.dataService.items.set(reordered);
    this.searchService.updateFilteredItems();
    this.dataService.itemsReordered.set([...reordered]);
  }

  private isSameOrder(a: any[], b: any[]): boolean {
    return a.length === b.length && a.every((item, i) => item.id === b[i].id);
  }
}