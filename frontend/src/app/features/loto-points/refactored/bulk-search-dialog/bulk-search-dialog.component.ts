import {
  Component,
  computed,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfLotoPointApiService } from '../services/rf-loto-point-api.service';
import {
  BulkSearchResultDto,
  BulkSearchMatchDto,
  LotoPointDtoLight,
} from '../../../../models/loto/bulk-search-result.model';
import { ImageTextExtractorComponent } from '../../../../shared/image-text-extractor/image-text-extractor.component';

@Component({
  selector: 'app-bulk-search-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageTextExtractorComponent],
  templateUrl: './bulk-search-dialog.component.html',
  styleUrl: './bulk-search-dialog.component.css',
})
export class BulkSearchDialogComponent {
  private apiService = inject(RfLotoPointApiService);
  private destroyRef = inject(DestroyRef);

  pointsSelected = output<LotoPointDtoLight[]>();
  dialogClosed = output<void>();

  // UI state
  activeTab = signal<'text' | 'image'>('text');
  searchText = signal('');
  loading = signal(false);
  result = signal<BulkSearchResultDto | null>(null);

  // Selection: map of LotoPoint id -> LotoPointDtoLight
  selectedPoints = signal<Map<number, LotoPointDtoLight>>(new Map());

  // For duplicate matches: which point is selected per detected tag
  duplicateSelections = signal<Map<string, LotoPointDtoLight>>(new Map());

  selectedCount = computed(() => this.selectedPoints().size);

  hasResults = computed(() => {
    const r = this.result();
    if (!r) return false;
    return (
      r.exactMatches.length > 0 ||
      r.duplicateMatches.length > 0 ||
      r.partialMatches.length > 0 ||
      r.notFound.length > 0
    );
  });

  performSearch(): void {
    const text = this.searchText();
    if (!text.trim()) return;

    this.loading.set(true);
    this.result.set(null);
    this.selectedPoints.set(new Map());
    this.duplicateSelections.set(new Map());

    this.apiService
      .bulkSearchByText(text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.result.set(response.responseData);
          // Auto-select all exact matches
          this.selectAllExact();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Bulk search failed:', err);
          this.loading.set(false);
        },
      });
  }

  onImageTextSubmitted(text: string): void {
    this.searchText.set(text);
    this.activeTab.set('text');
    this.performSearch();
  }

  onSearchTextInput(event: Event): void {
    this.searchText.set((event.target as HTMLTextAreaElement).value);
  }

  togglePointSelection(point: LotoPointDtoLight): void {
    const current = new Map(this.selectedPoints());
    if (current.has(point.id)) {
      current.delete(point.id);
    } else {
      current.set(point.id, point);
    }
    this.selectedPoints.set(current);
  }

  isSelected(point: LotoPointDtoLight): boolean {
    return this.selectedPoints().has(point.id);
  }

  selectAllExact(): void {
    const r = this.result();
    if (!r) return;

    const current = new Map(this.selectedPoints());
    for (const match of r.exactMatches) {
      if (match.matchingPoints.length === 1) {
        const p = match.matchingPoints[0];
        current.set(p.id, p);
      }
    }
    this.selectedPoints.set(current);
  }

  deselectAll(): void {
    this.selectedPoints.set(new Map());
  }

  selectDuplicate(tag: string, point: LotoPointDtoLight): void {
    const dups = new Map(this.duplicateSelections());
    dups.set(tag, point);
    this.duplicateSelections.set(dups);

    // Also add to selected
    const current = new Map(this.selectedPoints());
    // Remove any previously selected point for this tag's group
    const result = this.result();
    if (result) {
      const group = result.duplicateMatches.find((m) => m.detectedTag === tag);
      if (group) {
        for (const p of group.matchingPoints) {
          if (p.id !== point.id) current.delete(p.id);
        }
      }
    }
    current.set(point.id, point);
    this.selectedPoints.set(current);
  }

  getDuplicateSelection(tag: string): LotoPointDtoLight | undefined {
    return this.duplicateSelections().get(tag);
  }

  confirmSelection(): void {
    const selected = Array.from(this.selectedPoints().values());
    this.pointsSelected.emit(selected);
  }

  close(): void {
    this.dialogClosed.emit();
  }
}
