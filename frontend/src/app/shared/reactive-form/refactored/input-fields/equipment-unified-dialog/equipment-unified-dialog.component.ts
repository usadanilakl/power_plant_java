import { Component, inject, input, output, signal, computed, DestroyRef, effect, forwardRef } from '@angular/core';
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
import { FileDto } from '../../../../../models/file/file.model';
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
    // forwardRef breaks the import cycle equipment-unified-dialog → rf-loto-point-table
    // → loto-point-bulk-edit-form → bulk-edit-menu → rf-reactive-form →
    // equipment-list-manager → (here). When the LOTO point table is the entry module,
    // THIS edge captures an undefined RfLotoPointTableComponent, crashing the bulk-edit
    // overlay with "Cannot read properties of undefined (reading 'ɵcmp')".
    forwardRef(() => RfLotoPointTableComponent),
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
  /**
   * When true, browsing (select-existing) accumulates multiple equipment across drawing
   * switches and emits them together via equipmentListAcquired on confirm. Drawing a NEW
   * shape stays single-item. Default false = original single-select behavior.
   */
  multiSelect = input<boolean>(false);
  /**
   * The LOTO point this picker was opened for (e.g. the point whose zero-energy equipment is being
   * chosen). Its referenced P&IDs are offered as quick-access chips so the user can jump straight
   * to the drawings the point already lives on instead of hunting through the file menu.
   */
  contextLotoPointId = input<number | undefined>();

  // Outputs
  equipmentAcquired = output<EquipmentDto>();
  equipmentListAcquired = output<EquipmentDto[]>(); // Emitted (instead of equipmentAcquired) in multiSelect mode
  equipmentDrawnForLotoPoint = output<EquipmentDto>(); // Keep for backwards compatibility but won't use
  close = output<void>();

  // Delegated to file service
  selectedFile = this.fileService.selectedFile;
  fileMenuItems = this.fileService.menuItems;
  currentFileLink = this.fileService.currentFileLink;
  // File-type picker bindings (dialog-local — does not affect the global file menu).
  selectedFileType = this.fileService.selectedType;
  availableFileTypes = this.fileService.availableTypes;
  // Group-by picker bindings (dialog-local).
  selectedGroupBy = this.fileService.selectedGroupBy;
  availableGroupKeys = this.fileService.availableGroupKeys;

  // State - mimicking wizard's approach
  selectedEquipment = signal<EquipmentDto | null>(null);  // Currently selected/saved equipment
  // Accumulated selections for multiSelect mode (persists across drawing switches)
  selectedEquipmentList = signal<EquipmentDto[]>([]);
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

  /** All files related to the picked LOTO point (one per associated equipment). */
  relatedFiles = signal<FileDto[]>([]);

  /** Quick-access P&IDs for the context LOTO point (the one this picker was opened for). */
  contextFiles = signal<FileDto[]>([]);
  /** File id currently loaded from a context quick-access chip (for active highlight). */
  activeContextFileId = signal<number | null>(null);

  /** Index of the currently-shown related file in `relatedFiles`. */
  activeRelatedFileIndex = signal<number>(0);

  /**
   * Equipment ID we want to auto-select once the related file finishes loading
   * (i.e. once `selectedFile.points` becomes populated). Cleared on use.
   * Falls back to "any equipment of the picked point that's on the loaded file"
   * when this is null but a point is picked.
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
    // Load the context point's referenced P&IDs for the quick-access bar (fires when the
    // contextLotoPointId input is set — i.e. when the dialog opens for a specific point).
    effect(() => {
      const pointId = this.contextLotoPointId();
      if (pointId == null) {
        this.contextFiles.set([]);
        return;
      }
      this.lotoPointApiService
        .getRelatedFiles(pointId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            const files = res?.responseData ?? [];
            // De-dupe by file id (a point maps to many equipment on the same file).
            this.contextFiles.set(files.filter(
              (f, i, arr) => f?.id != null && arr.findIndex((x) => x.id === f.id) === i
            ));
          },
          error: () => this.contextFiles.set([]),
        });
    });

    /**
     * After picking a LOTO point and loading one of its related files, auto-select
     * the equipment from that point that lives on the loaded file.
     *
     * If `pendingEquipmentIdToSelect` is set, prefer that ID (explicit pick).
     * Otherwise fall back to "any equipment of the picked point that's on this file"
     * — which makes file-switching work for points with equipment across many P&IDs.
     *
     * Fires when `selectedFile.points` becomes populated.
     */
    effect(() => {
      const file = this.selectedFile();
      const point = this.pickedLotoPoint();
      const pendingId = this.pendingEquipmentIdToSelect();
      if (!file) return;

      const points = file.points ?? [];
      let eq: EquipmentDto | undefined;

      if (pendingId != null) {
        eq = points.find((e: EquipmentDto) => e.id === pendingId);
      }

      if (!eq && point) {
        const candidateIds = new Set<number>([
          ...(point.equipmentList?.map((e: any) => e.id).filter((id: any) => id != null) ?? []),
          ...(point.equipmentIdList ?? []),
        ]);
        eq = points.find((e: EquipmentDto) => e.id != null && candidateIds.has(e.id));
      }

      if (!eq) return; // points may still be loading — effect will re-run

      const enriched = new EquipmentDto({
        ...eq,
        mainFileId: file.id,
        mainFileObject: file,
      });
      this.selectedEquipment.set(enriched);
      this.highlightEquipmentId.set(eq.id ?? null);
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
    const multi = this.multiSelect();
    const listIds = new Set(this.selectedEquipmentList().map(e => e.id));

    // Map existing equipment to shapes
    const shapes = eq.map((e: EquipmentDto) =>
      this.equipmentMapper.mapToRfShape(e)
    ).filter(s => s !== null) as RfShape[];

    // Highlight selected equipment (all accumulated ones in multiSelect mode)
    shapes.forEach((shape: RfShape) => {
      const isSelected = multi
        ? (shape.id != null && listIds.has(shape.id))
        : (selected?.id != null && shape.id === selected.id);
      if (isSelected) {
        shape.isSelected = true;
        shape.color = '#FF0000';
      }
    });

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

    // Multi-select: confirmable once at least one equipment is accumulated
    if (this.multiSelect()) {
      return this.selectedEquipmentList().length > 0;
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

    if (this.multiSelect()) {
      const count = this.selectedEquipmentList().length;
      return count > 0
        ? `${count} equipment selected. Click more (any drawing), then "Add ${count}".`
        : 'Left-click equipment to add. Switch drawings to keep selecting, then confirm.';
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
    this.activeContextFileId.set(null); // browsing the menu → drop the quick-access chip highlight
    this.clearSelection();
  }

  /** Switch the left menu to a different file type (P&ID is the default). */
  onFileTypeChange(type: string): void {
    this.fileService.selectType(type);
  }

  /** Override the menu's grouping (e.g. force "system" for an electrical file type). */
  onGroupByChange(key: string): void {
    if (key === 'vendor' || key === 'system' || key === 'fileType') {
      this.fileService.selectGroupBy(key);
    }
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
          // De-dupe by file id (one point can map to many equipment on the same file)
          const uniqueFiles = files.filter(
            (f, i, arr) => f?.id != null && arr.findIndex((x) => x.id === f.id) === i
          );
          this.relatedFiles.set(uniqueFiles);
          this.activeRelatedFileIndex.set(0);

          if (uniqueFiles.length > 0 && uniqueFiles[0].id != null) {
            // Stage the equipment to auto-select once the file's points load
            const firstEqId = point.equipmentList?.[0]?.id ?? point.equipmentIdList?.[0] ?? null;
            this.pendingEquipmentIdToSelect.set(firstEqId);

            // Load the FULL file (with `points`) so equipment shapes can render.
            // We stay in 'loto-points' mode — the right-side viewer renders the
            // file regardless of left-panel mode, so the user can browse multiple
            // points in the filtered table while the P&ID updates next to it.
            this.fileService.selectFileById(uniqueFiles[0].id);
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

  /**
   * Switch to another file associated with the same LOTO point (chip click).
   * Equipment auto-selection happens via the `selectedFile` effect — it picks
   * an equipment from `pickedLotoPoint.equipmentList` that lives on the new file.
   */
  selectRelatedFile(index: number): void {
    const files = this.relatedFiles();
    if (index < 0 || index >= files.length) return;
    const file = files[index];
    if (!file?.id) return;
    this.activeRelatedFileIndex.set(index);
    this.pendingEquipmentIdToSelect.set(null); // let the effect fall back to "any on this file"
    this.fileService.selectFileById(file.id);
  }

  /**
   * Quick-access: load one of the context LOTO point's referenced P&IDs into the viewer so the
   * user can pick equipment on it directly, instead of hunting through the file menu.
   */
  selectContextFile(file: FileDto): void {
    if (!file?.id) return;
    this.searchMode.set('files'); // ensure the file viewer (not the LOTO-point table) is active
    this.activeContextFileId.set(file.id);
    this.fileService.selectFileById(file.id);
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

        // Multi-select: toggle into the accumulated list, keep the dialog open
        if (this.multiSelect()) {
          this.toggleInList(enrichedEquipment);
          this.highlightEquipmentId.set(selectedId);
          return;
        }

        this.selectedEquipment.set(enrichedEquipment);
        this.highlightEquipmentId.set(selectedId);

        // If immediate selection mode, emit right away
        if (this.immediateSelection()) {
          this.equipmentAcquired.emit(enrichedEquipment);
        }
      }
    }
  }

  /** Add or remove an equipment from the accumulated multi-select list (dedupe by id). */
  private toggleInList(equipment: EquipmentDto): void {
    const list = this.selectedEquipmentList();
    const idx = list.findIndex(e => e.id === equipment.id);
    if (idx >= 0) {
      this.selectedEquipmentList.set(list.filter((_, i) => i !== idx));
    } else {
      this.selectedEquipmentList.set([...list, equipment]);
    }
  }

  /** Remove one equipment from the multi-select tray (chip close button). */
  removeFromList(equipment: EquipmentDto): void {
    this.selectedEquipmentList.set(
      this.selectedEquipmentList().filter(e => e.id !== equipment.id)
    );
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

    // Case 1: There's a drawn shape - save it first (single-item even in multiSelect mode)
    if (drawn) {
      this.saveDrawnShape(file);
      return;
    }

    // Case 2: Multi-select — emit the whole accumulated list
    if (this.multiSelect()) {
      const list = this.selectedEquipmentList();
      if (list.length > 0) {
        this.equipmentListAcquired.emit(list);
        this.reset();
      }
      return;
    }

    // Case 3: Single equipment is selected
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
    this.selectedEquipmentList.set([]);
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
