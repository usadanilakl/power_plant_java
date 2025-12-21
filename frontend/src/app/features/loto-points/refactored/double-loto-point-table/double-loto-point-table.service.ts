import { Injectable, inject, signal } from '@angular/core';
import { LotoPointContextMenuService } from '../services/loto-point-context-menu.service';
import { Column } from '../../../../models/column.model';
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
  }

  /**
   * Remove item from selected items
   */
  removeItemFromSelected(item: LotoPointDto): void {
    const selected = this.currentSelectedItems();
    const updated = selected.filter((s) => s.id !== item.id);

    this.currentSelectedItems.set(updated);
  }

  /**
   * Handle reordering of selected items
   */
  onSelectedItemsReordered(items: LotoPointDto[]): void {
    this.currentSelectedItems.set(items);
  }
}
