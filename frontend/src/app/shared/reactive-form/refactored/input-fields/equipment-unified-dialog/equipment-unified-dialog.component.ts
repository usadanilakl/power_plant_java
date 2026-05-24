import { Component, inject, input, output, signal, computed, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InteractiveImageComponent } from '../../../../image/refactored/interactive-image/interactive-image.component';
import { RfToggleMenuComponent } from '../../../../menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
import { RfLotoPointTableComponent } from '../../../../../features/loto-points/refactored/rf-loto-point-table/rf-loto-point-table.component';
import { EquipmentDialogFileService } from '../services/equipment-dialog-file.service';
// Isolated table services so the embedded LOTO point table has its own state
import { RfLotoPointStateService } from '../../../../../features/loto-points/refactored/services/rf-loto-point-state.service';
import { TableSelectionService } from '../../../../table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../table/refactored/services/table-drag.service';
import { TableStateService } from '../../../../table/refactored/services/table-state.service';
import { TableSearchService } from '../../../../table/refactored/services/table-search.service';
import { TableSortService } from '../../../../table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../table/refactored/services/table-sync.service';
import { TableClickService } from '../../../../table/refactored/services/table-click.service';
import { TableControlsService } from '../../../../table/refactored/services/table-controls.service';
import { TableDataService } from '../../../../table/refactored/services/table-data.service';
import { LotoPointBulkEditService } from '../../../../../features/loto-points/refactored/services/loto-point-bulk-edit.service';
import { RfLotoPointTableDataService } from '../../../../../features/loto-points/refactored/rf-loto-point-table/rf-loto-point-table-data.service';
import { EquipmentMapperService } from '../../../../../features/equipment/refactored/services/equipment-mapper.service';
import { RfEquipmentService } from '../../../../../features/equipment/refactored/services/rf-equipment.service';
import { RfLotoPointApiService } from '../../../../../features/loto-points/refactored/services/rf-loto-point-api.service';
import { RfValueService } from '../../../../../features/values/refactored/services/rf-value.service';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { ValueDto } from '../../../../../models/value.model';
import { RfValueDto } from '../../../../../features/values/refactored/models/rf-value.model';
import { NestedItem } from '../../../../../models/ui/nested-item.model';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';
import { GuideDirective } from '../../../../guide/guide.directive';

/**
 * Unified Equipment Dialog
 *
 * Combines browsing and drawing in a single interface:
 * - Left-click on existing equipment shape to select it
 * - Right-click and drag to draw a new equipment shape
 *
 * Flow for zero energy mode (requireLotoPointForUnassociated=true):
 * 1. User draws shape or selects equipment without LOTO point
 * 2. Click "Save & Select" -> Equipment is saved (if drawn)
 * 3. LOTO form appears for equipment without association
 * 4. User fills LOTO form and submits
 * 5. Equipment is updated with LOTO point
 * 6. Click "Select Equipment" to close and return the fully associated equipment
 */
@Component({
  selector: 'app-equipment-unified-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InteractiveImageComponent,
    RfToggleMenuComponent,
    RfLotoPointTableComponent,
    GuideDirective
  ],
  providers: [
    EquipmentDialogFileService,
    // Isolated instances for the embedded LOTO point table (when in 'loto-points' search mode)
    RfLotoPointStateService,
    TableSelectionService,
    TableStateService,
    TableDragService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    TableClickService,
    TableControlsService,
    LotoPointBulkEditService,
    RfLotoPointTableDataService,
    { provide: TableDataService, useClass: RfLotoPointTableDataService },
  ],
  templateUrl: './equipment-unified-dialog.component.html',
  styleUrl: './equipment-unified-dialog.component.css'
})
export class EquipmentUnifiedDialogComponent {
  // Services
  private fileService = inject(EquipmentDialogFileService);
  private equipmentMapper = inject(EquipmentMapperService);
  private equipmentService = inject(RfEquipmentService);
  private lotoPointApiService = inject(RfLotoPointApiService);
  private valueService = inject(RfValueService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // Inputs
  requireLotoPointForDrawn = input<boolean>(false);
  requireLotoPointForUnassociated = input<boolean>(false);
  immediateSelection = input<boolean>(false);
  hideActions = input<boolean>(false);

  // Outputs
  equipmentAcquired = output<EquipmentDto>();
  equipmentDrawnForLotoPoint = output<EquipmentDto>(); // Keep for backwards compatibility but won't use
  close = output<void>();

  // Delegated to file service
  selectedFile = this.fileService.selectedFile;
  fileMenuItems = this.fileService.menuItems;
  currentFileLink = this.fileService.currentFileLink;

  // State - mimicking wizard's approach
  selectedEquipment = signal<EquipmentDto | null>(null);  // Currently selected/saved equipment
  drawnShape = signal<RfShape | null>(null);  // Drawn shape (before saving)
  highlightEquipmentId = signal<number | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  /**
   * Search mode toggle:
   *  - 'files'       = browse P&IDs in the toggle menu (default, original behavior)
   *  - 'loto-points' = search by LOTO point. Clicking a point opens its associated P&ID
   *                    (if any) and highlights its equipment; otherwise emits the LOTO
   *                    point's first equipment as the selection.
   */
  searchMode = signal<'files' | 'loto-points'>('files');

  /** LOTO point most recently picked in 'loto-points' mode (for UI feedback). */
  pickedLotoPoint = signal<LotoPointDto | null>(null);

  /**
   * Equipment ID we want to auto-select once the related file finishes loading
   * (i.e. once `selectedFile.points` becomes populated). Cleared on use.
   */
  pendingEquipmentIdToSelect = signal<number | null>(null);

  setSearchMode(mode: 'files' | 'loto-points'): void {
    this.searchMode.set(mode);
    // Note: do NOT clear `pickedLotoPoint` here. The embedded table re-emits its
    // restored selection on remount, which would re-trigger `onLotoPointPicked`
    // (with the guard bypassed) and bounce us back to file mode.
  }

  // LOTO Point Form State - shown when equipment needs LOTO point
  showLotoPointForm = signal(false);
  pendingEquipmentForLotoPoint = signal<EquipmentDto | null>(null);  // Equipment waiting for LOTO point
  isCreatingLotoPoint = signal(false);
  lotoPointFormError = signal<string | null>(null);

  // Value options for LOTO point form dropdowns
  eqTypeOptions = computed(() => this.valueService.getValuesByCategory('eqType'));
  locationOptions = computed(() => this.valueService.getValuesByCategory('location'));
  isoPosOptions = computed(() => this.valueService.getValuesByCategory('isoPos'));
  normPosOptions = computed(() => this.valueService.getValuesByCategory('normPos'));

  // LOTO Point quick-create form
  lotoPointForm: FormGroup = this.fb.group({
    tagNumber: ['', Validators.required],
    description: ['', Validators.required],
    eqType: [null],
    location: [null],
    isoPos: [null],
    normPos: [null],
  });

  constructor() {
    /**
     * After picking a LOTO point and loading its related file, auto-select the
     * point's equipment shape so the user only has to click "Save & Select" to
     * pass the selection to the parent.
     *
     * Fires when `selectedFile.points` becomes populated AND a pending equipment
     * ID is set.
     */
    effect(() => {
      const file = this.selectedFile();
      const pendingId = this.pendingEquipmentIdToSelect();
      if (!file || !pendingId) return;

      const eq = (file.points ?? []).find((e: EquipmentDto) => e.id === pendingId);
      if (!eq) return; // points may load later — effect will re-run

      const enriched = new EquipmentDto({
        ...eq,
        mainFileId: file.id,
        mainFileObject: file,
      });
      this.selectedEquipment.set(enriched);
      this.highlightEquipmentId.set(pendingId);
      this.pendingEquipmentIdToSelect.set(null); // consume
    });
  }

  // Equipment from selected file
  equipment = computed(() => {
    const file = this.selectedFile();
    if (!file) return [];
    return file.points ?? [];
  });

  // Equipment shapes for InteractiveImageComponent
  equipmentShapes = computed(() => {
    const eq = this.equipment();
    const drawn = this.drawnShape();
    const selected = this.selectedEquipment();

    // Map existing equipment to shapes
    const shapes = eq.map((e: EquipmentDto) =>
      this.equipmentMapper.mapToRfShape(e)
    ).filter(s => s !== null) as RfShape[];

    // Highlight selected equipment
    if (selected?.id) {
      shapes.forEach((shape: RfShape) => {
        if (shape.id === selected.id) {
          shape.isSelected = true;
          shape.color = '#FF0000';
        }
      });
    }

    // Add drawn shape if exists (with highlight)
    if (drawn) {
      const drawnWithHighlight = {
        ...drawn,
        isSelected: true,
        color: '#00FF00' // Green for newly drawn
      };
      shapes.push(drawnWithHighlight);
    }

    return shapes;
  });

  // Check if we need to show LOTO form
  needsLotoPointForm = computed(() => {
    return this.showLotoPointForm() && this.pendingEquipmentForLotoPoint() !== null;
  });

  // Can confirm - equipment is selected and has LOTO point (if required)
  canConfirm = computed(() => {
    const selected = this.selectedEquipment();
    const drawn = this.drawnShape();
    const pendingLoto = this.pendingEquipmentForLotoPoint();

    // If there's a pending equipment waiting for LOTO point, can't confirm yet
    if (pendingLoto) {
      return false;
    }

    // If there's a drawn shape, user needs to click to save it first
    if (drawn) {
      return true; // Enable button to trigger save flow
    }

    // If equipment is selected and has LOTO point (or LOTO not required)
    if (selected) {
      if (this.requireLotoPointForUnassociated()) {
        // Must have LOTO point
        return selected.lotoPoints && selected.lotoPoints.length > 0;
      }
      return true;
    }

    return false;
  });

  // Status message for user guidance
  statusMessage = computed(() => {
    const selected = this.selectedEquipment();
    const drawn = this.drawnShape();
    const pending = this.pendingEquipmentForLotoPoint();

    if (pending) {
      return `Equipment saved. Fill out LOTO Point form below to associate.`;
    }

    if (drawn) {
      return 'New shape drawn. Click "Save & Select" to save the equipment.';
    }

    if (selected) {
      const lotoTag = selected.lotoPoints?.[0]?.tagNumber;
      if (lotoTag) {
        return `Selected: ${this.getEquipmentLabel(selected)} (LOTO: ${lotoTag})`;
      }
      if (this.requireLotoPointForUnassociated()) {
        return `Selected: ${this.getEquipmentLabel(selected)} - No LOTO Point. Will prompt for creation.`;
      }
      return `Selected: ${this.getEquipmentLabel(selected)}`;
    }

    return 'Left-click to select existing equipment, or right-click and drag to draw new.';
  });

  // Get display label for equipment
  getEquipmentLabel(equipment: EquipmentDto): string {
    if (equipment.lotoPoints?.[0]?.tagNumber) {
      return equipment.lotoPoints[0].tagNumber;
    }
    if (equipment.tagNumber) {
      return equipment.tagNumber;
    }
    return `Equipment #${equipment.id}`;
  }

  onFileSelect(fileItem: NestedItem) {
    this.fileService.selectFileFromNestedItem(fileItem);
    this.clearSelection();
  }

  /**
   * Handle a LOTO point pick from the embedded LOTO point table (search-by-loto-point mode).
   *
   * Resolution:
   *   1. Fetch related files for the point.
   *   2. If a file exists, switch to file mode, load it, and pre-select the point's
   *      first equipment so the user sees the shape highlighted on the P&ID.
   *   3. If no related file exists but the point has equipment, emit the first
   *      equipment as the selection (`as-is` pick).
   *   4. If neither, show an error.
   */
  onLotoPointPicked(point: LotoPointDto | null): void {
    if (!point?.id) return;

    // Re-mount of the embedded table re-emits the previously-selected row.
    // Ignore re-picks of the same point — otherwise the dialog snaps back
    // to file mode every time the user clicks the LOTO Points tab.
    if (this.pickedLotoPoint()?.id === point.id) return;

    this.pickedLotoPoint.set(point);
    this.error.set(null);

    this.lotoPointApiService
      .getRelatedFiles(point.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const files = res?.responseData ?? [];
          if (files.length > 0 && files[0].id != null) {
            // Stage the equipment to auto-select once the file's points load
            const firstEqId = point.equipmentList?.[0]?.id ?? point.equipmentIdList?.[0] ?? null;
            this.pendingEquipmentIdToSelect.set(firstEqId);

            // Load the FULL file (with `points`) so equipment shapes can render.
            // We stay in 'loto-points' mode — the right-side viewer renders the
            // file regardless of left-panel mode, so the user can browse multiple
            // points in the filtered table while the P&ID updates next to it.
            this.fileService.selectFileById(files[0].id);
          } else {
            // No P&ID — accept the LOTO point's existing equipment as the selection
            const firstEq = point.equipmentList?.[0];
            if (firstEq) {
              const enriched = new EquipmentDto({ ...firstEq });
              this.selectedEquipment.set(enriched);
              if (this.immediateSelection()) {
                this.equipmentAcquired.emit(enriched);
              }
            } else {
              this.error.set('Selected LOTO point has no associated equipment or P&ID.');
            }
          }
        },
        error: (err) => {
          console.error('Failed to load related files for LOTO point', err);
          this.error.set('Could not load files for the selected LOTO point.');
        },
      });
  }

  /** Wrapper for the table's `selectedItemsEvent` — takes the first selected row. */
  onLotoPointSelectedFromTable(items: LotoPointDto[]): void {
    if (items && items.length > 0) {
      this.onLotoPointPicked(items[0]);
    }
  }

  // Handle click on existing equipment shape
  onEquipmentClicked(shape: RfShape) {
    const selectedId = shape.id;
    if (selectedId !== null) {
      const eq = this.equipment();
      const selected = eq.find((e: EquipmentDto) => e.id === selectedId);
      if (selected) {
        // Clear any drawn shape when selecting existing
        this.drawnShape.set(null);

        // Enrich with file info
        const file = this.selectedFile();
        const enrichedEquipment = new EquipmentDto({
          ...selected,
          mainFileId: file?.id,
          mainFileObject: file || undefined
        });

        this.selectedEquipment.set(enrichedEquipment);
        this.highlightEquipmentId.set(selectedId);

        // If immediate selection mode, emit right away
        if (this.immediateSelection()) {
          this.equipmentAcquired.emit(enrichedEquipment);
        }
      }
    }
  }

  // Handle new shape drawn
  onShapeDrawn(shape: RfShape) {
    // Clear any existing selection when drawing new
    this.selectedEquipment.set(null);
    this.highlightEquipmentId.set(null);
    this.drawnShape.set(shape);
  }

  onConfirm() {
    const file = this.selectedFile();
    if (!file) return;

    const drawn = this.drawnShape();
    const selected = this.selectedEquipment();

    // Case 1: There's a drawn shape - save it first
    if (drawn) {
      this.saveDrawnShape(file);
      return;
    }

    // Case 2: Equipment is selected
    if (selected) {
      // Check if LOTO point is required but missing
      if (this.requireLotoPointForUnassociated()) {
        const hasLotoPoint = selected.lotoPoints && selected.lotoPoints.length > 0;
        if (!hasLotoPoint) {
          // Need to create LOTO point first
          this.pendingEquipmentForLotoPoint.set(selected);
          this.showLotoPointForm.set(true);
          return;
        }
      }

      // Equipment is ready - emit and close
      this.equipmentAcquired.emit(selected);
      this.reset();
    }
  }

  /**
   * Save drawn shape as equipment, then check if LOTO point is needed
   */
  private saveDrawnShape(file: any) {
    const shape = this.drawnShape();
    if (!shape) return;

    this.isLoading.set(true);
    this.error.set(null);

    const shapeWithFileContext: RfShape = { ...shape, fileId: file.id };

    this.equipmentService
      .saveEquipmentFromShape(shapeWithFileContext)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (savedEquipment) => {
          this.isLoading.set(false);
          if (savedEquipment) {
            const enrichedEquipment = new EquipmentDto({
              ...savedEquipment,
              mainFileId: file.id,
              mainFileObject: file
            });

            // Clear drawn shape - it's now a saved equipment
            this.drawnShape.set(null);

            // Check if LOTO point is required
            if (this.requireLotoPointForDrawn() || this.requireLotoPointForUnassociated()) {
              // Show LOTO form for the newly saved equipment
              this.pendingEquipmentForLotoPoint.set(enrichedEquipment);
              this.showLotoPointForm.set(true);
            } else {
              // No LOTO required - emit and close
              this.equipmentAcquired.emit(enrichedEquipment);
              this.reset();
            }
          } else {
            this.error.set('Failed to save equipment.');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Failed to save equipment:', err);
          this.error.set('Failed to save equipment. Please try again.');
        }
      });
  }

  onCancel() {
    this.reset();
    this.close.emit();
  }

  private clearSelection() {
    this.selectedEquipment.set(null);
    this.drawnShape.set(null);
    this.highlightEquipmentId.set(null);
    this.error.set(null);
    this.showLotoPointForm.set(false);
    this.pendingEquipmentForLotoPoint.set(null);
    this.lotoPointFormError.set(null);
    this.lotoPointForm.reset();
  }

  private reset() {
    this.fileService.reset();
    this.clearSelection();
  }

  // ==================== LOTO Point Form Methods ====================

  /**
   * Helper to find a ValueDto by ID from an options array
   */
  private findValueById(options: RfValueDto[], id: number | null): ValueDto | null {
    if (!id) return null;
    const found = options.find(opt => opt.id === id);
    if (!found) return null;
    return new ValueDto({ id: found.id, name: found.name });
  }

  /**
   * Submit the LOTO point form
   */
  submitLotoPointForm(): void {
    if (this.lotoPointForm.invalid) return;

    const equipment = this.pendingEquipmentForLotoPoint();
    if (!equipment) {
      this.lotoPointFormError.set('No equipment available for LOTO point.');
      return;
    }

    this.isCreatingLotoPoint.set(true);
    this.lotoPointFormError.set(null);

    const formValue = this.lotoPointForm.value;

    // Convert form IDs to ValueDto objects
    const eqType = this.findValueById(this.eqTypeOptions(), formValue.eqType);
    const location = this.findValueById(this.locationOptions(), formValue.location);
    const isoPos = this.findValueById(this.isoPosOptions(), formValue.isoPos);
    const normPos = this.findValueById(this.normPosOptions(), formValue.normPos);

    const newLotoPoint = new LotoPointDto({
      tagNumber: formValue.tagNumber,
      description: formValue.description,
      eqType: eqType,
      location: location,
      isoPos: isoPos,
      normPos: normPos,
      equipmentList: [equipment],
    });

    this.lotoPointApiService.createLotoPoint(newLotoPoint)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isCreatingLotoPoint.set(false);
          if (response.responseData) {
            const createdLotoPoint = LotoPointDto.fromJson(response.responseData);

            // Update equipment with the new LOTO point
            const updatedEquipment = new EquipmentDto({
              ...equipment,
              lotoPoints: [createdLotoPoint]
            });

            // Set as selected equipment (now fully associated)
            this.selectedEquipment.set(updatedEquipment);

            // Clear LOTO form state
            this.pendingEquipmentForLotoPoint.set(null);
            this.showLotoPointForm.set(false);
            this.lotoPointForm.reset();

            // Don't auto-close - let user click "Select Equipment" to confirm
          } else {
            this.lotoPointFormError.set('Failed to create LOTO point.');
          }
        },
        error: (err) => {
          this.isCreatingLotoPoint.set(false);
          console.error('Failed to create LOTO point:', err);
          this.lotoPointFormError.set('Failed to create LOTO point. Please try again.');
        },
      });
  }

  /**
   * Cancel the LOTO point form
   */
  cancelLotoPointForm(): void {
    this.clearSelection();
  }
}
