import { Injectable, signal, computed } from '@angular/core';
import { FileDto } from '../../../../../models/file/file.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import { RfShape } from '../../../../../shared/image/refactored/models/fr-shape.model';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';

export type LeftMenuTab = 'file' | 'loto-point';
export type DisplayMode = 'table' | 'toggle-menu';

@Injectable({
  providedIn: 'root'
})
export class LotoBuilderStateService {
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

  /** Hovered shape ID (for highlighting) */
  hoveredShapeId = signal<number | null>(null);

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

  // ========== Methods ==========

  /**
   * Set the current file and load its equipment
   */
  setCurrentFile(file: FileDto | null): void {
    this.currentFile.set(file);
    this.currentLotoPoint.set(null);
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
    this.isLotoPointFormOpen.set(true);
  }

  /**
   * Close LOTO point form
   */
  closeLotoPointForm(): void {
    this.isLotoPointFormOpen.set(false);
    this.selectedLotoPointForEdit.set(null);
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
   * Add LOTO standard to the list
   */
  addLotoStandard(standard: LotoStandardDto): void {
    this.selectedLotoStandards.update(standards => [...standards, standard]);
    // Set active index to the newly added standard
    this.activeLotoStandardIndex.set(this.selectedLotoStandards().length - 1);
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
  }
}
