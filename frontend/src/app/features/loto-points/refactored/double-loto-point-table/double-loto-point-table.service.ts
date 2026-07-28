import { Injectable, signal } from '@angular/core';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { FilterOutRules } from '../../../../shared/table/refactored/table.component';

@Injectable({
  providedIn: 'root',
})
export class DoubleLotoPointTableService {

  selectedItems = signal<LotoPointDto[]>([]);
  currentSelectedItems = signal<LotoPointDto[]>([]);
  filterOutRules = signal<FilterOutRules>({
    action: 'highlight',
    items: this.selectedItems(),
    style: { 'background-color': 'lightyellow' },
  });

  // Signals to notify parent components of changes
  // These are set by the component and called when changes occur
  lastAddedItem = signal<LotoPointDto | null>(null);
  lastRemovedItem = signal<LotoPointDto | null>(null);
  lastReorderedItems = signal<LotoPointDto[] | null>(null);

  /**
   * The LOTO point currently being viewed in the details dialog. Set by
   * either source or destination click services on double-click; the
   * parent DoubleLotoPointTableComponent renders a popup projection
   * hosting a LotoPointDualForm bound to this signal.
   * <p>
   * null = popup closed.
   */
  viewingPoint = signal<LotoPointDto | null>(null);

  /** Open the details dialog on this point. */
  viewPoint(item: LotoPointDto): void {
    if (!item) return;
    this.viewingPoint.set(item);
  }

  /** Close the details dialog. */
  closeViewingPoint(): void {
    this.viewingPoint.set(null);
  }

  /**
   * Handle adding multiple items to selected items
   */
  onAddItemsToSelected(items: LotoPointDto[]): void {
    console.log('adding items; ', items);
    const currentSelected = this.currentSelectedItems();
    const currentIds = new Set(currentSelected.map((item) => item.id));

    // Filter out items that already exist
    const newItems = items.filter((item) => !currentIds.has(item.id));

    if (newItems.length === 0) {
      return; // No new items to add
    }

    const updated = [...currentSelected, ...newItems];
    this.currentSelectedItems.set(updated);
  }

  /**
   * Handle removing multiple items from selected items
   */
  onRemoveItemsFromSelected(items: LotoPointDto[]): void {
    const currentSelected = this.currentSelectedItems();
    const itemsToRemoveIds = new Set(items.map((item) => item.id));

    const updated = currentSelected.filter(
      (item) => !itemsToRemoveIds.has(item.id)
    );

    if (updated.length === currentSelected.length) {
      return; // No items were removed
    }

    this.currentSelectedItems.set(updated);
  }

  /**
   * Add item to selected items
   */
  addItemToSelected(item: LotoPointDto): void {
    const selected = this.currentSelectedItems();

    // Check if item already exists
    if (selected.some((s) => s.id === item.id)) {
      return;
    }

    const updated = [...selected, item];
    this.currentSelectedItems.set(updated);

    // Notify parent component of the added item
    this.lastAddedItem.set(item);
  }

  /**
   * Remove item from selected items
   */
  removeItemFromSelected(item: LotoPointDto): void {
    const selected = this.currentSelectedItems();
    const updated = selected.filter((s) => s.id !== item.id);

    if (updated.length === selected.length) {
      return; // Item was not in the list
    }

    this.currentSelectedItems.set(updated);

    // Notify parent component of the removed item
    this.lastRemovedItem.set(item);
  }

  /**
   * Handle reordering of selected items
   */
  onSelectedItemsReordered(items: LotoPointDto[]): void {
    this.currentSelectedItems.set(items);

    // Notify parent component of the reordered items
    this.lastReorderedItems.set(items);
  }

  /**
   * Reset notification signals (call after handling)
   */
  clearNotifications(): void {
    this.lastAddedItem.set(null);
    this.lastRemovedItem.set(null);
    this.lastReorderedItems.set(null);
  }
}
