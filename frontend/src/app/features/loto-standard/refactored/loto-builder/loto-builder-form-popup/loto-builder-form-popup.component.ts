import { Component, inject, computed, DestroyRef, signal, ElementRef, ViewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { RfLotoPointFormComponent } from '../../../../loto-points/refactored/rf-loto-point-form/rf-loto-point-form.component';
import { RfLotoPointTableComponent } from '../../../../loto-points/refactored/rf-loto-point-table/rf-loto-point-table.component';
import { RfLotoPointDualFormComponent } from '../../../../loto-points/refactored/rf-loto-point-dual-form/rf-loto-point-dual-form.component';
import { RfLotoPointApiService } from '../../../../loto-points/refactored/services/rf-loto-point-api.service';
import { RfLotoPointStateService } from '../../../../loto-points/refactored/services/rf-loto-point-state.service';
import { LotoPointCounterpartService } from '../../../../loto-points/refactored/services/loto-point-counterpart.service';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import { SearchCriteria } from '../../../../../models/api/search-criteria.model';
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

/**
 * Popup component for creating/editing LOTO points in the LOTO builder.
 * Supports both single form and dual form (for unit-specific U1/U2 points).
 *
 * Features:
 * - Form view: Create new or edit existing LOTO point
 * - Table view: Select existing LOTO point to associate with equipment
 * - Dual form: Side-by-side editing of U1/U2 counterpart LOTO points
 * - Draggable popup with position persistence
 */
@Component({
  selector: 'app-loto-builder-form-popup',
  standalone: true,
  imports: [
    CommonModule,
    RfLotoPointFormComponent,
    RfLotoPointTableComponent,
    RfLotoPointDualFormComponent,
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
  private counterpartService = inject(LotoPointCounterpartService);
  private destroyRef = inject(DestroyRef);

  // Loading state for save operations
  isLoading = signal<boolean>(false);

  // Selected LOTO point from table
  selectedLotoPointFromTable = signal<LotoPointDto | null>(null);

  // Track the current form values (for new LOTO points to detect tag number changes)
  currentFormValues = signal<LotoPointDto | null>(null);

  // Track previous visibility state to detect when popup opens
  private wasVisible = false;

  constructor() {
    // Effect to clear state when popup opens/closes
    effect(() => {
      const isNowVisible = this.builderState.isLotoPointFormOpen();
      const lotoPointForEdit = this.builderState.selectedLotoPointForEdit();
      const pendingEquipment = this.builderState.pendingEquipment();

      if (isNowVisible && !this.wasVisible) {
        // Popup just opened - clear all state for fresh start
        this.lotoPointStateService.clearLotoPoints();
        this.lotoPointStateService.resetPage();
        this.lotoPointStateService.clearSortState();
        this.lotoPointStateService.setSelectedItem(null);
        this.tableSelectionService.clearSelection();
        this.selectedLotoPointFromTable.set(null);

        // For edit mode, initialize currentFormValues with the existing loto point
        if (lotoPointForEdit) {
          this.currentFormValues.set(lotoPointForEdit);
        } else if (pendingEquipment) {
          // For new loto point with pending equipment, pre-populate equipmentList
          const newLotoPointWithEquipment = new LotoPointDto({
            equipmentList: [pendingEquipment],
          });
          this.currentFormValues.set(newLotoPointWithEquipment);
          // Also set it in the state service so the form picks it up
          this.lotoPointStateService.setSelectedItem(newLotoPointWithEquipment);
        } else {
          this.currentFormValues.set(null);
        }
      }

      if (!isNowVisible && this.wasVisible) {
        // Popup just closed - clear form values and state
        this.currentFormValues.set(null);
        this.lotoPointStateService.setSelectedItem(null);
      }

      this.wasVisible = isNowVisible;
    }, { allowSignalWrites: true });

    // Effect to sync unit-specific state to builder state service (for contextual guide)
    effect(() => {
      const isUnitSpecific = this.isUnitSpecific();
      this.builderState.setIsUnitSpecific(isUnitSpecific);
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
   */
  isUnitSpecific = computed(() => {
    // For new items, check the current form values
    const formValues = this.currentFormValues();
    if (formValues && this.counterpartService.isUnitSpecific(formValues)) {
      return true;
    }

    // For existing items, check the lotoPoint
    const lp = this.lotoPoint();
    if (lp && this.counterpartService.isUnitSpecific(lp)) {
      return true;
    }

    return false;
  });

  /**
   * Whether dual form mode is enabled (user toggle)
   */
  isDualFormEnabled = signal<boolean>(true);

  /**
   * Whether user manually forced dual form mode (for non 01/02 items)
   */
  isManualDualFormMode = signal<boolean>(false);

  /**
   * Should show dual form (unit-specific AND dual form enabled, OR manually forced)
   * Works for both edit mode (existing items) and create mode (new items with 01/02 tag)
   */
  shouldShowDualForm = computed(() => {
    // If manually forced, always show dual form
    if (this.isManualDualFormMode()) {
      return true;
    }

    // Automatic mode: must be unit-specific and dual form enabled
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
   * Alias for shouldShowDualForm - used by the template
   */
  showDualForm = computed(() => {
    return this.shouldShowDualForm() && this.isFormView();
  });

  /**
   * Whether to show the manual dual form toggle button.
   * Only show when:
   * - In form view
   * - NOT in dual form mode (either automatic or manual)
   * - There are form values (something to work with)
   */
  showManualDualFormButton = computed(() => {
    // Only in form view
    if (!this.isFormView()) return false;
    // Don't show if already in dual form mode
    if (this.showDualForm()) return false;
    // Need to have some form values to toggle
    const formValues = this.currentFormValues();
    const existingLp = this.lotoPoint();
    return !!(formValues || existingLp);
  });

  /**
   * Get the effective LOTO point to display in dual form
   * For new items, use currentFormValues; for existing, use lotoPoint
   * Also handles manual dual form mode for non 01/02 items
   */
  effectiveLotoPoint = computed(() => {
    const formValues = this.currentFormValues();
    const existingLp = this.lotoPoint();

    // For edit mode, use existing LOTO point
    if (this.isEditMode() && existingLp) {
      return existingLp;
    }

    // For manual dual form mode, use form values even if not unit-specific
    if (this.isManualDualFormMode()) {
      // Prefer form values, fallback to existing LOTO point, or create empty one
      return formValues || existingLp || new LotoPointDto();
    }

    // For new items with form values that have a unit-specific tag or unit
    if (formValues && this.isUnitSpecific()) {
      return formValues;
    }

    return existingLp;
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
    // Reset manual dual form mode
    this.isManualDualFormMode.set(false);
    // Reset popup position when closing
    this.popupPosition.set(null);
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
      // Check if equipment is already in the list (pre-populated on form open)
      const equipmentAlreadyInList = (lotoPoint.equipmentList || []).some(
        eq => eq.id === equipment.id
      );

      // Only add equipment if not already present
      const finalEquipmentList = equipmentAlreadyInList
        ? (lotoPoint.equipmentList || [])
        : [...(lotoPoint.equipmentList || []), equipment];

      const lotoPointWithEquipment = new LotoPointDto({
        ...lotoPoint,
        equipmentList: finalEquipmentList
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
   * Toggle dual form mode (for unit-specific items)
   */
  toggleDualFormMode(): void {
    this.isDualFormEnabled.update(v => !v);
  }

  /**
   * Enable manual dual form mode (for non 01/02 items that need counterparts)
   */
  enableManualDualFormMode(): void {
    this.isManualDualFormMode.set(true);
  }

  /**
   * Disable manual dual form mode and return to single form
   */
  disableManualDualFormMode(): void {
    this.isManualDualFormMode.set(false);
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
  }
}
