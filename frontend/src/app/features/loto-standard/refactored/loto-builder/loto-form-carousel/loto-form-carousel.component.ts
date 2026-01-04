import { Component, computed, inject, input, output, signal, DestroyRef, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SimpleLotoFormComponent } from '../simple-loto-form/simple-loto-form.component';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { RfLotoStandardApiService } from '../../services/rf-loto-standard-api.service';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import { DraggableWindowService } from '../services/draggable-window.service';

@Component({
  selector: 'app-loto-form-carousel',
  standalone: true,
  imports: [CommonModule, SimpleLotoFormComponent],
  templateUrl: './loto-form-carousel.component.html',
  styleUrl: './loto-form-carousel.component.css',
})
export class LotoFormCarouselComponent implements OnInit, OnDestroy {
  // Services
  private apiService = inject(RfLotoStandardApiService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);
  private windowService = inject(DraggableWindowService);
  private elementRef = inject(ElementRef);

  // Window ID for draggable service
  readonly windowId = 'loto-carousel';

  // Inputs
  lotoStandards = input.required<LotoStandardDto[]>();

  // Outputs
  standardUpdated = output<{ index: number; standard: LotoStandardDto }>();
  standardSubmitted = output<{ index: number; standard: LotoStandardDto }>();
  standardCancelled = output<{ index: number }>();
  addNewRequested = output<void>();
  close = output<void>();

  // Internal state
  activeIndex = signal<number>(0);
  isSaving = signal<boolean>(false);

  // Dragging state
  isDragging = signal<boolean>(false);
  currentZIndex = signal<number>(1100);
  position = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  private dragStartPos = { x: 0, y: 0 };
  private windowStartPos = { x: 0, y: 0 };

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
    const window = this.windowService.registerWindow(this.windowId);
    this.currentZIndex.set(window.zIndex);
  }

  ngOnDestroy(): void {
    this.windowService.unregisterWindow(this.windowId);
    // Clean up event listeners
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  /**
   * Bring window to front when clicked
   */
  onWindowClick(): void {
    const newZIndex = this.windowService.bringToFront(this.windowId);
    this.currentZIndex.set(newZIndex);
  }

  /**
   * Start dragging the window
   */
  onDragStart(event: MouseEvent): void {
    // Only drag from header, not from buttons
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }

    event.preventDefault();
    this.isDragging.set(true);
    this.dragStartPos = { x: event.clientX, y: event.clientY };
    this.windowStartPos = { ...this.position() };

    // Bring to front
    this.onWindowClick();

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging()) return;

    const deltaX = event.clientX - this.dragStartPos.x;
    const deltaY = event.clientY - this.dragStartPos.y;

    this.position.set({
      x: this.windowStartPos.x + deltaX,
      y: this.windowStartPos.y + deltaY
    });
  };

  private onMouseUp = (): void => {
    this.isDragging.set(false);
    this.windowService.updatePosition(this.windowId, this.position());
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

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
}
