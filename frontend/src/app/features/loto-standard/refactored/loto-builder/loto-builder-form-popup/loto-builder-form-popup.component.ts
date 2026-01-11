import { Component, inject, computed, DestroyRef, signal, ElementRef, ViewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { RfLotoPointFormComponent } from '../../../../loto-points/refactored/rf-loto-point-form/rf-loto-point-form.component';
import { RfLotoPointTableComponent } from '../../../../loto-points/refactored/rf-loto-point-table/rf-loto-point-table.component';
import { LotoPointDualFormComponent } from '../../../../loto-points/refactored/loto-point-dual-form/loto-point-dual-form.component';
import { RfLotoPointApiService } from '../../../../loto-points/refactored/services/rf-loto-point-api.service';
import { RfLotoPointStateService } from '../../../../loto-points/refactored/services/rf-loto-point-state.service';
import { LotoPointMapperService } from '../../../../loto-points/refactored/services/rf-loto-point-mapper.service';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { ZeroEnergyDto } from '../../../../../models/loto/zero-energy.model';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import { SearchCriteria } from '../../../../../models/api/search-criteria.model';
import { RfReactiveFormComponent } from '../../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { CounterpartSelectionDialogComponent } from '../counterpart-selection-dialog/counterpart-selection-dialog.component';
// Table services required for RfLotoPointTableComponent
import { TableSelectionService } from '../../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../../shared/table/refactored/services/table-drag.service';
import { TableStateService } from '../../../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../../../shared/table/refactored/services/table-data.service';
import { TableSearchService } from '../../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../../shared/table/refactored/services/table-sync.service';
import { TableClickService } from '../../../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../../../shared/table/refactored/services/table-controls.service';
import { LotoPointBulkEditService } from '../../../../loto-points/refactored/services/loto-point-bulk-edit.service';
import { RfLotoPointTableDataService } from '../../../../loto-points/refactored/rf-loto-point-table/rf-loto-point-table-data.service';

@Component({
  selector: 'app-loto-builder-form-popup',
  standalone: true,
  imports: [
    CommonModule,
    RfLotoPointFormComponent,
    RfLotoPointTableComponent,
    LotoPointDualFormComponent,
    RfReactiveFormComponent,
    CounterpartSelectionDialogComponent,
  ],
  providers: [
    // Provide a separate instance of RfLotoPointStateService for this popup
    // to prevent the table from clearing LOTO points in the main left panel table
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
    {
      provide: TableDataService,
      useClass: RfLotoPointTableDataService,
    },
  ],
  templateUrl: './loto-builder-form-popup.component.html',
  styleUrl: './loto-builder-form-popup.component.css',
})
export class LotoBuilderFormPopupComponent implements AfterViewInit {
  @ViewChild('popupElement') popupElement!: ElementRef<HTMLDivElement>;
  @ViewChild('headerElement') headerElement!: ElementRef<HTMLDivElement>;

  protected builderState = inject(LotoBuilderStateService);
  private apiService = inject(RfLotoPointApiService);
  private lotoPointStateService = inject(RfLotoPointStateService);
  private tableSelectionService = inject(TableSelectionService);
  private messageService = inject(GlobalMessageService);
  private mapperService = inject(LotoPointMapperService);
  private destroyRef = inject(DestroyRef);

  // Loading state for save operations
  isLoading = signal<boolean>(false);

  // Selected LOTO point from table
  selectedLotoPointFromTable = signal<LotoPointDto | null>(null);

  // Track the current form values (for new LOTO points to detect tag number changes)
  currentFormValues = signal<LotoPointDto | null>(null);

  // ========== Counterpart Panel State ==========
  // Whether to show the counterpart panel (controlled by user closing it)
  private counterpartPanelDismissed = signal<boolean>(false);

  // Counterpart mode: 'suggested', 'search' or 'create'
  counterpartMode = signal<'suggested' | 'search' | 'create'>('search');

  // Loading state for counterpart search
  isLoadingCounterpart = signal<boolean>(false);

  // Auto-found counterpart from server
  foundCounterpart = signal<LotoPointDto | null>(null);

  // Selected counterpart from table (in search mode)
  selectedCounterpart = signal<LotoPointDto | null>(null);

  // Counterpart form data (in create mode)
  counterpartFormData = signal<LotoPointDto | null>(null);

  // Saving state for dual save
  isSaving = signal<boolean>(false);

  // Track the last searched tag to detect changes
  private lastSearchedTag = signal<string | null>(null);

  // Track which fields are different between primary and counterpart
  private differentFields = signal<Set<string>>(new Set());

  // Counterpart status for UI display
  counterpartStatus = signal<'linked' | 'found' | 'suggested' | 'new' | 'not-found'>('not-found');

  // ========== Dual Form State (new structure) ==========
  // The counterpart LOTO point (loaded or selected)
  counterpartLotoPoint = signal<LotoPointDto | null>(null);

  // Suggested counterpart from search
  suggestedCounterpart = signal<LotoPointDto | null>(null);

  // Whether the counterpart selection dialog is open
  showCounterpartDialog = signal<boolean>(false);

  // Saving states for dual form
  isSavingPrimary = signal<boolean>(false);
  isSavingCounterpart = signal<boolean>(false);
  isSavingBoth = signal<boolean>(false);

  // Current values for primary and counterpart forms (for tracking changes)
  private primaryFormValues = signal<LotoPointDto | null>(null);
  private counterpartFormValues = signal<LotoPointDto | null>(null);

  // Syncable fields list (for UI iteration)
  syncableFields: (keyof LotoPointDto)[] = [
    'description',
    'specificLocation',
    'isoPos',
    'normPos',
    'eqType',
    'location',
    'zeroEnergy',
  ];

  // Track previous visibility state to detect when popup opens
  private wasVisible = false;

  constructor() {
    // Effect to clear state when popup opens/closes
    effect(() => {
      const isNowVisible = this.builderState.isLotoPointFormOpen();
      const lotoPointForEdit = this.builderState.selectedLotoPointForEdit();

      if (isNowVisible && !this.wasVisible) {
        // Popup just opened - clear all state for fresh start
        this.lotoPointStateService.clearLotoPoints();
        this.lotoPointStateService.resetPage();
        this.lotoPointStateService.clearSortState();
        this.lotoPointStateService.setSelectedItem(null);
        this.tableSelectionService.clearSelection();
        this.selectedLotoPointFromTable.set(null);
        this.resetCounterpartState();

        // For edit mode, initialize currentFormValues with the existing loto point
        // so dual form detection works immediately
        if (lotoPointForEdit) {
          this.currentFormValues.set(lotoPointForEdit);
          this.primaryFormValues.set(lotoPointForEdit);

          // If counterpartId exists, load the counterpart immediately
          // Otherwise, user will click "Set Counterpart" button to open dialog
          if (lotoPointForEdit.counterpartId) {
            this.loadCounterpartById(lotoPointForEdit.counterpartId);
          }
        } else {
          // Reset currentFormValues so dual form detection starts fresh for new items
          this.currentFormValues.set(null);
          this.primaryFormValues.set(null);
        }
      }

      if (!isNowVisible && this.wasVisible) {
        // Popup just closed - clear form values and state
        this.currentFormValues.set(null);
        this.primaryFormValues.set(null);
        this.lotoPointStateService.setSelectedItem(null);
        this.resetCounterpartState();
      }

      this.wasVisible = isNowVisible;
    }, { allowSignalWrites: true });

    // Effect to sync unit-specific state to builder state service (for contextual guide)
    effect(() => {
      const isUnitSpecific = this.isUnitSpecific();
      this.builderState.setIsUnitSpecific(isUnitSpecific);
    });

    // Effect to sync counterpart loaded state to builder state service (for contextual guide)
    effect(() => {
      const hasCounterpart = this.counterpartLotoPoint() !== null;
      this.builderState.setHasCounterpart(hasCounterpart);
    });

    // Effect to sync counterpart dialog state to builder state service (for contextual guide)
    effect(() => {
      const isDialogOpen = this.showCounterpartDialog();
      this.builderState.setCounterpartDialogOpen(isDialogOpen);
    });

    // Effect to sync suggested counterpart state to builder state service (for contextual guide)
    effect(() => {
      const hasSuggested = this.suggestedCounterpart() !== null;
      this.builderState.setHasSuggestedCounterpart(hasSuggested);
    });
  }

  // Drag state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private popupStartX = 0;
  private popupStartY = 0;

  // Popup position
  popupPosition = signal<{ x: number; y: number } | null>(null);

  /**
   * Check if form popup should be shown
   */
  isVisible = computed(() => {
    return this.builderState.isLotoPointFormOpen();
  });

  /**
   * Check if currently showing form view
   */
  isFormView = computed(() => {
    return this.builderState.lotoPointPopupView() === 'form';
  });

  /**
   * Check if currently showing table view
   */
  isTableView = computed(() => {
    return this.builderState.lotoPointPopupView() === 'table';
  });

  /**
   * Get the LOTO point to edit (or null for new)
   */
  lotoPoint = computed(() => {
    return this.builderState.selectedLotoPointForEdit();
  });

  /**
   * Get pending equipment for association
   */
  pendingEquipment = computed(() => {
    return this.builderState.pendingEquipment();
  });

  /**
   * Get pre-filter search term (from text recognition)
   */
  searchTerm = computed(() => {
    return this.builderState.tableSearchTerm();
  });

  /**
   * Get popup title based on current state
   */
  popupTitle = computed(() => {
    if (this.isTableView()) {
      return this.isEditMode() ? 'Replace LOTO Point' : 'Select Existing LOTO Point';
    }
    return this.lotoPoint() ? 'Edit LOTO Point' : 'Create New LOTO Point';
  });

  /**
   * Check if we are in edit mode (editing existing LOTO point vs creating new)
   */
  isEditMode = computed(() => {
    return this.builderState.isEditMode();
  });

  /**
   * Get label for the form tab based on mode
   */
  formTabLabel = computed(() => {
    return this.isEditMode() ? 'Edit' : 'New';
  });

  /**
   * Get label for the table tab based on mode
   */
  tableTabLabel = computed(() => {
    return this.isEditMode() ? 'Replace with Existing' : 'Select Existing';
  });

  /**
   * Check if a LOTO point is selected from the table (computed for reactivity)
   */
  hasSelectedLotoPoint = computed(() => {
    return this.selectedLotoPointFromTable() !== null;
  });

  /**
   * Check if the current LOTO point is unit-specific (tag starts with 01 or 02)
   * Uses currentFormValues for new items (to detect tag number changes in real-time)
   * or the lotoPoint for existing items.
   * Also checks the 'unit' field as users may type there first.
   */
  isUnitSpecific = computed(() => {
    // Helper to check if a value indicates unit-specific
    const isUnitValue = (val: string | null | undefined): boolean => {
      if (!val) return false;
      return val.startsWith('01') || val.startsWith('02');
    };

    // For new items, check the current form values
    const formValues = this.currentFormValues();
    if (formValues) {
      // Check tagNumber first, then unit field
      if (isUnitValue(formValues.tagNumber)) return true;
      if (isUnitValue(formValues.unit)) return true;
    }

    // For existing items, check the lotoPoint
    const lp = this.lotoPoint();
    if (lp) {
      if (isUnitValue(lp.tagNumber)) return true;
      if (isUnitValue(lp.unit)) return true;
    }

    return false;
  });

  /**
   * Get the effective LOTO point to display in dual form
   * For new items, use currentFormValues; for existing, use lotoPoint
   */
  effectiveLotoPoint = computed(() => {
    const formValues = this.currentFormValues();
    const existingLp = this.lotoPoint();

    // For edit mode, use existing LOTO point
    if (this.isEditMode() && existingLp) {
      return existingLp;
    }

    // For new items with form values that have a unit-specific tag or unit
    if (formValues && this.isUnitSpecific()) {
      return formValues;
    }

    return existingLp;
  });

  /**
   * Whether dual form mode is enabled (user toggle)
   */
  isDualFormEnabled = signal<boolean>(true);

  /**
   * Should show dual form (unit-specific AND dual form enabled)
   * Works for both edit mode (existing items) and create mode (new items with 01/02 tag)
   */
  shouldShowDualForm = computed(() => {
    // Must be unit-specific and dual form enabled
    if (!this.isUnitSpecific() || !this.isDualFormEnabled()) {
      return false;
    }

    // For edit mode, always show if unit-specific
    if (this.isEditMode()) {
      return true;
    }

    // For new items, only show if we have form values with a tag number or unit
    const formValues = this.currentFormValues();
    const hasTagNumber = formValues?.tagNumber != null && formValues.tagNumber.length > 0;
    const hasUnit = formValues?.unit != null && formValues.unit.length > 0;
    return hasTagNumber || hasUnit;
  });

  /**
   * Whether to show the counterpart panel
   * Shows when unit-specific and not dismissed by user
   */
  showCounterpartPanel = computed(() => {
    return this.isUnitSpecific() && !this.counterpartPanelDismissed();
  });

  /**
   * Alias for shouldShowDualForm - used by the template
   */
  showDualForm = computed(() => {
    return this.shouldShowDualForm() && this.isFormView();
  });

  /**
   * Current primary form values - returns form values or existing LOTO point
   */
  currentPrimaryValues = computed(() => {
    return this.primaryFormValues() || this.currentFormValues() || this.lotoPoint();
  });

  /**
   * Current counterpart form values
   */
  currentCounterpartValues = computed(() => {
    return this.counterpartFormValues() || this.counterpartLotoPoint();
  });

  /**
   * Get form fields for the primary form (in dual form mode)
   */
  primaryFields = computed(() => {
    const primaryData = this.currentPrimaryValues();
    if (!primaryData) return [];
    return this.mapperService.toFormFields(primaryData, [
      'unit',
      'tagNumber',
      'description',
      'eqType',
      'tagged',
      'isoPos',
      'normPos',
      'specificLocation',
      'location',
      'standard',
      'generalLocation',
      'zeroEnergy',
      'equipmentList',
    ]);
  });

  /**
   * Check if counterpart is a new item (not yet saved)
   */
  isCounterpartNew = computed(() => {
    const counterpart = this.counterpartLotoPoint();
    return counterpart != null && !counterpart.id;
  });

  /**
   * Get the source unit (current unit from primary form)
   */
  sourceUnit = computed(() => {
    const formValues = this.currentFormValues();
    const lp = this.lotoPoint();

    // Check tagNumber first, then unit field
    const tagNumber = formValues?.tagNumber || lp?.tagNumber || '';
    const unit = formValues?.unit || lp?.unit || '';

    if (tagNumber.startsWith('01') || unit.startsWith('01')) {
      return '01';
    }
    if (tagNumber.startsWith('02') || unit.startsWith('02')) {
      return '02';
    }
    return '01'; // Default to 01
  });

  /**
   * Get the target unit for the counterpart (opposite of current unit)
   * If current is 01, target is 02, and vice versa
   */
  targetUnit = computed(() => {
    const source = this.sourceUnit();
    return source === '01' ? '02' : '01';
  });

  /**
   * Get form fields for the counterpart form (in create mode)
   * Includes all fields: basic info, positions, locations, zeroEnergy, and equipmentList
   */
  counterpartFields = computed(() => {
    const counterpartData = this.counterpartLotoPoint() || this.counterpartFormData();
    if (!counterpartData) return [];
    return this.mapperService.toFormFields(counterpartData, [
      'unit',
      'tagNumber',
      'description',
      'eqType',
      'tagged',
      'isoPos',
      'normPos',
      'specificLocation',
      'location',
      'standard',
      'generalLocation',
      'zeroEnergy',
      'equipmentList',
    ]);
  });

  ngAfterViewInit(): void {
    // Drag handlers will be set up when the popup becomes visible
  }

  /**
   * Close the form popup
   */
  close(): void {
    this.builderState.closeLotoPointForm();
    this.builderState.setTableSearchTerm(null);
    this.builderState.setRecognizedText(null);
    this.selectedLotoPointFromTable.set(null);
    this.currentFormValues.set(null);
    // Reset popup position when closing
    this.popupPosition.set(null);
    // Reset counterpart panel state
    this.counterpartPanelDismissed.set(false);
    this.resetCounterpartState();
  }

  // ========== Drag Methods ==========

  /**
   * Start dragging the popup
   */
  onHeaderMouseDown(event: MouseEvent): void {
    // Only handle left mouse button
    if (event.button !== 0) return;

    // Don't start drag if clicking on buttons
    if ((event.target as HTMLElement).closest('button')) return;

    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    const popup = this.popupElement?.nativeElement;
    if (popup) {
      const rect = popup.getBoundingClientRect();
      const currentPos = this.popupPosition();
      this.popupStartX = currentPos?.x ?? rect.left;
      this.popupStartY = currentPos?.y ?? rect.top;
    }

    // Add window-level listeners for drag
    window.addEventListener('mousemove', this.onWindowMouseMove);
    window.addEventListener('mouseup', this.onWindowMouseUp);

    event.preventDefault();
  }

  /**
   * Handle mouse move during drag (bound to preserve 'this' context)
   */
  private onWindowMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    const newX = this.popupStartX + deltaX;
    const newY = this.popupStartY + deltaY;

    // Constrain to viewport
    const popup = this.popupElement?.nativeElement;
    if (popup) {
      const rect = popup.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      this.popupPosition.set({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  /**
   * Handle mouse up to end drag (bound to preserve 'this' context)
   */
  private onWindowMouseUp = (): void => {
    this.isDragging = false;
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
  };

  /**
   * Handle backdrop click to close
   */
  onBackdropClick(event: MouseEvent): void {
    // Only close if clicking the backdrop itself, not child elements
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  /**
   * Switch to form view for creating new LOTO point
   */
  switchToForm(): void {
    this.builderState.switchToFormView();
  }

  /**
   * Switch to table view for selecting existing LOTO point
   */
  switchToTable(): void {
    this.builderState.switchToTableView();
  }

  /**
   * Handle LOTO point selection from table
   */
  onLotoPointSelected(lotoPoints: LotoPointDto[]): void {
    if (lotoPoints.length === 0) {
      this.selectedLotoPointFromTable.set(null);
      return;
    }

    // Store the selected LOTO point for later association
    this.selectedLotoPointFromTable.set(lotoPoints[0]);
  }

  /**
   * Associate the currently selected LOTO point with the pending equipment
   */
  associateSelectedLotoPoint(): void {
    const selectedLotoPoint = this.selectedLotoPointFromTable();
    const equipment = this.pendingEquipment();

    if (!selectedLotoPoint) {
      console.error('No LOTO point selected');
      return;
    }

    if (!equipment) {
      console.error('No pending equipment for association');
      return;
    }

    this.associateLotoPointWithEquipment(selectedLotoPoint, equipment);
  }

  /**
   * Handle row double-click to select and associate
   */
  onRowDoubleClicked(lotoPoint: LotoPointDto): void {
    const equipment = this.pendingEquipment();

    if (!equipment) {
      console.error('No pending equipment for association');
      return;
    }

    this.associateLotoPointWithEquipment(lotoPoint, equipment);
  }

  /**
   * Associate a LOTO point with equipment by saving to server
   */
  private associateLotoPointWithEquipment(lotoPoint: LotoPointDto, equipment: EquipmentDto): void {
    this.isLoading.set(true);

    // Create updated LOTO point with equipment association
    const updatedLotoPoint = new LotoPointDto({
      ...lotoPoint,
      equipmentList: [...(lotoPoint.equipmentList || []), equipment]
    });

    this.apiService.saveLotoPoint(updatedLotoPoint)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const savedLotoPoint = LotoPointDto.fromJson(response.responseData);
            // Update the local equipment state to include this LOTO point
            this.updateEquipmentWithLotoPoint(equipment, savedLotoPoint);
            this.messageService.showSuccess('LOTO Point associated with equipment successfully');
            this.close();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error associating LOTO point:', error);
          this.messageService.showError('Failed to associate LOTO point with equipment');
          this.isLoading.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Update local equipment state to include the associated LOTO point
   */
  private updateEquipmentWithLotoPoint(equipment: EquipmentDto, lotoPoint: LotoPointDto): void {
    const currentEquipment = this.builderState.currentEquipment();

    const updatedEquipmentList = currentEquipment.map(eq => {
      if (eq.id === equipment.id) {
        const existingLotoPoints = eq.lotoPoints || [];
        // Add the LOTO point if not already present
        if (!existingLotoPoints.some(lp => lp.id === lotoPoint.id)) {
          return new EquipmentDto({
            ...eq,
            lotoPoints: [...existingLotoPoints, lotoPoint]
          });
        }
      }
      return eq;
    });

    this.builderState.setCurrentEquipment(updatedEquipmentList);
  }

  /**
   * Handle form submission for new LOTO point
   */
  onFormSubmit(lotoPoint: LotoPointDto): void {
    const equipment = this.pendingEquipment();

    if (equipment) {
      // Associate with pending equipment
      const lotoPointWithEquipment = new LotoPointDto({
        ...lotoPoint,
        equipmentList: [...(lotoPoint.equipmentList || []), equipment]
      });

      this.isLoading.set(true);

      this.apiService.saveLotoPoint(lotoPointWithEquipment)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap((response) => {
            if (response.responseData) {
              const savedLotoPoint = LotoPointDto.fromJson(response.responseData);
              // Update the local equipment state to include this LOTO point
              this.updateEquipmentWithLotoPoint(equipment, savedLotoPoint);
              const action = lotoPoint.id ? 'updated' : 'created';
              this.messageService.showSuccess(`LOTO Point ${action} and associated with equipment successfully`);
              this.close();
            }
            this.isLoading.set(false);
          }),
          catchError((error) => {
            console.error('Error saving LOTO point:', error);
            this.messageService.showError('Failed to save LOTO point');
            this.isLoading.set(false);
            return of(null);
          })
        )
        .subscribe();
    } else {
      // No pending equipment, use normal form submission flow
      this.lotoPointStateService.submitForm(lotoPoint);
    }
  }

  /**
   * Get initial search criteria for table (from text recognition)
   */
  getInitialSearchCriteria(): SearchCriteria | null {
    const term = this.searchTerm();
    if (!term) return null;

    return {
      type: 'global',
      query: term,
      page: 1,
      pageSize: 50
    };
  }

  /**
   * Toggle dual form mode
   */
  toggleDualFormMode(): void {
    this.isDualFormEnabled.update(v => !v);
  }

  /**
   * Handle primary LOTO point saved from dual form
   */
  onPrimarySaved(lotoPoint: LotoPointDto): void {
    const equipment = this.pendingEquipment();
    if (equipment) {
      this.updateEquipmentWithLotoPoint(equipment, lotoPoint);
    }
  }

  /**
   * Handle counterpart LOTO point saved from dual form
   */
  onCounterpartSaved(lotoPoint: LotoPointDto): void {
    // Counterpart is saved independently, no equipment association needed
  }

  /**
   * Handle both LOTO points saved from dual form
   */
  onBothSaved(data: { primary: LotoPointDto; counterpart: LotoPointDto }): void {
    const equipment = this.pendingEquipment();
    if (equipment) {
      this.updateEquipmentWithLotoPoint(equipment, data.primary);
    }
    this.close();
  }

  /**
   * Handle dual form closed
   */
  onDualFormClosed(): void {
    this.close();
  }

  /**
   * Handle form value changes from the single form
   * Used to detect when tag number changes to 01/02 for new items
   */
  onFormValueChange(values: LotoPointDto): void {
    this.currentFormValues.set(values);
    // No automatic counterpart search - user clicks "Set Counterpart" button to open dialog
  }

  /**
   * Clear form values when closing or switching views
   */
  private clearFormValues(): void {
    this.currentFormValues.set(null);
  }

  // ========== Counterpart Panel Methods ==========

  /**
   * Close the counterpart panel
   */
  closeCounterpartPanel(): void {
    this.counterpartPanelDismissed.set(true);
    this.resetCounterpartState();
  }

  /**
   * Set the counterpart mode (suggested, search or create)
   */
  setCounterpartMode(mode: 'suggested' | 'search' | 'create'): void {
    this.counterpartMode.set(mode);

    // When switching to create mode, generate counterpart form data if not already present
    if (mode === 'create' && !this.counterpartFormData()) {
      this.generateCounterpartFormData();
    }

    // When switching to suggested mode with a found counterpart, use it
    if (mode === 'suggested' && this.foundCounterpart()) {
      this.useSuggestedCounterpart();
    }
  }

  /**
   * Search for counterpart by ID or tag number
   * Re-searches when the tag number changes
   */
  private searchForCounterpart(lotoPoint: LotoPointDto): void {
    const currentTag = lotoPoint.tagNumber || lotoPoint.unit || '';
    const lastTag = this.lastSearchedTag();

    // Check if tag has changed - if so, reset and re-search
    if (currentTag !== lastTag) {
      this.foundCounterpart.set(null);
      this.selectedCounterpart.set(null);
      // Also reset counterpart form data when tag changes
      this.counterpartFormData.set(null);
      this.lastSearchedTag.set(currentTag);
    }

    // Skip if we already have a found counterpart for this tag
    if (this.foundCounterpart()) return;

    // Skip if tag is too short (need at least prefix + some chars)
    if (currentTag.length < 3) return;

    // If existing LOTO point has counterpartId, fetch by ID
    if (lotoPoint.counterpartId) {
      this.isLoadingCounterpart.set(true);
      this.apiService.getCounterpartById(lotoPoint.counterpartId)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap((response) => {
            if (response.responseData) {
              const counterpart = LotoPointDto.fromJson(response.responseData);
              this.foundCounterpart.set(counterpart);
            }
            this.isLoadingCounterpart.set(false);
          }),
          catchError((error) => {
            console.error('Error fetching counterpart:', error);
            this.isLoadingCounterpart.set(false);
            return of(null);
          })
        )
        .subscribe();
    } else if (lotoPoint.tagNumber) {
      // Try to find counterpart by tag number using the API
      this.isLoadingCounterpart.set(true);
      this.apiService.getCounterpartByTagNumber(lotoPoint.tagNumber)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap((response) => {
            if (response.responseData && !response.responseData.isNew) {
              // Found existing counterpart
              const counterpart = LotoPointDto.fromJson(response.responseData.counterpart);
              this.foundCounterpart.set(counterpart);
            }
            this.isLoadingCounterpart.set(false);
          }),
          catchError((error) => {
            console.error('Error searching for counterpart:', error);
            this.isLoadingCounterpart.set(false);
            return of(null);
          })
        )
        .subscribe();
    }
  }

  /**
   * Convert a tag number to its counterpart (01 <-> 02)
   */
  private convertTagToCounterpart(tagNumber: string): string | null {
    if (!tagNumber) return null;

    if (tagNumber.startsWith('01')) {
      return '02' + tagNumber.substring(2);
    }
    if (tagNumber.startsWith('02')) {
      return '01' + tagNumber.substring(2);
    }
    return null;
  }

  /**
   * Select the auto-found counterpart
   */
  selectFoundCounterpart(): void {
    const found = this.foundCounterpart();
    if (found) {
      this.selectedCounterpart.set(found);
    }
  }

  /**
   * Get search criteria for the counterpart search table
   */
  getCounterpartSearchCriteria(): SearchCriteria | null {
    const targetUnit = this.targetUnit();
    return {
      type: 'column',
      filters: { tagNumber: targetUnit },
      page: 1,
      pageSize: 50
    };
  }

  /**
   * Handle counterpart selection from table (old panel mode)
   */
  onCounterpartTableSelected(lotoPoints: LotoPointDto[]): void {
    if (lotoPoints.length === 0) {
      this.selectedCounterpart.set(null);
      return;
    }
    this.selectedCounterpart.set(lotoPoints[0]);
  }

  /**
   * Handle counterpart row double-click
   */
  onCounterpartDoubleClicked(lotoPoint: LotoPointDto): void {
    this.selectedCounterpart.set(lotoPoint);
    this.linkSelectedCounterpart();
  }

  /**
   * Generate counterpart form data based on primary form
   * Transfer rules:
   * 1. tagNumber: swap 01<->02 prefix
   * 2. unit, description, specificLocation: transform unit text patterns (U1<->U2, Unit1<->Unit2, etc.)
   * 3. isoPos, normPos, eqType, location: copy as-is (value-select fields)
   * 4. zeroEnergy: keep template, lookup counterpart equipment IDs via API
   * 5. equipmentList: starts empty (to be set manually)
   */
  private generateCounterpartFormData(): void {
    const primary = this.currentFormValues() || this.lotoPoint();
    if (!primary) return;

    const sourceUnit = this.sourceUnit();
    const targetUnit = this.targetUnit();

    // 1. Transform tag number (swap 01<->02 prefix)
    const counterpartTag = primary.tagNumber ? this.convertTagToCounterpart(primary.tagNumber) || '' : '';

    // 2. Transform text fields with unit patterns
    const counterpartDescription = this.transformUnitText(primary.description, sourceUnit, targetUnit);
    const counterpartSpecificLocation = this.transformUnitText(primary.specificLocation, sourceUnit, targetUnit);

    // 4. Transfer zeroEnergy with template
    // If there are equipment IDs, call API to lookup counterpart equipment
    if (primary.zeroEnergy && primary.zeroEnergy.templateEquipmentIds && primary.zeroEnergy.templateEquipmentIds.length > 0) {
      // Async lookup - create initial counterpart without zeroEnergy, then update
      this.createCounterpartWithZeroEnergyLookup(
        primary,
        counterpartTag,
        counterpartDescription,
        counterpartSpecificLocation,
        sourceUnit,
        targetUnit
      );
    } else {
      // No equipment to lookup, create counterpart with zeroEnergy template only
      let counterpartZeroEnergy: ZeroEnergyDto | null = null;
      if (primary.zeroEnergy) {
        counterpartZeroEnergy = new ZeroEnergyDto({
          zeroEnergyTemplate: primary.zeroEnergy.zeroEnergyTemplate,
          method: primary.zeroEnergy.method,
          templateEquipment: [],
          templateEquipmentIds: [],
        });
      }

      this.setCounterpartFormData(
        primary,
        counterpartTag,
        counterpartDescription,
        counterpartSpecificLocation,
        targetUnit,
        counterpartZeroEnergy
      );
    }
  }

  /**
   * Create counterpart with ZeroEnergy equipment lookup via API
   */
  private createCounterpartWithZeroEnergyLookup(
    primary: LotoPointDto,
    counterpartTag: string,
    counterpartDescription: string,
    counterpartSpecificLocation: string,
    sourceUnit: string,
    targetUnit: string
  ): void {
    const sourceEquipmentIds = primary.zeroEnergy?.templateEquipmentIds || [];

    this.isLoadingCounterpart.set(true);

    this.apiService.lookupCounterpartEquipment(sourceEquipmentIds, sourceUnit)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          const counterpartEquipment = response.responseData || [];
          const counterpartEquipmentIds = counterpartEquipment.map(eq => eq.id);

          // Create zeroEnergy with counterpart equipment from server
          const counterpartZeroEnergy = new ZeroEnergyDto({
            zeroEnergyTemplate: primary.zeroEnergy?.zeroEnergyTemplate,
            method: primary.zeroEnergy?.method,
            templateEquipment: counterpartEquipment,
            templateEquipmentIds: counterpartEquipmentIds,
          });

          this.setCounterpartFormData(
            primary,
            counterpartTag,
            counterpartDescription,
            counterpartSpecificLocation,
            targetUnit,
            counterpartZeroEnergy
          );

          this.isLoadingCounterpart.set(false);
        }),
        catchError((error) => {
          console.error('Error looking up counterpart equipment:', error);
          // Fallback: create without equipment
          const counterpartZeroEnergy = new ZeroEnergyDto({
            zeroEnergyTemplate: primary.zeroEnergy?.zeroEnergyTemplate,
            method: primary.zeroEnergy?.method,
            templateEquipment: [],
            templateEquipmentIds: [],
          });

          this.setCounterpartFormData(
            primary,
            counterpartTag,
            counterpartDescription,
            counterpartSpecificLocation,
            targetUnit,
            counterpartZeroEnergy
          );

          this.isLoadingCounterpart.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Set counterpart form data with all transformed values
   */
  private setCounterpartFormData(
    primary: LotoPointDto,
    counterpartTag: string,
    counterpartDescription: string,
    counterpartSpecificLocation: string,
    targetUnit: string,
    counterpartZeroEnergy: ZeroEnergyDto | null
  ): void {
    const counterpart = new LotoPointDto({
      ...primary,
      id: undefined, // New item
      // 1. Transformed tag number
      tagNumber: counterpartTag || '',
      // 2. Transformed text fields
      unit: targetUnit,
      description: counterpartDescription,
      specificLocation: counterpartSpecificLocation,
      // 3. Value-select fields copied as-is (already spread from primary)
      // isoPos, normPos, eqType, location stay the same
      // Set counterpart link
      counterpartId: primary.id || undefined,
      // 4. Transfer zeroEnergy with counterpart equipment IDs
      zeroEnergy: counterpartZeroEnergy,
      // 5. Clear equipment list - will be set manually
      equipmentList: [],
      equipmentIdList: [],
    });

    this.counterpartFormData.set(counterpart);
    this.counterpartStatus.set('new');
    this.updateDifferentFields();
  }

  /**
   * Handle counterpart form value changes
   */
  onCounterpartFormChange(values: any): void {
    const current = this.counterpartFormData();
    if (current) {
      this.counterpartFormData.set(new LotoPointDto({ ...current, ...values }));
    }
  }

  /**
   * Link selected counterpart to primary
   */
  linkSelectedCounterpart(): void {
    const selected = this.selectedCounterpart();
    const primary = this.currentFormValues();

    if (!selected || !primary) {
      this.messageService.showError('Please select a counterpart to link');
      return;
    }

    // Update primary with counterpartId
    const updatedPrimary = new LotoPointDto({
      ...primary,
      counterpartId: selected.id
    });

    this.currentFormValues.set(updatedPrimary);
    this.messageService.showSuccess(`Linked counterpart: ${selected.tagNumber}`);
  }

  /**
   * Save the counterpart (create mode)
   */
  saveCounterpart(): void {
    const counterpart = this.counterpartFormData();
    if (!counterpart) {
      this.messageService.showError('No counterpart data to save');
      return;
    }

    this.isSaving.set(true);

    this.apiService.saveLotoPoint(counterpart)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const savedCounterpart = LotoPointDto.fromJson(response.responseData);

            // Update primary with counterpartId
            const primary = this.currentFormValues();
            if (primary) {
              const updatedPrimary = new LotoPointDto({
                ...primary,
                counterpartId: savedCounterpart.id
              });
              this.currentFormValues.set(updatedPrimary);
            }

            this.selectedCounterpart.set(savedCounterpart);
            this.messageService.showSuccess('Counterpart saved successfully');
          }
          this.isSaving.set(false);
        }),
        catchError((error) => {
          console.error('Error saving counterpart:', error);
          this.messageService.showError('Failed to save counterpart');
          this.isSaving.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Save both primary and counterpart forms
   */
  saveBothForms(): void {
    const primary = this.currentFormValues();
    const counterpart = this.selectedCounterpart() || this.counterpartFormData();

    if (!primary) {
      this.messageService.showError('No primary form data to save');
      return;
    }

    this.isSaving.set(true);
    const equipment = this.pendingEquipment();

    // Prepare primary with equipment if needed
    const primaryToSave = equipment
      ? new LotoPointDto({ ...primary, equipmentList: [...(primary.equipmentList || []), equipment] })
      : primary;

    // If counterpart is already saved (has ID), just save primary with counterpartId
    if (counterpart?.id) {
      const primaryWithCounterpart = new LotoPointDto({
        ...primaryToSave,
        counterpartId: counterpart.id
      });

      this.apiService.saveLotoPoint(primaryWithCounterpart)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap((response) => {
            if (response.responseData) {
              const savedPrimary = LotoPointDto.fromJson(response.responseData);
              if (equipment) {
                this.updateEquipmentWithLotoPoint(equipment, savedPrimary);
              }
              this.messageService.showSuccess('LOTO Point saved successfully');
              this.close();
            }
            this.isSaving.set(false);
          }),
          catchError((error) => {
            console.error('Error saving primary:', error);
            this.messageService.showError('Failed to save LOTO Point');
            this.isSaving.set(false);
            return of(null);
          })
        )
        .subscribe();
    } else if (counterpart) {
      // Save counterpart first, then primary with counterpartId
      this.apiService.saveLotoPoint(counterpart)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          switchMap((counterpartResponse) => {
            if (counterpartResponse.responseData) {
              const savedCounterpart = LotoPointDto.fromJson(counterpartResponse.responseData);

              // Save primary with counterpartId
              const primaryWithCounterpart = new LotoPointDto({
                ...primaryToSave,
                counterpartId: savedCounterpart.id
              });

              return this.apiService.saveLotoPoint(primaryWithCounterpart).pipe(
                tap((primaryResponse) => {
                  if (primaryResponse.responseData) {
                    const savedPrimary = LotoPointDto.fromJson(primaryResponse.responseData);

                    // Update counterpart with primary's ID
                    const updatedCounterpart = new LotoPointDto({
                      ...savedCounterpart,
                      counterpartId: savedPrimary.id
                    });

                    // Update counterpart in background
                    this.apiService.saveLotoPoint(updatedCounterpart).subscribe();

                    if (equipment) {
                      this.updateEquipmentWithLotoPoint(equipment, savedPrimary);
                    }
                    this.messageService.showSuccess('Both LOTO Points saved successfully');
                    this.close();
                  }
                })
              );
            }
            return of(null);
          }),
          catchError((error) => {
            console.error('Error saving both forms:', error);
            this.messageService.showError('Failed to save LOTO Points');
            this.isSaving.set(false);
            return of(null);
          })
        )
        .subscribe(() => {
          this.isSaving.set(false);
        });
    } else {
      // No counterpart, just save primary
      this.apiService.saveLotoPoint(primaryToSave)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap((response) => {
            if (response.responseData) {
              const savedPrimary = LotoPointDto.fromJson(response.responseData);
              if (equipment) {
                this.updateEquipmentWithLotoPoint(equipment, savedPrimary);
              }
              this.messageService.showSuccess('LOTO Point saved successfully');
              this.close();
            }
            this.isSaving.set(false);
          }),
          catchError((error) => {
            console.error('Error saving primary:', error);
            this.messageService.showError('Failed to save LOTO Point');
            this.isSaving.set(false);
            return of(null);
          })
        )
        .subscribe();
    }
  }

  // ========== Sync Methods ==========

  /**
   * Use the auto-found (suggested) counterpart
   */
  useSuggestedCounterpart(): void {
    const found = this.foundCounterpart();
    if (found) {
      this.selectedCounterpart.set(found);
      this.counterpartStatus.set('suggested');
      this.updateDifferentFields();
    }
  }

  /**
   * Use the selected counterpart from search
   */
  useSelectedCounterpart(): void {
    const selected = this.selectedCounterpart();
    if (selected) {
      this.counterpartStatus.set('found');
      this.updateDifferentFields();
    }
  }

  /**
   * Generate counterpart form (public method for template)
   */
  generateCounterpartForm(): void {
    this.generateCounterpartFormData();
  }

  /**
   * Check if there are any different fields
   */
  hasDifferentFields(): boolean {
    return this.differentFields().size > 0;
  }

  /**
   * Check if a specific field is different between primary and counterpart
   */
  isFieldDifferent(field: keyof LotoPointDto): boolean {
    return this.differentFields().has(field);
  }

  /**
   * Get display label for a field
   */
  getFieldLabel(field: keyof LotoPointDto): string {
    const labels: Record<string, string> = {
      description: 'Desc',
      specificLocation: 'Loc',
      isoPos: 'Iso',
      normPos: 'Norm',
      eqType: 'Type',
      location: 'Area',
      zeroEnergy: 'Zero',
    };
    return labels[field] || field;
  }

  /**
   * Sync all fields from primary to counterpart
   * zeroEnergy is synced last because it's async and needs the updated counterpart state
   */
  syncAllToCounterpart(): void {
    // Sync all non-async fields first
    for (const field of this.syncableFields) {
      if (field !== 'zeroEnergy') {
        this.syncFieldToCounterpart(field);
      }
    }
    // Sync zeroEnergy last (async operation)
    if (this.syncableFields.includes('zeroEnergy')) {
      this.syncFieldToCounterpart('zeroEnergy');
    }
    this.messageService.showSuccess(`All fields synced to Unit ${this.targetUnit()}`);
  }

  /**
   * Sync all fields from counterpart to primary
   * zeroEnergy is synced last because it's async and needs the updated primary state
   */
  syncAllToPrimary(): void {
    // Sync all non-async fields first
    for (const field of this.syncableFields) {
      if (field !== 'zeroEnergy') {
        this.syncFieldToPrimary(field);
      }
    }
    // Sync zeroEnergy last (async operation)
    if (this.syncableFields.includes('zeroEnergy')) {
      this.syncFieldToPrimary('zeroEnergy');
    }
    this.messageService.showSuccess(`All fields synced to Unit ${this.sourceUnit()}`);
  }

  /**
   * Sync a single field from primary to counterpart
   */
  syncFieldToCounterpart(field: keyof LotoPointDto): void {
    const primary = this.currentPrimaryValues();
    const counterpart = this.counterpartLotoPoint() || this.selectedCounterpart() || this.counterpartFormData();

    if (!primary || !counterpart) return;

    const sourceUnit = this.sourceUnit();
    const targetUnit = this.targetUnit();

    // Special handling for zeroEnergy - need to call API to lookup counterpart equipment
    if (field === 'zeroEnergy') {
      this.syncZeroEnergyToCounterpart(primary, counterpart, sourceUnit);
      return;
    }

    const transformedValue = this.transformFieldValue(primary, field, sourceUnit, targetUnit);

    const updatedCounterpart = new LotoPointDto({
      ...counterpart,
      [field]: transformedValue,
    });

    // Update the appropriate counterpart signal
    if (this.counterpartLotoPoint()) {
      this.counterpartLotoPoint.set(updatedCounterpart);
      this.counterpartFormValues.set(updatedCounterpart);
    } else if (this.selectedCounterpart()) {
      this.selectedCounterpart.set(updatedCounterpart);
    }
    if (this.counterpartFormData()) {
      this.counterpartFormData.set(updatedCounterpart);
    }

    this.updateDifferentFields();
  }

  /**
   * Sync zeroEnergy field from primary to counterpart with API lookup for equipment IDs
   */
  private syncZeroEnergyToCounterpart(
    primary: LotoPointDto,
    _counterpart: LotoPointDto,
    sourceUnit: string
  ): void {
    const sourceZeroEnergy = primary.zeroEnergy;

    // Get fresh counterpart reference
    const getCurrentCounterpart = () =>
      this.counterpartLotoPoint() || this.selectedCounterpart() || this.counterpartFormData();

    if (!sourceZeroEnergy) {
      // No zeroEnergy to sync - clear it on counterpart
      const currentCounterpart = getCurrentCounterpart();
      if (currentCounterpart) {
        this.updateCounterpartZeroEnergy(currentCounterpart, null);
      }
      return;
    }

    const sourceEquipmentIds = sourceZeroEnergy.templateEquipmentIds || [];

    if (sourceEquipmentIds.length === 0) {
      // No equipment IDs to lookup - just copy template and method
      const counterpartZeroEnergy = new ZeroEnergyDto({
        zeroEnergyTemplate: sourceZeroEnergy.zeroEnergyTemplate,
        method: sourceZeroEnergy.method,
        templateEquipment: [],
        templateEquipmentIds: [],
      });
      const currentCounterpart = getCurrentCounterpart();
      if (currentCounterpart) {
        this.updateCounterpartZeroEnergy(currentCounterpart, counterpartZeroEnergy);
      }
      return;
    }

    // Call API to lookup counterpart equipment
    this.isLoadingCounterpart.set(true);

    this.apiService.lookupCounterpartEquipment(sourceEquipmentIds, sourceUnit)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          const counterpartEquipment = response.responseData || [];
          const counterpartEquipmentIds = counterpartEquipment.map(eq => eq.id);

          const counterpartZeroEnergy = new ZeroEnergyDto({
            zeroEnergyTemplate: sourceZeroEnergy.zeroEnergyTemplate,
            method: sourceZeroEnergy.method,
            templateEquipment: counterpartEquipment,
            templateEquipmentIds: counterpartEquipmentIds,
          });

          // Get fresh counterpart reference after async operation
          const currentCounterpart = getCurrentCounterpart();
          if (currentCounterpart) {
            this.updateCounterpartZeroEnergy(currentCounterpart, counterpartZeroEnergy);
          }
          this.isLoadingCounterpart.set(false);
        }),
        catchError((error) => {
          console.error('Error looking up counterpart equipment:', error);

          // Fallback: copy template without equipment
          const counterpartZeroEnergy = new ZeroEnergyDto({
            zeroEnergyTemplate: sourceZeroEnergy.zeroEnergyTemplate,
            method: sourceZeroEnergy.method,
            templateEquipment: [],
            templateEquipmentIds: [],
          });

          // Get fresh counterpart reference after async operation
          const currentCounterpart = getCurrentCounterpart();
          if (currentCounterpart) {
            this.updateCounterpartZeroEnergy(currentCounterpart, counterpartZeroEnergy);
          }
          this.isLoadingCounterpart.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Helper to update counterpart zeroEnergy in all relevant signals
   */
  private updateCounterpartZeroEnergy(
    currentCounterpart: LotoPointDto,
    zeroEnergy: ZeroEnergyDto | null
  ): void {
    const updatedCounterpart = new LotoPointDto({
      ...currentCounterpart,
      zeroEnergy: zeroEnergy,
    });

    // Update the appropriate counterpart signal
    if (this.counterpartLotoPoint()) {
      this.counterpartLotoPoint.set(updatedCounterpart);
      this.counterpartFormValues.set(updatedCounterpart);
    } else if (this.selectedCounterpart()) {
      this.selectedCounterpart.set(updatedCounterpart);
    }
    if (this.counterpartFormData()) {
      this.counterpartFormData.set(updatedCounterpart);
    }

    this.updateDifferentFields();
  }

  /**
   * Sync a single field from counterpart to primary
   */
  syncFieldToPrimary(field: keyof LotoPointDto): void {
    const primary = this.currentPrimaryValues();
    const counterpart = this.counterpartLotoPoint() || this.selectedCounterpart() || this.counterpartFormData();

    if (!primary || !counterpart) return;

    const sourceUnit = this.targetUnit(); // counterpart is source
    const targetUnit = this.sourceUnit(); // primary is target

    // Special handling for zeroEnergy - need to call API to lookup counterpart equipment
    if (field === 'zeroEnergy') {
      this.syncZeroEnergyToPrimary(primary, counterpart, sourceUnit);
      return;
    }

    const transformedValue = this.transformFieldValue(counterpart, field, sourceUnit, targetUnit);

    const updatedPrimary = new LotoPointDto({
      ...primary,
      [field]: transformedValue,
    });

    this.currentFormValues.set(updatedPrimary);
    this.primaryFormValues.set(updatedPrimary);
    this.updateDifferentFields();
  }

  /**
   * Sync zeroEnergy field from counterpart to primary with API lookup for equipment IDs
   */
  private syncZeroEnergyToPrimary(
    _primary: LotoPointDto,
    counterpart: LotoPointDto,
    sourceUnit: string
  ): void {
    const sourceZeroEnergy = counterpart.zeroEnergy;

    // Get fresh primary reference
    const getCurrentPrimary = () => this.currentPrimaryValues();

    if (!sourceZeroEnergy) {
      // No zeroEnergy to sync - clear it on primary
      const currentPrimary = getCurrentPrimary();
      if (currentPrimary) {
        this.updatePrimaryZeroEnergy(currentPrimary, null);
      }
      return;
    }

    const sourceEquipmentIds = sourceZeroEnergy.templateEquipmentIds || [];

    if (sourceEquipmentIds.length === 0) {
      // No equipment IDs to lookup - just copy template and method
      const primaryZeroEnergy = new ZeroEnergyDto({
        zeroEnergyTemplate: sourceZeroEnergy.zeroEnergyTemplate,
        method: sourceZeroEnergy.method,
        templateEquipment: [],
        templateEquipmentIds: [],
      });
      const currentPrimary = getCurrentPrimary();
      if (currentPrimary) {
        this.updatePrimaryZeroEnergy(currentPrimary, primaryZeroEnergy);
      }
      return;
    }

    // Call API to lookup counterpart equipment
    this.isLoadingCounterpart.set(true);

    this.apiService.lookupCounterpartEquipment(sourceEquipmentIds, sourceUnit)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          const primaryEquipment = response.responseData || [];
          const primaryEquipmentIds = primaryEquipment.map(eq => eq.id);

          const primaryZeroEnergy = new ZeroEnergyDto({
            zeroEnergyTemplate: sourceZeroEnergy.zeroEnergyTemplate,
            method: sourceZeroEnergy.method,
            templateEquipment: primaryEquipment,
            templateEquipmentIds: primaryEquipmentIds,
          });

          // Get fresh primary reference after async operation
          const currentPrimary = getCurrentPrimary();
          if (currentPrimary) {
            this.updatePrimaryZeroEnergy(currentPrimary, primaryZeroEnergy);
          }
          this.isLoadingCounterpart.set(false);
        }),
        catchError((error) => {
          console.error('Error looking up counterpart equipment:', error);

          // Fallback: copy template without equipment
          const primaryZeroEnergy = new ZeroEnergyDto({
            zeroEnergyTemplate: sourceZeroEnergy.zeroEnergyTemplate,
            method: sourceZeroEnergy.method,
            templateEquipment: [],
            templateEquipmentIds: [],
          });

          // Get fresh primary reference after async operation
          const currentPrimary = getCurrentPrimary();
          if (currentPrimary) {
            this.updatePrimaryZeroEnergy(currentPrimary, primaryZeroEnergy);
          }
          this.isLoadingCounterpart.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Helper to update primary zeroEnergy
   */
  private updatePrimaryZeroEnergy(
    currentPrimary: LotoPointDto,
    zeroEnergy: ZeroEnergyDto | null
  ): void {
    const updatedPrimary = new LotoPointDto({
      ...currentPrimary,
      zeroEnergy: zeroEnergy,
    });

    this.currentFormValues.set(updatedPrimary);
    this.primaryFormValues.set(updatedPrimary);
    this.updateDifferentFields();
  }

  /**
   * Transform field value for syncing between units
   * Transfer rules:
   * 1. tagNumber: swap 01<->02 prefix
   * 2. unit, description, specificLocation: transform unit text patterns
   * 3. isoPos, normPos, eqType, location: copy as-is (value-select fields)
   * 4. zeroEnergy: keep template but clear equipment
   */
  private transformFieldValue(
    source: LotoPointDto,
    field: keyof LotoPointDto,
    fromUnit: string,
    toUnit: string
  ): any {
    const value = (source as any)[field];

    // 1. Transform tag number prefix (01<->02)
    if (field === 'tagNumber') {
      if (typeof value === 'string' && value.startsWith(fromUnit)) {
        return toUnit + value.substring(fromUnit.length);
      }
      return value;
    }

    // 2. Transform text fields with unit patterns
    if (field === 'unit') {
      // Unit field is just the unit value
      return toUnit;
    }

    if (field === 'description' || field === 'specificLocation') {
      // Transform unit references in text (U1<->U2, Unit1<->Unit2, etc.)
      return this.transformUnitText(value, fromUnit, toUnit);
    }

    // 3. Value-select fields - copy as-is
    if (field === 'isoPos' || field === 'normPos' || field === 'eqType' || field === 'location') {
      return value;
    }

    // 4. ZeroEnergy - keep template, pass source equipment IDs for backend lookup
    if (field === 'zeroEnergy') {
      if (!value) return null;
      return new ZeroEnergyDto({
        zeroEnergyTemplate: value.zeroEnergyTemplate,
        method: value.method,
        // Pass source equipment IDs - backend will lookup counterpart equipment
        templateEquipment: [],
        templateEquipmentIds: value.templateEquipmentIds || [],
      });
    }

    // For other fields, copy as-is
    return value;
  }

  /**
   * Transform unit references in text (01<->02, Unit1<->Unit2, etc.)
   * Handles: U1, U 1, Unit1, Unit 1, u1, u 1, unit1, unit 1, UNIT1, UNIT 1
   */
  private transformUnitText(text: string | null | undefined, fromUnit: string, toUnit: string): string {
    if (!text) return '';

    let result = text;

    // Get numeric versions (1 or 2) from unit strings (01 or 02)
    const fromNum = fromUnit.replace(/^0/, '');
    const toNum = toUnit.replace(/^0/, '');

    // Replace patterns in order of specificity (longer patterns first to avoid partial replacements)
    // Using a placeholder approach to avoid replacing already-replaced text

    // Pattern: "Unit 1" or "Unit 2" (with space)
    result = result.replace(new RegExp(`(Unit\\s+)${fromNum}\\b`, 'gi'), `$1${toNum}`);

    // Pattern: "Unit1" or "Unit2" (no space)
    result = result.replace(new RegExp(`(Unit)${fromNum}\\b`, 'gi'), `$1${toNum}`);

    // Pattern: "U 1" or "U 2" (with space)
    result = result.replace(new RegExp(`(U\\s+)${fromNum}\\b`, 'gi'), `$1${toNum}`);

    // Pattern: "U1" or "U2" (no space)
    result = result.replace(new RegExp(`\\bU${fromNum}\\b`, 'gi'), `U${toNum}`);

    // Pattern: "#1" or "#2"
    result = result.replace(new RegExp(`#${fromNum}\\b`, 'g'), `#${toNum}`);

    // Pattern: Standalone "01" or "02" at word boundaries (for tag-like references)
    result = result.replace(new RegExp(`\\b${fromUnit}\\b`, 'g'), toUnit);

    return result;
  }

  /**
   * Update the set of fields that differ between primary and counterpart
   */
  private updateDifferentFields(): void {
    const primary = this.currentPrimaryValues();
    const counterpart = this.counterpartLotoPoint() || this.selectedCounterpart() || this.counterpartFormData();

    if (!primary || !counterpart) {
      this.differentFields.set(new Set());
      return;
    }

    const different = new Set<string>();

    for (const field of this.syncableFields) {
      const primaryValue = this.getFieldValue(primary, field);
      const counterpartValue = this.getFieldValue(counterpart, field);

      if (!this.areValuesEqual(primaryValue, counterpartValue)) {
        different.add(field);
      }
    }

    this.differentFields.set(different);
  }

  /**
   * Get field value for comparison
   */
  private getFieldValue(entity: LotoPointDto, field: string): any {
    const value = (entity as any)[field];
    if (value?.id !== undefined) {
      return value.id;
    }
    return value;
  }

  /**
   * Compare two values for equality
   */
  private areValuesEqual(val1: any, val2: any): boolean {
    if (val1 === val2) return true;
    if (val1 == null && val2 == null) return true;
    if (val1 == null || val2 == null) return false;

    // Compare by JSON for objects
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      return JSON.stringify(val1) === JSON.stringify(val2);
    }

    return false;
  }

  /**
   * Reset counterpart panel state
   */
  private resetCounterpartState(): void {
    this.counterpartMode.set('search');
    this.isLoadingCounterpart.set(false);
    this.foundCounterpart.set(null);
    this.selectedCounterpart.set(null);
    this.counterpartFormData.set(null);
    this.isSaving.set(false);
    this.lastSearchedTag.set(null);
    this.counterpartStatus.set('not-found');
    this.differentFields.set(new Set());
    // Reset new dual form state
    this.counterpartLotoPoint.set(null);
    this.suggestedCounterpart.set(null);
    this.showCounterpartDialog.set(false);
    this.isSavingPrimary.set(false);
    this.isSavingCounterpart.set(false);
    this.isSavingBoth.set(false);
    this.primaryFormValues.set(null);
    this.counterpartFormValues.set(null);
  }

  // ========== Dual Form Dialog Methods ==========

  /**
   * Open the counterpart selection dialog
   * Searches for suggestions and generates new counterpart data before opening
   */
  openCounterpartDialog(): void {
    const primary = this.currentPrimaryValues();
    if (!primary) return;

    // Search for suggested counterpart by tag number
    if (primary.tagNumber) {
      this.isLoadingCounterpart.set(true);
      this.apiService.getCounterpartByTagNumber(primary.tagNumber)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap((response) => {
            if (response.responseData && !response.responseData.isNew) {
              // Found existing counterpart - set as suggested
              const counterpart = LotoPointDto.fromJson(response.responseData.counterpart);
              this.suggestedCounterpart.set(counterpart);
            } else {
              this.suggestedCounterpart.set(null);
            }
            this.isLoadingCounterpart.set(false);
            // Open dialog after search completes
            this.showCounterpartDialog.set(true);
          }),
          catchError((error) => {
            console.error('Error searching for counterpart:', error);
            this.suggestedCounterpart.set(null);
            this.isLoadingCounterpart.set(false);
            // Still open dialog even if search fails
            this.showCounterpartDialog.set(true);
            return of(null);
          })
        )
        .subscribe();
    } else {
      // No tag number, just open dialog
      this.suggestedCounterpart.set(null);
      this.showCounterpartDialog.set(true);
    }
  }

  /**
   * Close the counterpart selection dialog
   */
  closeCounterpartDialog(): void {
    this.showCounterpartDialog.set(false);
  }

  /**
   * Handle counterpart selected from the dialog
   * This is called when user selects or creates a counterpart in the dialog
   */
  onCounterpartSelected(counterpart: LotoPointDto): void {
    this.counterpartLotoPoint.set(counterpart);
    this.counterpartFormValues.set(counterpart);
    this.showCounterpartDialog.set(false);
    this.updateDifferentFields();
  }

  /**
   * Handle primary form value changes in dual form mode
   */
  onPrimaryValueChange(values: any): void {
    const current = this.currentPrimaryValues();
    if (current) {
      const updated = new LotoPointDto({ ...current, ...values });
      this.primaryFormValues.set(updated);
      this.currentFormValues.set(updated);
      this.updateDifferentFields();
    }
  }

  /**
   * Handle counterpart form value changes in dual form mode
   */
  onCounterpartValueChange(values: any): void {
    const current = this.counterpartLotoPoint();
    if (current) {
      const updated = new LotoPointDto({ ...current, ...values });
      this.counterpartFormValues.set(updated);
      this.counterpartLotoPoint.set(updated);
      this.updateDifferentFields();
    }
  }

  /**
   * Save only the primary LOTO point
   */
  savePrimary(): void {
    const primary = this.currentPrimaryValues();
    if (!primary) {
      this.messageService.showError('No primary form data to save');
      return;
    }

    this.isSavingPrimary.set(true);
    const equipment = this.pendingEquipment();

    // Prepare primary with equipment if needed
    const primaryToSave = equipment
      ? new LotoPointDto({ ...primary, equipmentList: [...(primary.equipmentList || []), equipment] })
      : primary;

    // If we have a counterpart with ID, link it
    const counterpart = this.counterpartLotoPoint();
    const primaryWithCounterpart = counterpart?.id
      ? new LotoPointDto({ ...primaryToSave, counterpartId: counterpart.id })
      : primaryToSave;

    this.apiService.saveLotoPoint(primaryWithCounterpart)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const savedPrimary = LotoPointDto.fromJson(response.responseData);
            if (equipment) {
              this.updateEquipmentWithLotoPoint(equipment, savedPrimary);
            }
            this.primaryFormValues.set(savedPrimary);
            this.currentFormValues.set(savedPrimary);
            this.messageService.showSuccess(`LOTO Point for Unit ${this.sourceUnit()} saved successfully`);
          }
          this.isSavingPrimary.set(false);
        }),
        catchError((error) => {
          console.error('Error saving primary:', error);
          this.messageService.showError('Failed to save primary LOTO Point');
          this.isSavingPrimary.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Save only the counterpart LOTO point
   */
  saveCounterpartOnly(): void {
    const counterpart = this.counterpartLotoPoint();
    if (!counterpart) {
      this.messageService.showError('No counterpart data to save');
      return;
    }

    this.isSavingCounterpart.set(true);

    // If primary has ID, link it to counterpart
    const primary = this.currentPrimaryValues();
    const counterpartToSave = primary?.id
      ? new LotoPointDto({ ...counterpart, counterpartId: primary.id })
      : counterpart;

    this.apiService.saveLotoPoint(counterpartToSave)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const savedCounterpart = LotoPointDto.fromJson(response.responseData);
            this.counterpartLotoPoint.set(savedCounterpart);
            this.counterpartFormValues.set(savedCounterpart);
            const action = counterpart.id ? 'updated' : 'created';
            this.messageService.showSuccess(`LOTO Point for Unit ${this.targetUnit()} ${action} successfully`);
          }
          this.isSavingCounterpart.set(false);
        }),
        catchError((error) => {
          console.error('Error saving counterpart:', error);
          this.messageService.showError('Failed to save counterpart LOTO Point');
          this.isSavingCounterpart.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Save both primary and counterpart LOTO points
   */
  saveBoth(): void {
    const primary = this.currentPrimaryValues();
    const counterpart = this.counterpartLotoPoint();

    if (!primary) {
      this.messageService.showError('No primary form data to save');
      return;
    }

    if (!counterpart) {
      this.messageService.showError('No counterpart data to save');
      return;
    }

    this.isSavingBoth.set(true);
    const equipment = this.pendingEquipment();

    // Prepare primary with equipment if needed
    const primaryToSave = equipment
      ? new LotoPointDto({ ...primary, equipmentList: [...(primary.equipmentList || []), equipment] })
      : primary;

    // If both have IDs, save them with cross-references
    if (primary.id && counterpart.id) {
      // Both exist, just update them
      const primaryWithCounterpart = new LotoPointDto({ ...primaryToSave, counterpartId: counterpart.id });
      const counterpartWithPrimary = new LotoPointDto({ ...counterpart, counterpartId: primary.id });

      forkJoin([
        this.apiService.saveLotoPoint(primaryWithCounterpart),
        this.apiService.saveLotoPoint(counterpartWithPrimary)
      ])
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap(([primaryResponse, counterpartResponse]) => {
            if (primaryResponse.responseData) {
              const savedPrimary = LotoPointDto.fromJson(primaryResponse.responseData);
              if (equipment) {
                this.updateEquipmentWithLotoPoint(equipment, savedPrimary);
              }
            }
            this.messageService.showSuccess('Both LOTO Points saved successfully');
            this.close();
          }),
          catchError((error) => {
            console.error('Error saving both:', error);
            this.messageService.showError('Failed to save LOTO Points');
            this.isSavingBoth.set(false);
            return of(null);
          })
        )
        .subscribe(() => {
          this.isSavingBoth.set(false);
        });
    } else if (counterpart.id) {
      // Only counterpart has ID, save primary with counterpartId
      const primaryWithCounterpart = new LotoPointDto({ ...primaryToSave, counterpartId: counterpart.id });

      this.apiService.saveLotoPoint(primaryWithCounterpart)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          switchMap((primaryResponse) => {
            if (primaryResponse.responseData) {
              const savedPrimary = LotoPointDto.fromJson(primaryResponse.responseData);
              if (equipment) {
                this.updateEquipmentWithLotoPoint(equipment, savedPrimary);
              }
              // Update counterpart with primary's ID
              const counterpartWithPrimary = new LotoPointDto({ ...counterpart, counterpartId: savedPrimary.id });
              return this.apiService.saveLotoPoint(counterpartWithPrimary);
            }
            return of(null);
          }),
          tap(() => {
            this.messageService.showSuccess('Both LOTO Points saved successfully');
            this.close();
          }),
          catchError((error) => {
            console.error('Error saving both:', error);
            this.messageService.showError('Failed to save LOTO Points');
            this.isSavingBoth.set(false);
            return of(null);
          })
        )
        .subscribe(() => {
          this.isSavingBoth.set(false);
        });
    } else {
      // Counterpart is new - save it first, then primary with counterpartId
      this.apiService.saveLotoPoint(counterpart)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          switchMap((counterpartResponse) => {
            if (counterpartResponse.responseData) {
              const savedCounterpart = LotoPointDto.fromJson(counterpartResponse.responseData);

              // Save primary with counterpartId
              const primaryWithCounterpart = new LotoPointDto({
                ...primaryToSave,
                counterpartId: savedCounterpart.id
              });

              return this.apiService.saveLotoPoint(primaryWithCounterpart).pipe(
                tap((primaryResponse) => {
                  if (primaryResponse.responseData) {
                    const savedPrimary = LotoPointDto.fromJson(primaryResponse.responseData);

                    // Update counterpart with primary's ID in background
                    const counterpartWithPrimary = new LotoPointDto({
                      ...savedCounterpart,
                      counterpartId: savedPrimary.id
                    });
                    this.apiService.saveLotoPoint(counterpartWithPrimary).subscribe();

                    if (equipment) {
                      this.updateEquipmentWithLotoPoint(equipment, savedPrimary);
                    }
                    this.messageService.showSuccess('Both LOTO Points saved successfully');
                    this.close();
                  }
                })
              );
            }
            return of(null);
          }),
          catchError((error) => {
            console.error('Error saving both:', error);
            this.messageService.showError('Failed to save LOTO Points');
            this.isSavingBoth.set(false);
            return of(null);
          })
        )
        .subscribe(() => {
          this.isSavingBoth.set(false);
        });
    }
  }

  /**
   * Load counterpart by ID or search by tag number when popup opens
   * This implements the flow: check counterpartId -> if not, search by tag
   */
  loadOrSearchCounterpart(): void {
    const primary = this.currentFormValues() || this.lotoPoint();
    if (!primary) return;

    // If primary has a counterpartId, load it directly
    if (primary.counterpartId) {
      this.loadCounterpartById(primary.counterpartId);
    } else if (primary.tagNumber) {
      // Search for counterpart by tag number
      this.searchCounterpartByTag(primary.tagNumber);
    }
  }

  /**
   * Load counterpart by ID
   */
  private loadCounterpartById(counterpartId: number): void {
    this.isLoadingCounterpart.set(true);

    this.apiService.getCounterpartById(counterpartId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const counterpart = LotoPointDto.fromJson(response.responseData);
            this.counterpartLotoPoint.set(counterpart);
            this.counterpartFormValues.set(counterpart);
            this.counterpartStatus.set('linked');
            this.updateDifferentFields();
          }
          this.isLoadingCounterpart.set(false);
        }),
        catchError((error) => {
          console.error('Error loading counterpart by ID:', error);
          this.isLoadingCounterpart.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Search for counterpart by tag number
   */
  private searchCounterpartByTag(tagNumber: string): void {
    this.isLoadingCounterpart.set(true);

    this.apiService.getCounterpartByTagNumber(tagNumber)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData && !response.responseData.isNew) {
            // Found existing counterpart - set as suggested
            const counterpart = LotoPointDto.fromJson(response.responseData.counterpart);
            this.suggestedCounterpart.set(counterpart);
            this.counterpartStatus.set('suggested');
          } else {
            // No counterpart found
            this.suggestedCounterpart.set(null);
            this.counterpartStatus.set('not-found');
          }
          this.isLoadingCounterpart.set(false);
        }),
        catchError((error) => {
          console.error('Error searching for counterpart:', error);
          this.isLoadingCounterpart.set(false);
          return of(null);
        })
      )
      .subscribe();
  }
}
