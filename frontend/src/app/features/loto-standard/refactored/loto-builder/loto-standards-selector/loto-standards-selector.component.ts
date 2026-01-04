import { Component, computed, inject, output, signal, DestroyRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { RfLotoStandardApiService } from '../../../refactored/services/rf-loto-standard-api.service';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DraggableWindowService } from '../services/draggable-window.service';

@Component({
  selector: 'app-loto-standards-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loto-standards-selector.component.html',
  styleUrl: './loto-standards-selector.component.css',
})
export class LotoStandardsSelectorComponent implements OnInit, OnDestroy {
  private builderState = inject(LotoBuilderStateService);
  private apiService = inject(RfLotoStandardApiService);
  private destroyRef = inject(DestroyRef);
  private windowService = inject(DraggableWindowService);

  // Window ID for draggable service
  readonly windowId = 'loto-selector';

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

  // Dragging state
  isDragging = signal<boolean>(false);
  currentZIndex = signal<number>(1100);
  position = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  private dragStartPos = { x: 0, y: 0 };
  private windowStartPos = { x: 0, y: 0 };

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

  ngOnInit(): void {
    // Register with draggable window service
    const windowState = this.windowService.registerWindow(this.windowId, { x: 0, y: 0 });
    this.currentZIndex.set(windowState.zIndex);
    this.position.set(windowState.position);
  }

  ngOnDestroy(): void {
    // Cleanup drag listeners
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);

    // Unregister from window service
    this.windowService.unregisterWindow(this.windowId);
  }

  /**
   * Bring window to front on click
   */
  onWindowClick(): void {
    const newZIndex = this.windowService.bringToFront(this.windowId);
    this.currentZIndex.set(newZIndex);
  }

  /**
   * Start dragging the window
   */
  onDragStart(event: MouseEvent): void {
    // Only start drag on left mouse button and from header
    if (event.button !== 0) return;

    event.preventDefault();
    this.isDragging.set(true);
    this.onWindowClick();

    this.dragStartPos = { x: event.clientX, y: event.clientY };
    this.windowStartPos = { ...this.position() };

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  /**
   * Handle mouse move during drag
   */
  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging()) return;

    const deltaX = event.clientX - this.dragStartPos.x;
    const deltaY = event.clientY - this.dragStartPos.y;

    const newPosition = {
      x: this.windowStartPos.x + deltaX,
      y: this.windowStartPos.y + deltaY,
    };

    this.position.set(newPosition);
    this.windowService.updatePosition(this.windowId, newPosition);
  };

  /**
   * Handle mouse up to end drag
   */
  private onMouseUp = (): void => {
    this.isDragging.set(false);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

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
          this.availableStandards.set(response.responseData?.content || []);
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
