import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { RfLotoPointApiService } from '../../../../loto-points/refactored/services/rf-loto-point-api.service';
import { RfLotoPointStateService } from '../../../../loto-points/refactored/services/rf-loto-point-state.service';
import { LotoPointMapperService } from '../../../../loto-points/refactored/services/rf-loto-point-mapper.service';
import { LotoPointCounterpartService } from '../../../../loto-points/refactored/services/loto-point-counterpart.service';
import { RfReactiveFormComponent } from '../../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { RfLotoPointTableComponent } from '../../../../loto-points/refactored/rf-loto-point-table/rf-loto-point-table.component';
import { SearchCriteria } from '../../../../../models/api/search-criteria.model';
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

type CounterpartTab = 'suggested' | 'search' | 'create';

/**
 * Dialog component for selecting or creating a counterpart LOTO point.
 * Used when editing unit-specific LOTO points to find or create the matching
 * counterpart for the other unit (U1/U2).
 *
 * Features:
 * - Suggested tab: Shows auto-found counterpart if available
 * - Search tab: Search for existing LOTO points in the target unit
 * - Create tab: Generate a new counterpart based on the primary
 */
@Component({
  selector: 'app-counterpart-selection-dialog',
  standalone: true,
  imports: [RfReactiveFormComponent, RfLotoPointTableComponent],
  providers: [
    // Provide isolated instances for this dialog's table
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
  templateUrl: './counterpart-selection-dialog.component.html',
  styleUrl: './counterpart-selection-dialog.component.css',
})
export class CounterpartSelectionDialogComponent {
  private mapperService = inject(LotoPointMapperService);
  private counterpartService = inject(LotoPointCounterpartService);
  private destroyRef = inject(DestroyRef);

  // Input: the primary LOTO point to base counterpart on
  primaryLotoPoint = input.required<LotoPointDto>();

  // Input: suggested counterpart (from tag number search)
  suggestedCounterpart = input<LotoPointDto | null>(null);

  // Input: target unit (01 or 02)
  targetUnit = input.required<string>();

  // Output: when counterpart is selected/created
  counterpartSelected = output<LotoPointDto>();

  // Output: when dialog is closed
  dialogClosed = output<void>();

  // Current active tab
  activeTab = signal<CounterpartTab>('create');

  // Form data for "Create New" tab
  newCounterpartData = signal<LotoPointDto | null>(null);

  // Selected counterpart from search table
  selectedFromSearch = signal<LotoPointDto | null>(null);

  // Loading state for counterpart equipment lookup
  isLoadingCounterpart = signal(false);

  // Initialize with suggested tab if available
  private initTab = effect(() => {
    const suggested = this.suggestedCounterpart();
    if (suggested) {
      this.activeTab.set('suggested');
    }
  });

  // Initialize create form when switching to create tab
  private initCreateForm = effect(() => {
    if (this.activeTab() === 'create' && !this.newCounterpartData()) {
      this.generateNewCounterpartData();
    }
  });

  // Form fields for create mode
  createFormFields = computed(() => {
    const data = this.newCounterpartData();
    if (!data) return [];
    return this.mapperService.toFormFields(data, [
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
    ]);
  });

  // Search criteria for counterpart search
  searchCriteria = computed<SearchCriteria>(() => {
    return {
      filters: {
        unit: this.targetUnit(),
      },
      pageSize: 50,
    };
  });

  setActiveTab(tab: CounterpartTab): void {
    this.activeTab.set(tab);

    // Initialize create form when switching to create tab
    if (tab === 'create' && !this.newCounterpartData()) {
      this.generateNewCounterpartData();
    }
  }

  /**
   * Generate new counterpart data based on primary LOTO point
   * Uses the LotoPointCounterpartService for all transformations
   */
  private generateNewCounterpartData(): void {
    const primary = this.primaryLotoPoint();
    if (!primary) return;

    const targetUnit = this.targetUnit();

    // Check if we need async zeroEnergy lookup
    const sourceEquipmentIds = primary.zeroEnergy?.templateEquipmentIds || [];
    if (primary.zeroEnergy && sourceEquipmentIds.length > 0) {
      // Use async generation with zeroEnergy equipment lookup
      this.isLoadingCounterpart.set(true);
      this.counterpartService.generateCounterpartWithZeroEnergy(primary, this.destroyRef, targetUnit)
        .pipe(
          tap((counterpart) => {
            this.newCounterpartData.set(counterpart);
            this.isLoadingCounterpart.set(false);
          }),
          catchError((error) => {
            console.error('Error generating counterpart:', error);
            // Fallback to sync generation
            const counterpart = this.counterpartService.generateCounterpart(primary, targetUnit);
            this.newCounterpartData.set(counterpart);
            this.isLoadingCounterpart.set(false);
            return of(null);
          })
        )
        .subscribe();
    } else {
      // Use sync generation (no equipment lookup needed)
      const counterpart = this.counterpartService.generateCounterpart(primary, targetUnit);
      this.newCounterpartData.set(counterpart);
    }
  }

  onCreateFormChange(values: any): void {
    const current = this.newCounterpartData();
    if (current) {
      this.newCounterpartData.set(new LotoPointDto({ ...current, ...values }));
    }
  }

  onSearchSelected(items: LotoPointDto[]): void {
    if (items.length > 0) {
      this.selectedFromSearch.set(items[0]);
    } else {
      this.selectedFromSearch.set(null);
    }
  }

  onSearchDoubleClicked(item: LotoPointDto): void {
    this.selectedFromSearch.set(item);
    this.submitSearch();
  }

  submitSuggested(): void {
    const suggested = this.suggestedCounterpart();
    if (suggested) {
      this.counterpartSelected.emit(suggested);
    }
  }

  submitSearch(): void {
    const selected = this.selectedFromSearch();
    if (selected) {
      this.counterpartSelected.emit(selected);
    }
  }

  submitCreate(): void {
    const newData = this.newCounterpartData();
    if (newData) {
      this.counterpartSelected.emit(newData);
    }
  }

  close(): void {
    this.dialogClosed.emit();
  }
}
