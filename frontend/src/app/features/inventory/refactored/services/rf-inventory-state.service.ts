import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfInventoryApiService } from './rf-inventory-api.service';
import { InventoryItemDto } from '../../../../models/inventory/inventory-item.model';

@Injectable({ providedIn: 'root' })
export class RfInventoryStateService {

  private apiService = inject(RfInventoryApiService);
  private destroyRef = inject(DestroyRef);

  private allItemsSubject = new BehaviorSubject<InventoryItemDto[]>([]);
  allItems$ = this.allItemsSubject.asObservable();

  selectedItems = signal<InventoryItemDto[]>([]);
  selectedItem = signal<InventoryItemDto | null>(null);
  selectedType = signal<string | null>(null);

  isFormOpen = signal(false);
  isDetailOpen = signal(false);
  detailItem = signal<InventoryItemDto | null>(null);

  constructor() {
    this.apiService.itemDeleted$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(id => {
      const current = this.allItemsSubject.value;
      this.allItemsSubject.next(current.filter(item => item.id !== id));
    });

    this.apiService.itemUpdated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(updated => {
      const current = this.allItemsSubject.value;
      const index = current.findIndex(item => item.id === updated.id);
      if (index >= 0) {
        current[index] = updated;
        this.allItemsSubject.next([...current]);
      } else {
        this.allItemsSubject.next([updated, ...current]);
      }
    });
  }

  loadAll(): void {
    const type = this.selectedType();
    const obs = type ? this.apiService.getByType(type) : this.apiService.getAll();

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        const items = (res.responseData || []).map((item: any) => InventoryItemDto.fromJson(item));
        this.allItemsSubject.next(items);
      },
      error: err => {
        console.warn('[Inventory] Failed to load items:', err.message);
        this.allItemsSubject.next([]);
      }
    });
  }

  loadByType(type: string | null): void {
    this.selectedType.set(type);
    this.loadAll();
  }

  loadItemById(id: number): void {
    this.apiService.getById(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      if (res.responseData) {
        this.selectedItem.set(InventoryItemDto.fromJson(res.responseData));
      }
    });
  }

  openDetail(item: any): void {
    this.detailItem.set(InventoryItemDto.fromJson(item));
    this.isDetailOpen.set(true);
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.detailItem.set(null);
  }

  submitForm(item: InventoryItemDto): void {
    this.apiService.save(item).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      if (res.responseData) {
        this.selectedItem.set(InventoryItemDto.fromJson(res.responseData));
        this.isFormOpen.set(false);
      }
    });
  }

  openNewForm(): void {
    this.selectedItem.set(new InventoryItemDto({ itemTypeName: this.selectedType() || '' }));
    this.isFormOpen.set(true);
  }

  deleteItem(id: number): void {
    this.apiService.delete(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.selectedItem.set(null);
      this.isFormOpen.set(false);
    });
  }
}
