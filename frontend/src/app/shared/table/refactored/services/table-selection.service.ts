
import { inject, Injectable, signal } from '@angular/core';
import { ClipboardService } from '../../../clipboard/clipboard.service';
import { TableDataService } from './table-data.service';

@Injectable()
export class TableSelectionService {
  // private clipboardService = inject(ClipboardService);
  private dataService = inject(TableDataService);

  selectedItems = this.dataService.selectedItems;
  private lastClickedItem = signal<any | null>(null);

  selectedItems$ = this.selectedItems.asReadonly();
  lastClickedItem$ = this.lastClickedItem.asReadonly();

  selectItem(item: any): void {
    this.selectedItems.update((items) => [...items, item]);
    this.lastClickedItem.set(item);
  }

  setSelectedItems(items: any[]): void {
    this.selectedItems.set(items);
  }

  setLastClickedItem(item: any): void {
    this.lastClickedItem.set(item);
  }

  deselectItem(item: any): void {
    this.selectedItems.update((items) => items.filter((i) => i.id !== item.id));
  }

  toggleItem(item: any): void {
    const isSelected = this.selectedItems().some((i) => i.id === item.id);
    if (isSelected) {
      this.deselectItem(item);
    } else {
      this.selectItem(item);
    }
  }

  selectRange(items: any[], startItem: any, endItem: any): void {
    const startIndex = items.findIndex((i) => i.id === startItem.id);
    const endIndex = items.findIndex((i) => i.id === endItem.id);

    if (startIndex === -1 || endIndex === -1) return;

    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    const rangeItems = items.slice(start, end + 1);

    const isSelecting = !this.selectedItems().some((i) => i.id === endItem.id);

    if (isSelecting) {
      this.selectedItems.update((current) => [
        ...new Set([...current, ...rangeItems]),
      ]);
    } else {
      this.selectedItems.update((current) =>
        current.filter((i) => !rangeItems.some((ri) => ri.id === i.id))
      );
    }

    this.lastClickedItem.set(endItem);

    console.log('Selected items:', this.selectedItems());
  }

  clearSelection(): void {
    this.selectedItems.set([]);
    this.lastClickedItem.set(null);
  }

  deleteSelected(deleteCallback: (id: any) => void): void {
    const deletedIds = new Set(this.selectedItems().map((item) => item.id));
    deletedIds.forEach((id) => deleteCallback(id));
    this.clearSelection();
  }

  /**
   * Add items to specific section
   */
  // addToClipboard(): void {
  //   if (!this.selectedItems() || this.selectedItems().length === 0) return;
  //   const objectType = this.selectedItems()[0].objectType ?? 'Other';
  //   const items = this.selectedItems();
  //   items.forEach((item) => {
  //     if (!item.objectType) {
  //       item.objectType = objectType;
  //     }
  //   });
  //   this.clipboardService.addItems(this.selectedItems());
  // }

  isItemSelected(item: any): boolean {
    return this.selectedItems().some((i) => i.id === item.id);
  }

  /**
   * Delete selected items
   */
  deleteSelectedItems(deleteItemFn: (ids: any[]) => void): void {
    const selectedItems = this.selectedItems();
    if (selectedItems.length > 0) {
      const ids = selectedItems.map((item) => item.id);
      deleteItemFn(ids);
      this.clearSelection();
    }
  }
}
