import { inject, Injectable, signal } from '@angular/core';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { FilterOutRules } from '../../../../shared/table/refactored/table.component';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';

@Injectable({
  providedIn: 'root',
})
export class DoubleLotoPointTableService {
  private lotoPointStateService = inject(RfLotoPointStateService);

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
   * Open the details dialog on this point. Delegates to
   * RfLotoPointStateService.loadItemById which fetches the full DTO from
   * the server, sets selectedItem, and flips isLotoPointFormOpen — the
   * page-level popup on {@code rf-loto-standard-page.component.html}
   * then renders either the dual form (for unit-specific 01/02 points)
   * or the single {@code app-rf-loto-point-form} (for everything else).
   * Reusing that popup means points without a counterpart get a form
   * too — the same behavior the "View Details" context-menu action
   * provides — instead of the dual form template rendering nothing.
   */
  viewPoint(item: LotoPointDto): void {
    if (!item?.id) return;
    // loadAndOpenItem (not loadItemById): also calls openForm() → flips
    // isLotoPointFormOpen so the page-level popup renders. Plain
    // loadItemById only sets selectedItem and leaves the popup closed.
    this.lotoPointStateService.loadAndOpenItem(item.id);
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
