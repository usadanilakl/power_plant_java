import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkAreaDto, WorkAreaPermitCounts } from '../../../../models/permits/work-area.model';
import { WorkAreaApiService } from './work-area-api.service';

@Injectable({ providedIn: 'root' })
export class WorkAreaStateService {
  private api = inject(WorkAreaApiService);
  private destroyRef = inject(DestroyRef);

  // State signals
  items = signal<WorkAreaDto[]>([]);
  selectedItem = signal<WorkAreaDto | null>(null);
  formOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  permitCounts = signal<WorkAreaPermitCounts[]>([]);

  // Computed
  hasSelection = computed(() => this.selectedItem() !== null);

  // --- Data Loading ---

  loadAll(): void {
    this.isLoading.set(true);
    this.api.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (areas) => {
        this.items.set(areas);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadWithPermitCounts(): void {
    this.isLoading.set(true);
    this.api.getWithPermitCounts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.permitCounts.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  // --- Selection ---

  setSelectedItem(item: WorkAreaDto | null): void {
    this.selectedItem.set(item);
  }

  openForm(): void {
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.selectedItem.set(null);
  }

  openNewForm(): void {
    this.selectedItem.set(new WorkAreaDto());
    this.formOpen.set(true);
  }

  // --- Actions ---

  submitForm(dto: WorkAreaDto): void {
    this.isLoading.set(true);
    this.api.save(dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.items.update((items) => {
          const index = items.findIndex((i) => i.id === saved.id);
          if (index >= 0) {
            const updated = [...items];
            updated[index] = saved;
            return updated;
          }
          return [...items, saved];
        });
        this.closeForm();
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  deleteItem(id: number): void {
    this.api.delete(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.items.update((items) => items.filter((i) => i.id !== id));
        this.closeForm();
      },
    });
  }
}
