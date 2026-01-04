import { Component, inject, computed, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { RfLotoPointFormComponent } from '../../../../loto-points/refactored/rf-loto-point-form/rf-loto-point-form.component';
import { RfLotoPointTableComponent } from '../../../../loto-points/refactored/rf-loto-point-table/rf-loto-point-table.component';
import { RfLotoPointApiService } from '../../../../loto-points/refactored/services/rf-loto-point-api.service';
import { RfLotoPointStateService } from '../../../../loto-points/refactored/services/rf-loto-point-state.service';
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

@Component({
  selector: 'app-loto-builder-form-popup',
  standalone: true,
  imports: [
    CommonModule,
    RfLotoPointFormComponent,
    RfLotoPointTableComponent,
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
export class LotoBuilderFormPopupComponent {
  protected builderState = inject(LotoBuilderStateService);
  private apiService = inject(RfLotoPointApiService);
  private lotoPointStateService = inject(RfLotoPointStateService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);

  // Loading state for save operations
  isLoading = signal<boolean>(false);

  // Selected LOTO point from table
  selectedLotoPointFromTable = signal<LotoPointDto | null>(null);

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
      return 'Select Existing LOTO Point';
    }
    return this.lotoPoint() ? 'Edit LOTO Point' : 'Create New LOTO Point';
  });

  /**
   * Close the form popup
   */
  close(): void {
    this.builderState.closeLotoPointForm();
    this.builderState.setTableSearchTerm(null);
    this.builderState.setRecognizedText(null);
    this.selectedLotoPointFromTable.set(null);
  }

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
   * Check if a LOTO point is selected from the table
   */
  hasSelectedLotoPoint(): boolean {
    return this.selectedLotoPointFromTable() !== null;
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
}
