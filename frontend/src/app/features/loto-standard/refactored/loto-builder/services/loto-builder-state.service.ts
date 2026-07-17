import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FileDto } from '../../../../../models/file/file.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import { RfShape } from '../../../../../shared/image/refactored/models/fr-shape.model';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { RfLotoStandardApiService } from '../../services/rf-loto-standard-api.service';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import { SyncUpdateService } from '../../../../../services/sync/sync-update.service';
import { RfLotoStandardStateService } from '../../services/rf-loto-standard-state.service';

export type LeftMenuTab = 'file' | 'loto-point';
export type DisplayMode = 'table' | 'toggle-menu';
export type LotoPointPopupView = 'form' | 'table';

export interface RelatedFileEntry {
  file: FileDto;
  equipment: EquipmentDto;
}

@Injectable({
  providedIn: 'root'
})
export class LotoBuilderStateService {
  private apiService = inject(RfLotoStandardApiService);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(GlobalMessageService);
  private syncUpdateService = inject(SyncUpdateService);
  private standardsStateService = inject(RfLotoStandardStateService);

  constructor() {
    // Reactivity: refetch a standard held in the carousel when a peer tab or
    // peer machine reports a change to it. Self-echoes are filtered out by
    // {@code SyncUpdateService.getEntityTypeUpdates$}, so this only fires
    // for OTHER writers.
    this.syncUpdateService.getEntityTypeUpdates$('LotoStandard')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(evt => this.onRemoteStandardChanged(evt.entityId));

    // LotoPoint changes on any point that belongs to a carousel standard —
    // same rationale as the standards-page's scoped subscription. Debounce
    // isn't strictly necessary here (carousel usually holds ≤ 2 standards)
    // but keeps behavior symmetrical with the standards page.
    this.syncUpdateService.getEntityTypeUpdates$('LotoPoint')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(evt => this.onRemoteLotoPointChanged(evt.entityId));
  }

  /**
   * If the changed standard is one we're building on, refetch it and swap
   * the carousel entry in place. If it's not in the carousel, do nothing —
   * the standards-page state service handles its own list.
   */
  private onRemoteStandardChanged(standardId: number): void {
    const standards = this.selectedLotoStandards();
    const idx = standards.findIndex(s => s?.id === standardId);
    if (idx < 0) return;
    this.apiService.getLotoStandardById(String(standardId)).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        if (!response?.responseData) return;
        const fresh = LotoStandardDto.fromJson(response.responseData);
        this.selectedLotoStandards.update(list => {
          const copy = [...list];
          const i = copy.findIndex(s => s?.id === standardId);
          if (i >= 0) copy[i] = fresh;
          return copy;
        });
      },
      error: (err) => console.error('Builder: failed to refetch remote-changed standard', err),
    });
  }

  /**
   * When a LotoPoint changes remotely, refresh any carousel standard whose
   * point set includes it. Small hot-loop guard: bail if nothing in the
   * carousel references the point.
   */
  private onRemoteLotoPointChanged(pointId: number): void {
    if (pointId == null) return;
    const affected = this.selectedLotoStandards()
      .filter(s => s?.lotoPoints?.some(p => p?.id === pointId));
    if (affected.length === 0) return;
    for (const s of affected) {
      if (s?.id != null) this.onRemoteStandardChanged(s.id);
    }
  }
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

  /** Whether the embedded diagram builder is open */
  isDiagramBuilderOpen = signal<boolean>(false);

  /** Current diagram id opened from the builder context */
  currentDiagramId = signal<number | null>(null);

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

  /** Related files for the currently selected LOTO point (for multi-file navigation) */
  relatedFiles = signal<RelatedFileEntry[]>([]);

  /** Index of the currently active related file */
  activeRelatedFileIndex = signal<number>(0);

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

  /**
   * One-shot "Get Text" mode. When true, the NEXT shape the user draws does
   * NOT create equipment / open the LOTO point flow — instead it just runs
   * OCR on the drawn area and shows the result in a copy-to-clipboard dialog.
   * Auto-disables after one use so the next draw resumes the normal flow.
   */
  isGetTextModeEnabled = signal<boolean>(false);

  /**
   * Text result from a Get Text capture. Non-null means the dialog is open.
   * Cleared when the dialog closes.
   */
  getTextDialogContent = signal<string | null>(null);

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
    this.relatedFiles.set([]);
    this.activeRelatedFileIndex.set(0);
  }

  /**
   * Populate related files from a LOTO point's equipment list.
   * Deduplicates by file ID so each file appears once.
   */
  setRelatedFiles(lotoPoint: LotoPointDto): void {
    if (!lotoPoint.equipmentList || lotoPoint.equipmentList.length === 0) {
      this.relatedFiles.set([]);
      this.activeRelatedFileIndex.set(0);
      return;
    }

    const seen = new Set<number>();
    const entries: RelatedFileEntry[] = [];

    for (const eq of lotoPoint.equipmentList) {
      const file = eq.mainFileObject as FileDto | null | undefined;
      const fileId = file?.id ?? eq.mainFileId;
      if (fileId && !seen.has(fileId)) {
        seen.add(fileId);
        entries.push({
          file: file ? (file as FileDto) : new FileDto({ id: fileId } as any),
          equipment: eq,
        });
      }
    }

    this.relatedFiles.set(entries);
    this.activeRelatedFileIndex.set(0);
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
   * Toggle one-shot Get Text mode. Idempotent; the next draw consumes it.
   */
  toggleGetTextMode(): void {
    this.isGetTextModeEnabled.set(!this.isGetTextModeEnabled());
  }

  /**
   * Open the Get Text result dialog. Also disables the one-shot mode so the
   * next draw runs the normal flow.
   */
  openGetTextDialog(text: string): void {
    this.isGetTextModeEnabled.set(false);
    this.getTextDialogContent.set(text);
  }

  /** Close the Get Text result dialog. */
  closeGetTextDialog(): void {
    this.getTextDialogContent.set(null);
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

  openDiagramBuilder(diagramId?: number | null): void {
    this.currentDiagramId.set(diagramId ?? null);
    this.isDiagramBuilderOpen.set(true);
  }

  closeDiagramBuilder(): void {
    this.isDiagramBuilderOpen.set(false);
    this.currentDiagramId.set(null);
  }

  /**
   * Add LOTO standard to the builder carousel.
   * <p>
   * If the standard has been persisted (has an id), also mirror it into the
   * standards-page shared list so the left menu on the other route reflects
   * the change immediately — no more "creating a standard in the builder
   * doesn't refresh the left menu" gap.
   */
  addLotoStandard(standard: LotoStandardDto): void {
    this.selectedLotoStandards.update(standards => [...standards, standard]);
    // Set active index to the newly added standard
    this.activeLotoStandardIndex.set(this.selectedLotoStandards().length - 1);
    // Enable building mode to show the carousel
    this.isLotoBuildingMode.set(true);

    // Mirror into the shared standards-page list so both surfaces stay in
    // sync within the same window. Only for persisted standards — an unsaved
    // in-carousel draft shouldn't show up in the left menu (per user decision
    // #3 on the reactivity plan).
    if (standard?.id) {
      this.standardsStateService.updateLotoStandardInList(standard);
    }

    // If there's a pending LOTO point, add it to this new standard
    const pendingPoint = this.currentLotoPoint();
    if (pendingPoint) {
      this.addLotoPointToActiveStandard(pendingPoint);
      this.setCurrentLotoPoint(null); // Clear the pending point
    }
  }

  /**
   * Update LOTO standard at specific index. Also mirrors into the standards-page
   * shared list when the DTO has an id, so the left menu / table on the other
   * route stays coherent without needing a manual refresh.
   */
  updateLotoStandard(index: number, standard: LotoStandardDto): void {
    this.selectedLotoStandards.update(standards => {
      const updated = [...standards];
      if (index >= 0 && index < updated.length) {
        updated[index] = standard;
      }
      return updated;
    });
    if (standard?.id) {
      this.standardsStateService.updateLotoStandardInList(standard);
    }
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
   * Add LOTO point to currently active standard.
   *
   * <p>Model B2: when the active standard is APPROVED, the backend records a
   * proposal instead of mutating the standard. Reflect that semantics in the
   * UI — DON'T optimistically push the point into the local lotoPoints list
   * (it would diverge from server truth and confuse the user about whether
   * the change took effect). A toast tells the user the proposal was
   * recorded; the point becomes visible only after a reviewer KEEPs the
   * proposal and closes the review.
   */
  addLotoPointToActiveStandard(lotoPoint: LotoPointDto): void {
    const index = this.activeLotoStandardIndex();
    const standard = this.activeLotoStandard();

    if (!standard) return;
    const existingPoints = standard.lotoPoints || [];
    if (existingPoints.some(p => p.id === lotoPoint.id)) {
      console.warn('LOTO point already exists in this standard');
      return;
    }

    const approved = this.isApprovedStandard(standard);

    if (!approved) {
      // Direct-apply path: optimistically update local state.
      const updatedStandard = new LotoStandardDto({
        ...standard,
        lotoPoints: [...existingPoints, lotoPoint]
      });
      this.updateLotoStandard(index, updatedStandard);
    }

    if (standard.id && lotoPoint.id) {
      this.apiService.addLotoPointToStandard(standard.id, lotoPoint.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            if (approved) {
              this.messageService.showInfo(
                `"${lotoPoint.tagNumber ?? 'Point'}" recorded as a pending proposal — awaiting CA/Manager review.`
              );
            }
          },
          error: (err) => console.error('Failed to add LOTO point to standard:', err)
        });
    }
  }

  /** True iff the standard's developmentStatus is APPROVED (value object OR plain string). */
  private isApprovedStandard(s: LotoStandardDto | null | undefined): boolean {
    if (!s) return false;
    const ds: unknown = (s as { developmentStatus?: unknown }).developmentStatus;
    if (typeof ds === 'string') return ds === 'APPROVED';
    if (ds && typeof ds === 'object' && 'name' in (ds as Record<string, unknown>)) {
      return (ds as { name?: unknown }).name === 'APPROVED';
    }
    return false;
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
   * Refresh equipment data.
   * This is typically called after bulk edits are applied.
   * The actual refresh happens automatically via lotoPointUpdated$ subscription
   * in the right panel, so this method serves as a documentation hook.
   */
  refreshEquipment(): void {
    // Updates are automatically handled via the lotoPointUpdated$ subscription
    // in loto-builder-right-panel.component.ts which calls updateLotoPointInEquipment()
    console.log('[LotoBuilderState] refreshEquipment called - updates propagate via lotoPointUpdated$');
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
    this.hideLotoPointInfoWindow(); // also clears relatedFiles and activeRelatedFileIndex
    this.setPendingEquipment(null);
    // Reset text recognition state
    this.recognizedText.set(null);
    this.tableSearchTerm.set(null);
    this.lotoPointPopupView.set('form');
    this.isEditMode.set(false);
    this.isDiagramBuilderOpen.set(false);
    this.currentDiagramId.set(null);
    // Reset counterpart state
    this.resetCounterpartState();
  }
}
