import { BehaviorSubject, Observable } from 'rxjs';
import { IBaseModel } from '../models/permits/base.model';
import { inject, Injectable } from '@angular/core';
import { GlobalMessageService } from './global-message.service';

@Injectable()
export abstract class BaseStateService<T extends IBaseModel> {
  protected globalMessageService = inject(GlobalMessageService);

  protected readonly allItemsSubject = new BehaviorSubject<T[]>([]);
  readonly allItems$: Observable<T[]> = this.allItemsSubject.asObservable();

  protected readonly selectedItemSubject = new BehaviorSubject<T | null>(null);
  readonly selectedItem$: Observable<T | null> = this.selectedItemSubject.asObservable();

  constructor(private itemConstructor: new (data?: Partial<T>) => T) {
    this.selectedItemSubject.next(new this.itemConstructor());
  }

  /**
   * Adds or updates items in the state list.
   * It uses a Map to ensure uniqueness based on the item's sharepointId.
   * @param items An array of items to add or update.
   */
  addItemsToList(items: T[]): void {
    const currentItems = this.allItemsSubject.getValue();
    // Assuming 'sharepointId' is a unique identifier. If not, 'id' could be used.
    const itemMap = new Map(currentItems.map(item => [(item as any).sharepointId, item]));

    items.forEach(newItem => {
      itemMap.set((newItem as any).sharepointId, newItem);
    });

    const updatedItems = Array.from(itemMap.values());
    this.allItemsSubject.next(updatedItems);
  }

  /**
   * Sets the currently selected item in the state.
   * @param item The item to select.
   */
  selectItem(item: T): void {
    this.selectedItemSubject.next(item);
  }

  /**
   * Gets the current value of the selected item.
   * @returns The currently selected item.
   */
  getSelectedItem(): T | null {
    return this.selectedItemSubject.value;
  }

  /**
   * Clears the selection and resets it to a new, empty instance of the item.
   */
  clearSelection(): void {
    this.selectedItemSubject.next(new this.itemConstructor());
  }
}