import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FileDto } from '../../../../../models/file/file.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import { RfShape } from '../../../../../shared/image/refactored/models/fr-shape.model';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { RfLotoStandardApiService } from '../../services/rf-loto-standard-api.service';

export type LeftMenuTab = 'file' | 'loto-point';
export type DisplayMode = 'table' | 'toggle-menu';
export type LotoPointPopupView = 'form' | 'table';

@Injectable({
  providedIn: 'root'
})
export class LotoBuilderStateService {
  private apiService = inject(RfLotoStandardApiService);
  private destroyRef = inject(DestroyRef);
  // ========== Left Panel State ==========

  /** Current active tab in left panel */
  leftMenuTab = signal<LeftMenuTab>('file');

  /** Display mode for left panel content */
  displayMode = signal<DisplayMode>('toggle-menu');

  /** Left panel width (for resizing) */
  leftPanelWidth = signal<number>(400);

  // ========== Current Context ==========

  /** Currently selected file */
  currentFile = signal<FileDto | null>(null);

  /** Currently selected LOTO point */
  currentLotoPoint = signal<LotoPointDto | null>(null);

  /** Equipment for current file */
  currentEquipment = signal<EquipmentDto[]>([]);

  /** Shapes derived from equipment */
  currentShapes = signal<RfShape[]>([]);

  // ========== LOTO Building Mode ==========

  /** Whether LOTO building mode is active */
  isLotoBuildingMode = signal<boolean>(false);

  /** Selected LOTO standards for building mode */
  selectedLotoStandards = signal<LotoStandardDto[]>([]);

  /** Currently active LOTO standard index in carousel */
  activeLotoStandardIndex = signal<number>(0);

  // ========== UI State ==========

  /** Whether the builder popup is open */
  isBuilderOpen = signal<boolean>(false);

  /** Hovered shape ID (for highlighting) */
  hoveredShapeId = signal<number | null>(null);

  /** Selected shape ID (for selection with handles) */
  selectedShapeId = signal<number | null>(null);

  /** Hovered LOTO point (for highlighting) */
  hoveredLotoPoint = signal<LotoPointDto | null>(null);

  /** Whether LOTO point table popup is open */
  isLotoPointTableOpen = signal<boolean>(false);

  /** Whether LOTO point form is open */
  isLotoPointFormOpen = signal<boolean>(false);

  /** Whether LOTO standards popup is open */
  isLotoStandardsPopupOpen = signal<boolean>(false);

  /** Whether LOTO point info window is shown */
  showLotoPointInfo = signal<boolean>(false);

  /** LOTO point to display in info window */
  infoWindowLotoPoint = signal<LotoPointDto | null>(null);

  /** Selected LOTO point for form editing */
  selectedLotoPointForEdit = signal<LotoPointDto | null>(null);

  /** Newly created equipment (pending LOTO point association) */
  pendingEquipment = signal<EquipmentDto | null>(null);

  // ========== Text Recognition State ==========

  /** Whether text recognition is enabled */
  isTextRecognitionEnabled = signal<boolean>(true);

  /** Recognized text from OCR */
  recognizedText = signal<string | null>(null);

  /** Pre-filter search term for loto point table (from text recognition) */
  tableSearchTerm = signal<string | null>(null);

  // ========== Processing State ==========

  /** Whether a shape is being processed (saved/OCR) */
  isProcessingShape = signal<boolean>(false);

  /** Processing message to display */
  processingMessage = signal<string>('');

  // ========== Form/Table View State ==========

  /** Current view mode in loto point popup (form or table) */
  lotoPointPopupView = signal<LotoPointPopupView>('form');

  /** Whether we are editing an existing LOTO point (vs creating new) */
  isEditMode = signal<boolean>(false);

  // ========== Computed Values ==========

  /** All LOTO points from current file's equipment */
  allLotoPointsInFile = computed(() => {
    const equipment = this.currentEquipment();
    const lotoPoints: LotoPointDto[] = [];

    equipment.forEach(eq => {
      if (eq.lotoPoints && eq.lotoPoints.length > 0) {
        eq.lotoPoints.forEach(lp => {
          // Avoid duplicates
          if (!lotoPoints.some(existing => existing.id === lp.id)) {
            lotoPoints.push(lp);
          }
        });
      }
    });

    return lotoPoints;
  });

  /** Whether builder is in a dirty state (unsaved changes) */
  hasUnsavedChanges = signal<boolean>(false);

  /** Currently active LOTO standard */
  activeLotoStandard = computed(() => {
    const standards = this.selectedLotoStandards();
    const index = this.activeLotoStandardIndex();
    return standards[index] || null;
  });

  /** Whether carousel should be visible */
  isCarouselVisible = computed(() => {
    return this.isLotoBuildingMode() && this.selectedLotoStandards().length > 0;
  });

  // ========== Dual Form / Counterpart State (for contextual guide) ==========

  /** Whether the current LOTO point is unit-specific (tag starts with 01 or 02) */
  isUnitSpecificLotoPoint = signal<boolean>(false);

  /** Whether a counterpart LOTO point has been selected/loaded */
  hasCounterpartLotoPoint = signal<boolean>(false);

  /** Whether the counterpart selection dialog is open */
  isCounterpartDialogOpen = signal<boolean>(false);

  /** Whether a suggested counterpart was found */
  hasSuggestedCounterpart = signal<boolean>(false);

  // ========== Methods ==========

  /**
   * Set the current file and load its equipment
   * @param file The file to set
   * @param preserveLotoPoint If true, don't clear the current LOTO point (used when navigating via LOTO point click)
   */
  setCurrentFile(file: FileDto | null, preserveLotoPoint: boolean = false): void {
    this.currentFile.set(file);
    if (!preserveLotoPoint) {
      this.currentLotoPoint.set(null);
    }
    this.hasUnsavedChanges.set(false);
  }

  /**
   * Set current equipment and derive shapes
   */
  setCurrentEquipment(equipment: EquipmentDto[]): void {
    this.currentEquipment.set(equipment);
  }

  /**
   * Set current LOTO point
   */
  setCurrentLotoPoint(lotoPoint: LotoPointDto | null): void {
    this.currentLotoPoint.set(lotoPoint);
  }

  /**
   * Open LOTO point table popup
   */
  openLotoPointTable(): void {
    this.isLotoPointTableOpen.set(true);
  }

  /**
   * Close LOTO point table popup
   */
  closeLotoPointTable(): void {
    this.isLotoPointTableOpen.set(false);
    this.hoveredShapeId.set(null);
  }

  /**
   * Toggle LOTO point table popup
   */
  toggleLotoPointTable(): void {
    this.isLotoPointTableOpen.set(!this.isLotoPointTableOpen());
    if (!this.isLotoPointTableOpen()) {
      this.hoveredShapeId.set(null);
    }
  }

  /**
   * Open LOTO point form for editing
   */
  openLotoPointForm(lotoPoint: LotoPointDto | null = null): void {
    this.selectedLotoPointForEdit.set(lotoPoint);
    // Set edit mode if we have an existing LOTO point
    this.isEditMode.set(lotoPoint !== null);
    // Always start with form view when editing an existing LOTO point
    if (lotoPoint !== null) {
      this.lotoPointPopupView.set('form');
    }
    this.isLotoPointFormOpen.set(true);
  }

  /**
   * Close LOTO point form
   */
  closeLotoPointForm(): void {
    this.isLotoPointFormOpen.set(false);
    this.selectedLotoPointForEdit.set(null);
    this.isEditMode.set(false);
  }

  /**
   * Open LOTO standards popup
   */
  openLotoStandardsPopup(): void {
    this.isLotoStandardsPopupOpen.set(true);
  }

  /**
   * Close LOTO standards popup
   */
  closeLotoStandardsPopup(): void {
    this.isLotoStandardsPopupOpen.set(false);
  }

  /**
   * Toggle LOTO building mode
   */
  toggleLotoBuildingMode(): void {
    this.isLotoBuildingMode.set(!this.isLotoBuildingMode());
    if (!this.isLotoBuildingMode()) {
      this.selectedLotoStandards.set([]);
    }
  }

  /**
   * Show LOTO point info in info window
   */
  showLotoPointInfoWindow(lotoPoint: LotoPointDto): void {
    this.infoWindowLotoPoint.set(lotoPoint);
    this.showLotoPointInfo.set(true);
  }

  /**
   * Hide LOTO point info window
   */
  hideLotoPointInfoWindow(): void {
    this.showLotoPointInfo.set(false);
    this.infoWindowLotoPoint.set(null);
  }

  /**
   * Set pending equipment (after drawing, before LOTO point association)
   */
  setPendingEquipment(equipment: EquipmentDto | null): void {
    this.pendingEquipment.set(equipment);
  }

  /**
   * Toggle text recognition
   */
  toggleTextRecognition(): void {
    this.isTextRecognitionEnabled.set(!this.isTextRecognitionEnabled());
  }

  /**
   * Set recognized text from OCR
   */
  setRecognizedText(text: string | null): void {
    this.recognizedText.set(text);
  }

  /**
   * Set table search term (for pre-filtering)
   */
  setTableSearchTerm(term: string | null): void {
    this.tableSearchTerm.set(term);
  }

  /**
   * Start processing state with message
   */
  startProcessing(message: string): void {
    this.isProcessingShape.set(true);
    this.processingMessage.set(message);
  }

  /**
   * Stop processing state
   */
  stopProcessing(): void {
    this.isProcessingShape.set(false);
    this.processingMessage.set('');
  }

  /**
   * Switch popup view to form
   */
  switchToFormView(): void {
    this.lotoPointPopupView.set('form');
  }

  /**
   * Switch popup view to table
   */
  switchToTableView(): void {
    this.lotoPointPopupView.set('table');
  }

  /**
   * Toggle between form and table view
   */
  togglePopupView(): void {
    const current = this.lotoPointPopupView();
    this.lotoPointPopupView.set(current === 'form' ? 'table' : 'form');
  }

  // ========== Dual Form / Counterpart Methods ==========

  /**
   * Update unit-specific state based on tag number
   * Called from loto-builder-form-popup when form values change
   */
  setIsUnitSpecific(isUnitSpecific: boolean): void {
    this.isUnitSpecificLotoPoint.set(isUnitSpecific);
  }

  /**
   * Update counterpart loaded state
   * Called from loto-builder-form-popup when counterpart is selected/loaded
   */
  setHasCounterpart(hasCounterpart: boolean): void {
    this.hasCounterpartLotoPoint.set(hasCounterpart);
  }

  /**
   * Set counterpart dialog open state
   * Called from loto-builder-form-popup when dialog opens/closes
   */
  setCounterpartDialogOpen(isOpen: boolean): void {
    this.isCounterpartDialogOpen.set(isOpen);
  }

  /**
   * Set suggested counterpart found state
   * Called from loto-builder-form-popup when search finds a suggestion
   */
  setHasSuggestedCounterpart(hasSuggested: boolean): void {
    this.hasSuggestedCounterpart.set(hasSuggested);
  }

  /**
   * Reset all counterpart-related state
   */
  resetCounterpartState(): void {
    this.isUnitSpecificLotoPoint.set(false);
    this.hasCounterpartLotoPoint.set(false);
    this.isCounterpartDialogOpen.set(false);
    this.hasSuggestedCounterpart.set(false);
  }

  /**
   * Open LOTO point popup with table view and pre-filtered search
   */
  openLotoPointTableWithSearch(searchTerm: string, equipment: EquipmentDto): void {
    this.setPendingEquipment(equipment);
    this.setTableSearchTerm(searchTerm);
    this.isEditMode.set(false);
    this.lotoPointPopupView.set('table');
    this.isLotoPointFormOpen.set(true);
  }

  /**
   * Open LOTO point popup with empty form
   */
  openLotoPointFormForNewEquipment(equipment: EquipmentDto): void {
    this.setPendingEquipment(equipment);
    this.selectedLotoPointForEdit.set(null);
    this.isEditMode.set(false);
    this.lotoPointPopupView.set('form');
    this.isLotoPointFormOpen.set(true);
  }

  /**
   * Add LOTO standard to the list
   */
  addLotoStandard(standard: LotoStandardDto): void {
    this.selectedLotoStandards.update(standards => [...standards, standard]);
    // Set active index to the newly added standard
    this.activeLotoStandardIndex.set(this.selectedLotoStandards().length - 1);
    // Enable building mode to show the carousel
    this.isLotoBuildingMode.set(true);

    // If there's a pending LOTO point, add it to this new standard
    const pendingPoint = this.currentLotoPoint();
    if (pendingPoint) {
      this.addLotoPointToActiveStandard(pendingPoint);
      this.setCurrentLotoPoint(null); // Clear the pending point
    }
  }

  /**
   * Update LOTO standard at specific index
   */
  updateLotoStandard(index: number, standard: LotoStandardDto): void {
    this.selectedLotoStandards.update(standards => {
      const updated = [...standards];
      if (index >= 0 && index < updated.length) {
        updated[index] = standard;
      }
      return updated;
    });
  }

  /**
   * Remove LOTO standard at specific index
   */
  removeLotoStandard(index: number): void {
    this.selectedLotoStandards.update(standards => {
      const updated = standards.filter((_, i) => i !== index);
      return updated;
    });

    // Adjust active index if needed
    const currentActive = this.activeLotoStandardIndex();
    if (currentActive >= this.selectedLotoStandards().length) {
      this.activeLotoStandardIndex.set(Math.max(0, this.selectedLotoStandards().length - 1));
    }
  }

  /**
   * Set active LOTO standard index
   */
  setActiveLotoStandardIndex(index: number): void {
    if (index >= 0 && index < this.selectedLotoStandards().length) {
      this.activeLotoStandardIndex.set(index);
    }
  }

  /**
   * Add LOTO point to currently active standard
   */
  addLotoPointToActiveStandard(lotoPoint: LotoPointDto): void {
    const index = this.activeLotoStandardIndex();
    const standard = this.activeLotoStandard();

    if (standard) {
      const existingPoints = standard.lotoPoints || [];

      // Check if point already exists
      if (existingPoints.some(p => p.id === lotoPoint.id)) {
        console.warn('LOTO point already exists in this standard');
        return;
      }

      const updatedStandard = new LotoStandardDto({
        ...standard,
        lotoPoints: [...existingPoints, lotoPoint]
      });

      this.updateLotoStandard(index, updatedStandard);

      // If standard is saved (has ID), immediately persist to server
      if (standard.id && lotoPoint.id) {
        this.apiService.addLotoPointToStandard(standard.id, lotoPoint.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            error: (err) => console.error('Failed to add LOTO point to standard:', err)
          });
      }
    }
  }

  /**
   * Toggle LOTO building mode with carousel
   */
  toggleCarousel(): void {
    const isVisible = this.isCarouselVisible();

    if (isVisible) {
      // Close carousel - ask for confirmation if standards exist
      this.isLotoBuildingMode.set(false);
    } else {
      // Open carousel
      this.isLotoBuildingMode.set(true);

      // If no standards, open the selector popup
      if (this.selectedLotoStandards().length === 0) {
        this.openLotoStandardsPopup();
      }
    }
  }

  /**
   * Initialize builder (called when page loads)
   */
  initializeBuilder(): void {
    this.isBuilderOpen.set(true);
  }

  /**
   * Reset builder state
   */
  reset(): void {
    this.currentFile.set(null);
    this.currentLotoPoint.set(null);
    this.currentEquipment.set([]);
    this.currentShapes.set([]);
    this.selectedLotoStandards.set([]);
    this.activeLotoStandardIndex.set(0);
    this.isLotoBuildingMode.set(false);
    this.hasUnsavedChanges.set(false);
    this.closeLotoPointForm();
    this.closeLotoPointTable();
    this.closeLotoStandardsPopup();
    this.hideLotoPointInfoWindow();
    this.setPendingEquipment(null);
    // Reset text recognition state
    this.recognizedText.set(null);
    this.tableSearchTerm.set(null);
    this.lotoPointPopupView.set('form');
    this.isEditMode.set(false);
    // Reset counterpart state
    this.resetCounterpartState();
  }
}
