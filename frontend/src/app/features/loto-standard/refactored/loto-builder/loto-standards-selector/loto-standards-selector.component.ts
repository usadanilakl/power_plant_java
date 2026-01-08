import { Component, computed, inject, output, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { RfLotoStandardApiService } from '../../../refactored/services/rf-loto-standard-api.service';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfFloatingWindowComponent } from '../../../../../shared/rf-floating-window/rf-floating-window.component';

@Component({
  selector: 'app-loto-standards-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, RfFloatingWindowComponent],
  templateUrl: './loto-standards-selector.component.html',
  styleUrl: './loto-standards-selector.component.css',
})
export class LotoStandardsSelectorComponent {
  private builderState = inject(LotoBuilderStateService);
  private apiService = inject(RfLotoStandardApiService);
  private destroyRef = inject(DestroyRef);

  // Window configuration
  readonly windowId = 'loto-selector';
  readonly initialPosition = { x: 100, y: 50 };
  readonly initialSize = { width: 500, height: 550 };
  readonly minSize = { width: 350, height: 400 };

  // Outputs
  close = output<void>();

  // State
  searchTerm = signal<string>('');
  availableStandards = signal<LotoStandardDto[]>([]);
  selectedStandardIds = signal<Set<number>>(new Set());
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  showCreateNew = signal<boolean>(false);
  newStandardName = signal<string>('');
  newStandardDescription = signal<string>('');

  // Computed
  isVisible = computed(() => this.builderState.isLotoStandardsPopupOpen());

  filteredStandards = computed(() => {
    const standards = this.availableStandards();
    const search = this.searchTerm().toLowerCase();

    if (!search) {
      return standards;
    }

    return standards.filter(standard =>
      standard.name?.toLowerCase().includes(search) ||
      standard.description?.toLowerCase().includes(search)
    );
  });

  hasSelection = computed(() => this.selectedStandardIds().size > 0);

  canCreateNew = computed(() => {
    const name = this.newStandardName().trim();
    return name.length > 0;
  });

  constructor() {
    this.loadStandards();
  }

  /**
   * Load available LOTO standards from API
   */
  loadStandards(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .getLotoStandards(1, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Properly deserialize the standards to ensure they have the correct class structure
          const standards = (response.responseData?.content || []).map(
            (item: any) => LotoStandardDto.fromJson(item)
          );
          this.availableStandards.set(standards);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading LOTO standards:', error);
          this.errorMessage.set('Failed to load LOTO standards');
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Toggle selection of a standard
   */
  toggleSelection(standardId: number): void {
    this.selectedStandardIds.update(ids => {
      const newIds = new Set(ids);
      if (newIds.has(standardId)) {
        newIds.delete(standardId);
      } else {
        newIds.add(standardId);
      }
      return newIds;
    });
  }

  /**
   * Check if standard is selected
   */
  isSelected(standardId: number): boolean {
    return this.selectedStandardIds().has(standardId);
  }

  /**
   * Add selected standards to builder
   */
  addSelectedStandards(): void {
    const selectedIds = this.selectedStandardIds();
    const standards = this.availableStandards();

    selectedIds.forEach(id => {
      const standard = standards.find(s => s.id === id);
      if (standard) {
        this.builderState.addLotoStandard(standard);
      }
    });

    this.close.emit();
    this.builderState.closeLotoStandardsPopup();
  }

  /**
   * Show create new form
   */
  showCreateNewForm(): void {
    this.showCreateNew.set(true);
  }

  /**
   * Hide create new form
   */
  hideCreateNewForm(): void {
    this.showCreateNew.set(false);
    this.newStandardName.set('');
    this.newStandardDescription.set('');
  }

  /**
   * Create and add new LOTO standard
   */
  createNewStandard(): void {
    if (!this.canCreateNew()) {
      return;
    }

    const newStandard = new LotoStandardDto({
      name: this.newStandardName().trim(),
      description: this.newStandardDescription().trim() || null,
      lotoPoints: [],
    });

    this.builderState.addLotoStandard(newStandard);
    this.hideCreateNewForm();
    this.close.emit();
    this.builderState.closeLotoStandardsPopup();
  }

  /**
   * Cancel and close selector
   */
  onCancel(): void {
    this.close.emit();
    this.builderState.closeLotoStandardsPopup();
  }

  /**
   * Handle search input change
   */
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }
}
