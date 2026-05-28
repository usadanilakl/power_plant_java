import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfSdsApiService } from './rf-sds-api.service';
import { SdsChemicalDto } from '../../../../models/sds/sds-chemical.model';

@Injectable({ providedIn: 'root' })
export class RfSdsStateService {

  private apiService = inject(RfSdsApiService);
  private destroyRef = inject(DestroyRef);

  private allItemsSubject = new BehaviorSubject<SdsChemicalDto[]>([]);
  allItems$ = this.allItemsSubject.asObservable();

  selectedItems = signal<SdsChemicalDto[]>([]);
  selectedItem = signal<SdsChemicalDto | null>(null);
  selectedStatus = signal<string | null>(null);

  isFormOpen = signal(false);
  isDetailOpen = signal(false);
  detailItem = signal<SdsChemicalDto | null>(null);

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
    const status = this.selectedStatus();
    const obs = status ? this.apiService.getByStatus(status) : this.apiService.getAll();

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        const items = (res.responseData || []).map((item: any) => SdsChemicalDto.fromJson(item));
        this.allItemsSubject.next(items);
      },
      error: err => {
        console.warn('[SDS] Failed to load chemicals:', err.message);
        this.allItemsSubject.next([]);
      }
    });
  }

  loadByStatus(status: string | null): void {
    this.selectedStatus.set(status);
    this.loadAll();
  }

  openDetail(item: any): void {
    this.detailItem.set(SdsChemicalDto.fromJson(item));
    this.isDetailOpen.set(true);
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.detailItem.set(null);
  }

  submitForm(item: SdsChemicalDto): void {
    this.apiService.save(item).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      if (res.responseData) {
        this.selectedItem.set(SdsChemicalDto.fromJson(res.responseData));
        this.isFormOpen.set(false);
      }
    });
  }

  openNewForm(): void {
    this.selectedItem.set(new SdsChemicalDto());
    this.isFormOpen.set(true);
    // Fetch the suggested (book, section) and pre-fill it; the user approves or edits.
    this.apiService.getSuggestedAddress().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        const a = res.responseData;
        if (a && this.isFormOpen()) {
          this.selectedItem.set(new SdsChemicalDto({ bookNumber: a.bookNumber, sectionNumber: a.sectionNumber }));
        }
      },
      error: () => { /* leave book/section blank; user fills manually */ }
    });
  }

  /** Open the form to edit/process a chemical, pre-filling a suggested address if it has none. */
  openProcessForm(item: any): void {
    const dto = SdsChemicalDto.fromJson(item);
    this.selectedItem.set(dto);
    this.isFormOpen.set(true);
    if (dto.bookNumber == null && dto.sectionNumber == null) {
      this.apiService.getSuggestedAddress().pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: res => {
          const a = res.responseData;
          if (a && this.isFormOpen()) {
            this.selectedItem.set(new SdsChemicalDto({ ...dto, bookNumber: a.bookNumber, sectionNumber: a.sectionNumber }));
          }
        },
        error: () => {}
      });
    }
  }

  dumpPdfs(files: { fileName: string; contentType: string; base64Content: string }[]): void {
    this.apiService.dumpPdfs(files).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.loadAll(),
      error: err => console.warn('[SDS] PDF dump failed:', err.message)
    });
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
