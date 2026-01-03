import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleLotoFormComponent } from '../simple-loto-form/simple-loto-form.component';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';

@Component({
  selector: 'app-loto-form-carousel',
  standalone: true,
  imports: [CommonModule, SimpleLotoFormComponent],
  templateUrl: './loto-form-carousel.component.html',
  styleUrl: './loto-form-carousel.component.css',
})
export class LotoFormCarouselComponent {
  // Inputs
  lotoStandards = input.required<LotoStandardDto[]>();

  // Outputs
  standardUpdated = output<{ index: number; standard: LotoStandardDto }>();
  standardSubmitted = output<{ index: number; standard: LotoStandardDto }>();
  standardCancelled = output<{ index: number }>();
  close = output<void>();

  // Internal state
  activeIndex = signal<number>(0);

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

  /**
   * Navigate to previous form
   */
  goToPrevious(): void {
    if (this.canGoPrevious()) {
      this.activeIndex.update(index => index - 1);
    }
  }

  /**
   * Navigate to next form
   */
  goToNext(): void {
    if (this.canGoNext()) {
      this.activeIndex.update(index => index + 1);
    }
  }

  /**
   * Navigate to specific index
   */
  goToIndex(index: number): void {
    if (index >= 0 && index < this.totalCount()) {
      this.activeIndex.set(index);
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
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(standard: LotoStandardDto): void {
    const index = this.activeIndex();
    this.standardSubmitted.emit({ index, standard });
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
}
