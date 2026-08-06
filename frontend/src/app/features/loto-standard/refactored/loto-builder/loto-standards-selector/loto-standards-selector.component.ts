import { Component, computed, effect, inject, output, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { RfLotoStandardApiService } from '../../../refactored/services/rf-loto-standard-api.service';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfFloatingWindowComponent } from '../../../../../shared/rf-floating-window/rf-floating-window.component';
import { SyncUpdateService } from '../../../../../services/sync/sync-update.service';
import { DriftDotComponent } from '../../../../../shared/sync-indicator/drift-dot.component';

@Component({
  selector: 'app-loto-standards-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, RfFloatingWindowComponent, DriftDotComponent],
  templateUrl: './loto-standards-selector.component.html',
  styleUrl: './loto-standards-selector.component.css',
})
export class LotoStandardsSelectorComponent {
  private builderState = inject(LotoBuilderStateService);
  private apiService = inject(RfLotoStandardApiService);
  private destroyRef = inject(DestroyRef);
  private syncUpdateService = inject(SyncUpdateService);

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
  isSaving = signal<boolean>(false);
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

    // Peer edits (other tab / other machine): SSE echo triggers a refetch so
    // a new standard appears here without waiting for the next popup open.
    // Self-echoes are filtered out by SyncUpdateService.getEntityTypeUpdates$,
    // so the tab that just clicked "Create & Add" won't see its own event —
    // that case is covered by the isVisible effect below.
    this.syncUpdateService.getEntityTypeUpdates$('LotoStandard')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadStandards());

    // Also refetch whenever the popup opens — cheap 100-row fetch that
    // catches the two gaps SSE alone doesn't: (a) this tab's own recent
    // "Create & Add" saves (filtered as self-echo), and (b) peer changes
    // that arrived during an SSE reconnect gap. Skips the initial false
    // observation.
    effect(() => {
      if (this.isVisible()) this.loadStandards();
    });
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
   * Create and add new LOTO standard.
   * <p>
   * POSTs to /ng/loto-standards so the standard is persisted BEFORE it lands
   * in the carousel. The persisted DTO (with id) then flows through
   * LotoBuilderStateService.addLotoStandard, which mirrors it into
   * RfLotoStandardStateService.allLoadedLotoStandards$ — the Standards
   * left menu updates immediately without waiting for the SSE echo (which
   * is filtered on this tab). Peer tabs / peer machines pick up the write
   * via LocalChangeSseBroadcaster on the same commit.
   * <p>
   * Previously this only added a local-in-memory DTO with no id, so the
   * standard existed only in the carousel until the user hit the Save
   * button inside the form — every other window (and this window's own
   * Standards page) was blind to it until then.
   */
  createNewStandard(): void {
    if (!this.canCreateNew() || this.isSaving()) {
      return;
    }

    const draft = new LotoStandardDto({
      name: this.newStandardName().trim(),
      description: this.newStandardDescription().trim() || null,
      lotoPoints: [],
    });

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.apiService.createLotoStandard(draft)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const saved = LotoStandardDto.fromJson(response.responseData);
          this.builderState.addLotoStandard(saved);
          this.hideCreateNewForm();
          this.close.emit();
          this.builderState.closeLotoStandardsPopup();
          this.isSaving.set(false);
        },
        error: (error) => {
          console.error('Error creating LOTO standard:', error);
          this.errorMessage.set(
            error?.error?.message || 'Failed to create LOTO standard'
          );
          this.isSaving.set(false);
        },
      });
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
