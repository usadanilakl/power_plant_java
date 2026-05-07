import { Component, computed, inject, input, output, signal, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SimpleLotoFormComponent } from '../simple-loto-form/simple-loto-form.component';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { RfLotoStandardApiService } from '../../services/rf-loto-standard-api.service';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import { RfFloatingWindowComponent } from '../../../../../shared/rf-floating-window/rf-floating-window.component';
import { LotoStandardWorkflowPanelComponent } from '../loto-standard-workflow-panel/loto-standard-workflow-panel.component';

@Component({
  selector: 'app-loto-form-carousel',
  standalone: true,
  imports: [CommonModule, SimpleLotoFormComponent, RfFloatingWindowComponent, LotoStandardWorkflowPanelComponent],
  templateUrl: './loto-form-carousel.component.html',
  styleUrl: './loto-form-carousel.component.css',
})
export class LotoFormCarouselComponent implements OnInit {
  // Services
  private apiService = inject(RfLotoStandardApiService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);

  // Window configuration
  readonly windowId = 'loto-carousel';
  readonly initialPosition = { x: 0, y: 0 };
  readonly initialSize = { width: 500, height: 600 };
  readonly minSize = { width: 350, height: 400 };

  // Inputs
  lotoStandards = input.required<LotoStandardDto[]>();

  // Outputs
  standardUpdated = output<{ index: number; standard: LotoStandardDto }>();
  standardSubmitted = output<{ index: number; standard: LotoStandardDto }>();
  standardCancelled = output<{ index: number }>();
  addNewRequested = output<void>();
  close = output<void>();
  activeIndexChanged = output<number>();

  // Internal state
  activeIndex = signal<number>(0);
  isSaving = signal<boolean>(false);

  // Computed
  activeStandard = computed(() => {
    const standards = this.lotoStandards();
    const index = this.activeIndex();
    return standards[index] || null;
  });

  totalCount = computed(() => this.lotoStandards().length);

  hasMultiple = computed(() => this.totalCount() > 1);

  canGoPrevious = computed(() => this.activeIndex() > 0);

  canGoNext = computed(() => this.activeIndex() < this.totalCount() - 1);

  ngOnInit(): void {
    this.activeIndexChanged.emit(this.activeIndex());
  }

  /**
   * Navigate to previous form
   */
  goToPrevious(): void {
    if (this.canGoPrevious()) {
      this.activeIndex.update(index => index - 1);
      this.activeIndexChanged.emit(this.activeIndex());
    }
  }

  /**
   * Navigate to next form
   */
  goToNext(): void {
    if (this.canGoNext()) {
      this.activeIndex.update(index => index + 1);
      this.activeIndexChanged.emit(this.activeIndex());
    }
  }

  /**
   * Navigate to specific index
   */
  goToIndex(index: number): void {
    if (index >= 0 && index < this.totalCount()) {
      this.activeIndex.set(index);
      this.activeIndexChanged.emit(this.activeIndex());
    }
  }

  /**
   * Handle name change for active standard
   */
  onNameChanged(newName: string): void {
    const index = this.activeIndex();
    const standard = this.lotoStandards()[index];
    if (standard) {
      const updated = new LotoStandardDto({
        ...standard,
        name: newName,
      });
      this.standardUpdated.emit({ index, standard: updated });
    }
  }

  /**
   * Handle description change for active standard
   */
  onDescriptionChanged(newDescription: string): void {
    const index = this.activeIndex();
    const standard = this.lotoStandards()[index];
    if (standard) {
      const updated = new LotoStandardDto({
        ...standard,
        description: newDescription,
      });
      this.standardUpdated.emit({ index, standard: updated });
    }
  }

  /**
   * Handle point removal from active standard
   */
  onRemovePoint(point: LotoPointDto): void {
    const index = this.activeIndex();
    const standard = this.lotoStandards()[index];
    if (standard && standard.lotoPoints) {
      const updatedPoints = standard.lotoPoints.filter((p: LotoPointDto) => p.id !== point.id);
      const updated = new LotoStandardDto({
        ...standard,
        lotoPoints: updatedPoints,
      });
      this.standardUpdated.emit({ index, standard: updated });

      // If standard is saved (has ID), immediately persist to server
      if (standard.id && point.id) {
        this.apiService.removeLotoPointFromStandard(standard.id, point.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            error: (err) => console.error('Failed to remove LOTO point:', err)
          });
      }
    }
  }

  /**
   * Handle points reorder from active standard
   */
  onReorderPoints(reorderedPoints: LotoPointDto[]): void {
    const index = this.activeIndex();
    const standard = this.lotoStandards()[index];
    if (standard) {
      const updated = new LotoStandardDto({
        ...standard,
        lotoPoints: reorderedPoints,
      });
      this.standardUpdated.emit({ index, standard: updated });

      // If standard is saved (has ID), immediately persist to server
      if (standard.id) {
        const lotoPointIds = reorderedPoints.map(p => p.id!);
        this.apiService.reorderLotoPoints(standard.id, lotoPointIds)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            error: (err) => console.error('Failed to reorder LOTO points:', err)
          });
      }
    }
  }

  /**
   * Handle form submission - save to backend via API
   */
  onSubmit(standard: LotoStandardDto): void {
    const index = this.activeIndex();

    // Prevent double submission
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    // Use saveLotoStandard which handles both create and update
    this.apiService.saveLotoStandard(standard)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const savedStandard = LotoStandardDto.fromJson(response.responseData);
          const isNew = !standard.id;
          const action = isNew ? 'created' : 'updated';

          this.messageService.showSuccess(`LOTO Standard "${savedStandard.name}" ${action} successfully`);
          this.isSaving.set(false);

          // Emit with the saved standard (which now has an ID if it was new)
          this.standardSubmitted.emit({ index, standard: savedStandard });
        },
        error: (error) => {
          console.error('Error saving LOTO Standard:', error);
          const errorMsg = error.error?.message || error.message || 'Unknown error';
          this.messageService.showError(`Failed to save LOTO Standard: ${errorMsg}`);
          this.isSaving.set(false);
        }
      });
  }

  /**
   * Request to add a new LOTO standard (opens selector dialog)
   */
  onAddNew(): void {
    this.addNewRequested.emit();
  }

  /**
   * Handle form cancellation
   */
  onCancel(): void {
    const index = this.activeIndex();
    this.standardCancelled.emit({ index });
  }

  /**
   * Close the entire carousel
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Handle workflow transition completion. The backend returns the fully refreshed
   * standard — push it back to the parent so it stays in sync with the carousel array.
   */
  onWorkflowStandardUpdated(updated: LotoStandardDto): void {
    const index = this.activeIndex();
    this.standardUpdated.emit({ index, standard: updated });
  }
}
