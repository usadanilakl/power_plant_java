
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TableSelectionService {
  private selectedItems = signal<any[]>([]);
  private lastClickedItem = signal<any | null>(null);

  selectedItems$ = this.selectedItems.asReadonly();
  lastClickedItem$ = this.lastClickedItem.asReadonly();

  selectItem(item: any): void {
    this.selectedItems.update(items => [...items, item]);
    this.lastClickedItem.set(item);
  }

  setSelectedItems(items: any[]): void {
    this.selectedItems.set(items);
  }

  setLastClickedItem(item: any): void {
    this.lastClickedItem.set(item);
  }

  deselectItem(item: any): void {
    this.selectedItems.update(items =>
      items.filter(i => i.id !== item.id)
    );
  }

  toggleItem(item: any): void {
    const isSelected = this.selectedItems().some(i => i.id === item.id);
    if (isSelected) {
      this.deselectItem(item);
    } else {
      this.selectItem(item);
    }
  }

  selectRange(items: any[], startItem: any, endItem: any): void {
    const startIndex = items.findIndex(i => i.id === startItem.id);
    const endIndex = items.findIndex(i => i.id === endItem.id);

    if (startIndex === -1 || endIndex === -1) return;

    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    const rangeItems = items.slice(start, end + 1);

    const isSelecting = !this.selectedItems().some(i => i.id === endItem.id);

    if (isSelecting) {
      this.selectedItems.update(current =>
        [...new Set([...current, ...rangeItems])]
      );
    } else {
      this.selectedItems.update(current =>
        current.filter(i => !rangeItems.some(ri => ri.id === i.id))
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
    const deletedIds = new Set(this.selectedItems().map(item => item.id));
    deletedIds.forEach(id => deleteCallback(id));
    this.clearSelection();
  }
}
