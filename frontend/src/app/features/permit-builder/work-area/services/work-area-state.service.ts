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

  openCounterpartForm(): void {
    const source = this.selectedItem();
    if (!source) return;

    this.selectedItem.set(new WorkAreaDto({
      ...source,
      id: 0,
      name: this.transformCounterpartText(source.name),
      description: this.transformCounterpartText(source.description ?? ''),
      shapeId: null,
    }));
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

  private transformCounterpartText(value: string): string {
    if (!value) return value;

    const replacements: Array<[RegExp, string]> = [
      [/\bU1\b/g, '__UNIT_A__'],
      [/\bU2\b/g, 'U1'],
      [/__UNIT_A__/g, 'U2'],
      [/\bUnit 1\b/g, '__UNIT_ONE__'],
      [/\bUnit 2\b/g, 'Unit 1'],
      [/__UNIT_ONE__/g, 'Unit 2'],
      [/\bunit 1\b/g, '__unit_one__'],
      [/\bunit 2\b/g, 'unit 1'],
      [/__unit_one__/g, 'unit 2'],
    ];

    let transformed = value;
    for (const [pattern, replacement] of replacements) {
      transformed = transformed.replace(pattern, replacement);
    }

    return transformed === value ? `${value} Copy` : transformed;
  }
}
