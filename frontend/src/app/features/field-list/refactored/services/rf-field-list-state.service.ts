import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfFieldListApiService } from './rf-field-list-api.service';
import { FieldListItemDto } from '../../../../models/field-list/field-list-item.model';

@Injectable({ providedIn: 'root' })
export class RfFieldListStateService {

  private apiService = inject(RfFieldListApiService);
  private destroyRef = inject(DestroyRef);

  private allItemsSubject = new BehaviorSubject<FieldListItemDto[]>([]);
  allItems$ = this.allItemsSubject.asObservable();

  selectedItems = signal<FieldListItemDto[]>([]);
  selectedItem = signal<FieldListItemDto | null>(null);
  selectedListType = signal<string | null>(null);

  isFormOpen = signal(false);
  isDetailOpen = signal(false);
  detailItem = signal<FieldListItemDto | null>(null);

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
    const listType = this.selectedListType();
    const obs = listType
      ? this.apiService.getByListType(listType)
      : this.apiService.getAll();

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        const items = (res.responseData || []).map((item: any) => FieldListItemDto.fromJson(item));
        this.allItemsSubject.next(items);
      },
      error: err => {
        console.warn('[FieldList] Failed to load items:', err.message);
        this.allItemsSubject.next([]);
      }
    });
  }

  loadByListType(listType: string | null): void {
    this.selectedListType.set(listType);
    this.loadAll();
  }

  loadItemById(id: number): void {
    this.apiService.getById(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      if (res.responseData) {
        this.selectedItem.set(FieldListItemDto.fromJson(res.responseData));
      }
    });
  }

  submitForm(item: FieldListItemDto): void {
    this.apiService.save(item).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      if (res.responseData) {
        this.selectedItem.set(FieldListItemDto.fromJson(res.responseData));
        this.isFormOpen.set(false);
      }
    });
  }

  openDetail(item: any): void {
    console.log('[FieldList] openDetail called with:', item?.id, item?.title);
    this.detailItem.set(FieldListItemDto.fromJson(item));
    this.isDetailOpen.set(true);
    console.log('[FieldList] isDetailOpen:', this.isDetailOpen(), 'detailItem:', this.detailItem()?.title);
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.detailItem.set(null);
  }

  openNewForm(): void {
    this.selectedItem.set(new FieldListItemDto({ listTypeName: this.selectedListType() || '' }));
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
