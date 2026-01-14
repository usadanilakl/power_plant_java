import {
  Component,
  computed,
  DestroyRef,
  effect,
  EventEmitter,
  inject,
  input,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfLotoPointApiService } from '../services/rf-loto-point-api.service';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import {
  LotoPointCounterpartService,
  CounterpartStatus,
  SyncableField,
  SYNCABLE_FIELDS,
} from '../services/loto-point-counterpart.service';
import { RfLotoPointFormComponent } from '../rf-loto-point-form/rf-loto-point-form.component';
import { RfLotoPointTableComponent } from '../rf-loto-point-table/rf-loto-point-table.component';
import { GlobalMessageService } from '../../../../shared/global-message/global-message.service';
import { ConfirmationService } from '../../../../services/ui/confirmation.service';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
// Table services required for isolated table instance
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../shared/table/refactored/services/table-drag.service';
import { TableStateService } from '../../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../../shared/table/refactored/services/table-data.service';
import { TableSearchService } from '../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../shared/table/refactored/services/table-sync.service';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../../shared/table/refactored/services/table-controls.service';
import { LotoPointBulkEditService } from '../services/loto-point-bulk-edit.service';
import { RfLotoPointTableDataService } from '../rf-loto-point-table/rf-loto-point-table-data.service';

/**
 * New dual form component that wraps TWO instances of rf-loto-point-form.
 * This automatically inherits all single form features:
 * - Equipment list management with proper saving
 * - File viewer carousel tab
 * - Draft management
 * - Clipboard copy/paste
 * - Tag number generator
 *
 * Usage:
 * <app-rf-loto-point-dual-form
 *   [primaryLotoPoint]="lotoPoint"
 *   [fieldsToDisplay]="['tagNumber', 'description', ...]"
 *   (primarySaved)="onPrimarySaved($event)"
 *   (counterpartSaved)="onCounterpartSaved($event)"
 *   (bothSaved)="onBothSaved($event)"
 *   (formClosed)="onFormClosed()"
 * />
 */
@Component({
  selector: 'app-rf-loto-point-dual-form',
  standalone: true,
  imports: [
    CommonModule,
    RfLotoPointFormComponent,
    RfLotoPointTableComponent,
  ],
  providers: [
    // Provide isolated instances for this component's table (manual search)
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
  templateUrl: './rf-loto-point-dual-form.component.html',
  styleUrl: './rf-loto-point-dual-form.component.css',
})
export class RfLotoPointDualFormComponent {
  @ViewChild('primaryForm') primaryFormRef!: RfLotoPointFormComponent;
  @ViewChild('counterpartForm') counterpartFormRef!: RfLotoPointFormComponent;

  private apiService = inject(RfLotoPointApiService);
  private counterpartService = inject(LotoPointCounterpartService);
  private messageService = inject(GlobalMessageService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private lotoPointStateService = inject(RfLotoPointStateService);

  // Inputs
  primaryLotoPoint = input.required<LotoPointDto>();
  fieldsToDisplay = input<(keyof LotoPointDto)[]>([
    'tagNumber',
    'description',
    'specificLocation',
    'eqType',
    'isoPos',
    'normPos',
    'location',
    'zeroEnergy',
    'equipmentList',
  ]);

  // Outputs
  @Output() primarySaved = new EventEmitter<LotoPointDto>();
  @Output() counterpartSaved = new EventEmitter<LotoPointDto>();
  @Output() bothSaved = new EventEmitter<{ primary: LotoPointDto; counterpart: LotoPointDto }>();
  @Output() formClosed = new EventEmitter<void>();

  // State
  counterpartLotoPoint = signal<LotoPointDto | null>(null);
  isCounterpartNew = signal<boolean>(false);
  isCounterpartLinked = signal<boolean>(false);
  counterpartStatus = signal<CounterpartStatus>('not-found');
  sourceUnit = signal<string>('01');
  targetUnit = signal<string>('02');
  isLoading = signal<boolean>(false);
  isSavingPrimary = signal<boolean>(false);
  isSavingCounterpart = signal<boolean>(false);
  isSavingBoth = signal<boolean>(false);
  isLinking = signal<boolean>(false);

  // For manual search mode
  showManualSearch = signal<boolean>(false);

  // Selected item from manual search table
  selectedFromSearch = signal<LotoPointDto | null>(null);

  // Search criteria for counterpart search (filters by target unit if unit-specific)
  searchCriteria = computed<SearchCriteria>(() => {
    const targetUnit = this.targetUnit();
    // Only filter by unit if unit-specific (01/02)
    const isUnitFilter = this.counterpartService.isUnitValue(targetUnit);

    const filters: { [key: string]: string } = {};
    if (isUnitFilter) {
      filters['unit'] = targetUnit;
    }

    return {
      filters,
      pageSize: 50,
    };
  });

  // Track form values for syncing
  currentPrimaryValues = signal<LotoPointDto | null>(null);
  currentCounterpartValues = signal<LotoPointDto | null>(null);

  // Track which fields are different between forms
  differentFields = signal<Set<SyncableField>>(new Set());

  // Expose syncable fields for template
  readonly syncableFields: SyncableField[] = SYNCABLE_FIELDS.filter(f => f !== 'tagNumber');

  // Computed: Check if primary tag or unit starts with 01 or 02
  isUnitSpecific = computed(() => {
    return this.counterpartService.isUnitSpecific(this.primaryLotoPoint());
  });

  // Computed: Effective primary entity (current values or input)
  effectivePrimaryEntity = computed(() => {
    return this.currentPrimaryValues() || this.primaryLotoPoint();
  });

  // Computed: Effective counterpart entity (current values or loaded)
  effectiveCounterpartEntity = computed(() => {
    return this.currentCounterpartValues() || this.counterpartLotoPoint();
  });

  // Delete state
  isDeletingPrimary = signal<boolean>(false);
  isDeletingCounterpart = signal<boolean>(false);
  isDeletingBoth = signal<boolean>(false);

  constructor() {
    // Load counterpart when primary changes
    effect(() => {
      const primary = this.primaryLotoPoint();
      if (!primary) {
        return;
      }

      // Check if unit-specific (01/02) for automatic unit detection
      const isUnitSpecific = this.counterpartService.isUnitSpecific(primary);

      if (isUnitSpecific) {
        // Unit-specific: Update source/target units based on tag/unit
        const source = this.counterpartService.getSourceUnit(primary);
        this.sourceUnit.set(source);
        this.targetUnit.set(this.counterpartService.getTargetUnit(source));
      } else {
        // Non unit-specific: Use generic labels
        this.sourceUnit.set('Primary');
        this.targetUnit.set('Counterpart');
      }

      // Priority 1: If primary has a counterpartId, load that counterpart directly
      // This works for both unit-specific and non-unit-specific items that are already linked
      if (primary?.counterpartId) {
        this.loadCounterpartById(primary.counterpartId);
      } else if (primary?.id) {
        // Priority 2: Existing item without counterpartId - try to find counterpart via API
        // (for unit-specific items, API can find by tag number transformation)
        this.loadCounterpart(primary.id);
      } else if (isUnitSpecific && primary?.tagNumber) {
        // Unit-specific new item: try to find counterpart by tag number
        this.loadCounterpartByTagNumber(primary.tagNumber);
      } else if (isUnitSpecific && primary?.unit) {
        // New item with only unit field set - use unit as the tag prefix
        this.loadCounterpartByTagNumber(primary.unit);
      }
      // Non unit-specific new items: no automatic counterpart search
      // User can use manual search to find/create counterpart
    });
  }

  /**
   * Load counterpart data from API
   */
  private loadCounterpart(primaryId: number): void {
    this.isLoading.set(true);
    this.showManualSearch.set(false);

    this.apiService
      .getUnitCounterpart(primaryId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const data = response.responseData as any;
            const counterpart = LotoPointDto.fromJson(data.counterpart);
            this.counterpartLotoPoint.set(counterpart);
            this.currentCounterpartValues.set(counterpart);
            this.isCounterpartNew.set(data.isNew);
            this.isCounterpartLinked.set(data.isLinked ?? false);
            this.sourceUnit.set(data.sourceUnit);
            this.targetUnit.set(data.targetUnit);

            // Set status based on response
            if (data.isLinked) {
              this.counterpartStatus.set('linked');
            } else if (!data.isNew) {
              this.counterpartStatus.set('found');
            } else {
              this.counterpartStatus.set('suggested');
            }

            this.updateDifferentFields();
          } else {
            this.counterpartStatus.set('not-found');
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading counterpart:', error);
          this.messageService.showError('Failed to load unit counterpart');
          this.counterpartStatus.set('not-found');
          this.isLoading.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Load counterpart by tag number (for new items)
   */
  loadCounterpartByTagNumber(tagNumber: string): void {
    if (!tagNumber || (!tagNumber.startsWith('01') && !tagNumber.startsWith('02'))) {
      this.counterpartStatus.set('not-found');
      return;
    }

    this.isLoading.set(true);

    this.apiService
      .getCounterpartByTagNumber(tagNumber)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const data = response.responseData;
            const counterpart = LotoPointDto.fromJson(data.counterpart);
            this.counterpartLotoPoint.set(counterpart);
            this.currentCounterpartValues.set(counterpart);
            this.isCounterpartNew.set(data.isNew);
            this.isCounterpartLinked.set(false);
            this.sourceUnit.set(data.sourceUnit);
            this.targetUnit.set(data.targetUnit);

            this.counterpartStatus.set(data.isNew ? 'suggested' : 'found');
            this.updateDifferentFields();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading counterpart by tag:', error);
          this.counterpartStatus.set('not-found');
          this.isLoading.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Load counterpart directly by its ID (when counterpartId is already known).
   * This is used when the primary already has a linked counterpart.
   */
  private loadCounterpartById(counterpartId: number): void {
    this.isLoading.set(true);
    this.showManualSearch.set(false);

    this.apiService
      .getCounterpartById(counterpartId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const counterpart = LotoPointDto.fromJson(response.responseData);
            this.counterpartLotoPoint.set(counterpart);
            this.currentCounterpartValues.set(counterpart);
            this.isCounterpartNew.set(false);
            this.isCounterpartLinked.set(true);
            this.counterpartStatus.set('linked');
            this.updateDifferentFields();
          } else {
            this.counterpartStatus.set('not-found');
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading counterpart by ID:', error);
          this.messageService.showError('Failed to load linked counterpart');
          this.counterpartStatus.set('not-found');
          this.isLoading.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Set counterpart manually (from external selection like a table)
   */
  setCounterpartManually(lotoPoint: LotoPointDto): void {
    this.counterpartLotoPoint.set(lotoPoint);
    this.currentCounterpartValues.set(lotoPoint);
    this.isCounterpartNew.set(false);
    this.isCounterpartLinked.set(false);
    this.counterpartStatus.set('found');
    this.showManualSearch.set(false);
    this.updateDifferentFields();
  }

  /**
   * Create a new counterpart (empty form or generated from primary)
   * For unit-specific items: generates counterpart with transformed values
   * For non unit-specific items: creates empty counterpart
   */
  createNewCounterpart(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const isUnitSpecific = this.counterpartService.isUnitSpecific(primary);

    let newCounterpart: LotoPointDto;

    if (isUnitSpecific && primary?.tagNumber) {
      // Unit-specific: generate counterpart with transformed tag number
      newCounterpart = this.counterpartService.generateCounterpart(primary, this.targetUnit());
    } else {
      // Non unit-specific: create empty counterpart
      newCounterpart = new LotoPointDto();
    }

    this.counterpartLotoPoint.set(newCounterpart);
    this.currentCounterpartValues.set(newCounterpart);
    this.isCounterpartNew.set(true);
    this.isCounterpartLinked.set(false);
    this.counterpartStatus.set('suggested');
    this.showManualSearch.set(false);
    this.updateDifferentFields();
  }

  /**
   * Show manual search UI
   */
  openManualSearch(): void {
    this.lotoPointStateService.clearLotoPoints();
    this.lotoPointStateService.resetPage();
    this.lotoPointStateService.clearSortState();
    this.selectedFromSearch.set(null);
    this.showManualSearch.set(true);
  }

  /**
   * Hide manual search UI
   */
  closeManualSearch(): void {
    this.showManualSearch.set(false);
    this.selectedFromSearch.set(null);
  }

  /**
   * Handle selection from manual search table
   */
  onSearchSelected(items: LotoPointDto[]): void {
    if (items.length > 0) {
      this.selectedFromSearch.set(items[0]);
    } else {
      this.selectedFromSearch.set(null);
    }
  }

  /**
   * Handle double-click on search table row
   */
  onSearchRowDoubleClicked(item: LotoPointDto): void {
    this.setCounterpartManually(item);
  }

  /**
   * Use the selected item from search as counterpart
   */
  useSelectedFromSearch(): void {
    const selected = this.selectedFromSearch();
    if (selected) {
      this.setCounterpartManually(selected);
    }
  }

  // ========== Form Value Change Handlers ==========

  /**
   * Handle primary form value changes
   */
  onPrimaryValueChange(values: LotoPointDto): void {
    this.currentPrimaryValues.set(values);
    this.updateDifferentFields();
  }

  /**
   * Handle counterpart form value changes
   */
  onCounterpartValueChange(values: LotoPointDto): void {
    this.currentCounterpartValues.set(values);
    this.updateDifferentFields();
  }

  /**
   * Update the set of fields that differ between forms
   */
  private updateDifferentFields(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    this.differentFields.set(
      this.counterpartService.getDifferentFields(primary, counterpart, true)
    );
  }

  /**
   * Check if a field is different between forms
   */
  isFieldDifferent(field: SyncableField): boolean {
    return this.differentFields().has(field);
  }

  /**
   * Check if there are any different fields
   */
  hasDifferentFields(): boolean {
    return this.differentFields().size > 0;
  }

  /**
   * Get a short label for a field
   */
  getFieldLabel(field: SyncableField): string {
    return this.counterpartService.getFieldLabel(field);
  }

  // ========== Sync Operations ==========

  /**
   * Sync a single field from primary to counterpart
   */
  syncFieldToCounterpart(field: SyncableField): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    if (!primary || !counterpart) return;

    if (field === 'zeroEnergy') {
      this.isLoading.set(true);
      this.counterpartService.syncZeroEnergy(primary, counterpart, this.sourceUnit(), this.destroyRef)
        .pipe(
          tap((updated) => {
            this.currentCounterpartValues.set(updated);
            this.counterpartLotoPoint.set(updated);
            this.updateDifferentFields();
            this.isLoading.set(false);
          }),
          catchError((error) => {
            console.error('Error syncing zeroEnergy:', error);
            this.isLoading.set(false);
            return of(null);
          })
        )
        .subscribe();
      return;
    }

    const updatedCounterpart = this.counterpartService.syncField(
      primary,
      counterpart,
      field,
      this.sourceUnit(),
      this.targetUnit()
    );

    this.currentCounterpartValues.set(updatedCounterpart);
    this.counterpartLotoPoint.set(updatedCounterpart);
    this.updateDifferentFields();
  }

  /**
   * Sync a single field from counterpart to primary
   */
  syncFieldToPrimary(field: SyncableField): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    if (!primary || !counterpart) return;

    if (field === 'zeroEnergy') {
      this.isLoading.set(true);
      this.counterpartService.syncZeroEnergy(counterpart, primary, this.targetUnit(), this.destroyRef)
        .pipe(
          tap((updated) => {
            this.currentPrimaryValues.set(updated);
            this.updateDifferentFields();
            this.isLoading.set(false);
          }),
          catchError((error) => {
            console.error('Error syncing zeroEnergy:', error);
            this.isLoading.set(false);
            return of(null);
          })
        )
        .subscribe();
      return;
    }

    const updatedPrimary = this.counterpartService.syncField(
      counterpart,
      primary,
      field,
      this.targetUnit(),
      this.sourceUnit()
    );

    this.currentPrimaryValues.set(updatedPrimary);
    this.updateDifferentFields();
  }

  /**
   * Sync all fields from primary to counterpart
   */
  syncAllToCounterpart(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    if (!primary || !counterpart) return;

    const updatedCounterpart = this.counterpartService.syncAllFields(
      primary,
      counterpart,
      this.sourceUnit(),
      this.targetUnit(),
      true // exclude tagNumber
    );

    this.currentCounterpartValues.set(updatedCounterpart);
    this.counterpartLotoPoint.set(updatedCounterpart);

    this.isLoading.set(true);
    this.counterpartService.syncZeroEnergy(primary, updatedCounterpart, this.sourceUnit(), this.destroyRef)
      .pipe(
        tap((finalCounterpart) => {
          this.currentCounterpartValues.set(finalCounterpart);
          this.counterpartLotoPoint.set(finalCounterpart);
          this.updateDifferentFields();
          this.isLoading.set(false);
          this.messageService.showSuccess(`All fields synced to Unit ${this.targetUnit()}`);
        }),
        catchError((error) => {
          console.error('Error syncing zeroEnergy:', error);
          this.updateDifferentFields();
          this.isLoading.set(false);
          this.messageService.showSuccess(`Fields synced to Unit ${this.targetUnit()} (zeroEnergy sync failed)`);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Sync all fields from counterpart to primary
   */
  syncAllToPrimary(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    if (!primary || !counterpart) return;

    const updatedPrimary = this.counterpartService.syncAllFields(
      counterpart,
      primary,
      this.targetUnit(),
      this.sourceUnit(),
      true // exclude tagNumber
    );

    this.currentPrimaryValues.set(updatedPrimary);

    this.isLoading.set(true);
    this.counterpartService.syncZeroEnergy(counterpart, updatedPrimary, this.targetUnit(), this.destroyRef)
      .pipe(
        tap((finalPrimary) => {
          this.currentPrimaryValues.set(finalPrimary);
          this.updateDifferentFields();
          this.isLoading.set(false);
          this.messageService.showSuccess(`All fields synced to Unit ${this.sourceUnit()}`);
        }),
        catchError((error) => {
          console.error('Error syncing zeroEnergy:', error);
          this.updateDifferentFields();
          this.isLoading.set(false);
          this.messageService.showSuccess(`Fields synced to Unit ${this.sourceUnit()} (zeroEnergy sync failed)`);
          return of(null);
        })
      )
      .subscribe();
  }

  // ========== Save Operations ==========

  /**
   * Save primary LOTO point
   */
  savePrimary(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    if (!primary) return;

    this.isSavingPrimary.set(true);

    this.apiService
      .saveLotoPoint(primary)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const saved = LotoPointDto.fromJson(response.responseData);
            this.currentPrimaryValues.set(saved);
            this.primarySaved.emit(saved);
            this.messageService.showSuccess(`Unit ${this.sourceUnit()} LOTO point saved`);
          }
          this.isSavingPrimary.set(false);
        }),
        catchError((error) => {
          console.error('Error saving primary:', error);
          this.messageService.showError('Failed to save primary LOTO point');
          this.isSavingPrimary.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Save counterpart LOTO point
   */
  saveCounterpart(): void {
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();
    if (!counterpart) return;

    this.isSavingCounterpart.set(true);

    this.apiService
      .saveLotoPoint(counterpart)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if (response.responseData) {
            const saved = LotoPointDto.fromJson(response.responseData);
            this.counterpartLotoPoint.set(saved);
            this.currentCounterpartValues.set(saved);
            this.isCounterpartNew.set(false);
            this.counterpartSaved.emit(saved);
            this.messageService.showSuccess(`Unit ${this.targetUnit()} LOTO point saved`);
          }
          this.isSavingCounterpart.set(false);
        }),
        catchError((error) => {
          console.error('Error saving counterpart:', error);
          this.messageService.showError('Failed to save counterpart LOTO point');
          this.isSavingCounterpart.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Save both LOTO points and link them
   */
  saveBoth(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    if (!primary || !counterpart) return;

    this.isSavingBoth.set(true);

    // Save primary first
    this.apiService
      .saveLotoPoint(primary)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((primaryResponse) => {
          if (primaryResponse.responseData) {
            const savedPrimary = LotoPointDto.fromJson(primaryResponse.responseData);
            this.currentPrimaryValues.set(savedPrimary);

            // Then save counterpart
            this.apiService
              .saveLotoPoint(counterpart)
              .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((counterpartResponse) => {
                  if (counterpartResponse.responseData) {
                    const savedCounterpart = LotoPointDto.fromJson(counterpartResponse.responseData);
                    this.counterpartLotoPoint.set(savedCounterpart);
                    this.currentCounterpartValues.set(savedCounterpart);
                    this.isCounterpartNew.set(false);

                    // Link counterparts if not already linked
                    if (!this.isCounterpartLinked() && savedPrimary.id && savedCounterpart.id) {
                      this.linkCounterpartsAfterSave(savedPrimary, savedCounterpart);
                    } else {
                      this.bothSaved.emit({ primary: savedPrimary, counterpart: savedCounterpart });
                      this.messageService.showSuccess('Both LOTO points saved successfully');
                      this.isSavingBoth.set(false);
                    }
                  } else {
                    this.isSavingBoth.set(false);
                  }
                }),
                catchError((error) => {
                  console.error('Error saving counterpart:', error);
                  this.messageService.showError('Primary saved but failed to save counterpart');
                  this.isSavingBoth.set(false);
                  return of(null);
                })
              )
              .subscribe();
          }
        }),
        catchError((error) => {
          console.error('Error saving primary:', error);
          this.messageService.showError('Failed to save primary LOTO point');
          this.isSavingBoth.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Link counterparts after both are saved
   */
  private linkCounterpartsAfterSave(primary: LotoPointDto, counterpart: LotoPointDto): void {
    if (!primary.id || !counterpart.id) {
      this.bothSaved.emit({ primary, counterpart });
      this.messageService.showSuccess('Both LOTO points saved (linking skipped - missing IDs)');
      this.isSavingBoth.set(false);
      return;
    }

    this.apiService
      .linkCounterparts(primary.id, counterpart.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          primary.counterpartId = counterpart.id;
          counterpart.counterpartId = primary.id;
          this.currentPrimaryValues.set(primary);
          this.currentCounterpartValues.set(counterpart);
          this.counterpartLotoPoint.set(counterpart);
          this.isCounterpartLinked.set(true);
          this.counterpartStatus.set('linked');

          this.bothSaved.emit({ primary, counterpart });
          this.messageService.showSuccess('Both LOTO points saved and linked');
          this.isSavingBoth.set(false);
        }),
        catchError((error) => {
          console.error('Error linking counterparts:', error);
          this.bothSaved.emit({ primary, counterpart });
          this.messageService.showWarning('Both saved, but linking failed. You may need to link manually.');
          this.isSavingBoth.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  // ========== Link/Unlink Operations ==========

  /**
   * Manually link current primary and counterpart
   */
  linkCounterparts(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    if (!primary?.id || !counterpart?.id) {
      this.messageService.showError('Both LOTO points must be saved before linking');
      return;
    }

    this.isLinking.set(true);

    this.apiService
      .linkCounterparts(primary.id, counterpart.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          primary.counterpartId = counterpart.id;
          counterpart.counterpartId = primary.id;
          this.currentPrimaryValues.set(primary);
          this.currentCounterpartValues.set(counterpart);
          this.counterpartLotoPoint.set(counterpart);
          this.isCounterpartLinked.set(true);
          this.counterpartStatus.set('linked');
          this.messageService.showSuccess('LOTO points linked successfully');
          this.isLinking.set(false);
        }),
        catchError((error) => {
          console.error('Error linking counterparts:', error);
          this.messageService.showError('Failed to link counterparts');
          this.isLinking.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Unlink current counterpart
   */
  unlinkCounterpart(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();

    if (!primary?.id) {
      this.messageService.showError('Primary LOTO point must be saved');
      return;
    }

    this.isLinking.set(true);

    this.apiService
      .unlinkCounterpart(primary.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          primary.counterpartId = null;
          const counterpart = this.counterpartLotoPoint();
          if (counterpart) {
            counterpart.counterpartId = null;
            this.counterpartLotoPoint.set(counterpart);
            this.currentCounterpartValues.set(counterpart);
          }
          this.currentPrimaryValues.set(primary);
          this.isCounterpartLinked.set(false);
          this.counterpartStatus.set('found');
          this.messageService.showSuccess('Counterpart unlinked');
          this.isLinking.set(false);
        }),
        catchError((error) => {
          console.error('Error unlinking counterpart:', error);
          this.messageService.showError('Failed to unlink counterpart');
          this.isLinking.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  // ========== Delete Operations ==========

  /**
   * Check if primary can be deleted
   */
  canDeletePrimary(): boolean {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    return !!primary?.id;
  }

  /**
   * Check if counterpart can be deleted
   */
  canDeleteCounterpart(): boolean {
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();
    return !!counterpart?.id && !this.isCounterpartNew();
  }

  /**
   * Delete primary LOTO point with confirmation
   */
  deletePrimary(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    if (!primary?.id) return;

    const tagNumber = primary.tagNumber || `LOTO Point #${primary.id}`;

    this.confirmationService.confirm(
      `Are you sure you want to delete "${tagNumber}" (Unit ${this.sourceUnit()})?\n\nThis will also delete all associated equipment shapes.`
    ).then(confirmed => {
      if (!confirmed) return;

      if (this.isCounterpartLinked()) {
        this.confirmationService.confirm(
          `This LOTO point has a linked counterpart.\n\nDo you also want to delete the counterpart LOTO point (Unit ${this.targetUnit()})?`
        ).then(deleteCounterpart => {
          this.executeDeletePrimary(primary.id!, deleteCounterpart);
        });
      } else {
        this.executeDeletePrimary(primary.id!, false);
      }
    });
  }

  private executeDeletePrimary(id: number, deleteCounterpart: boolean): void {
    this.isDeletingPrimary.set(true);

    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();
    const counterpartId = deleteCounterpart ? counterpart?.id : undefined;

    this.apiService.deleteLotoPoint(id, deleteCounterpart, counterpartId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.showSuccess(`Unit ${this.sourceUnit()} LOTO point deleted`);
          this.isDeletingPrimary.set(false);

          if (deleteCounterpart) {
            this.messageService.showSuccess(`Counterpart (Unit ${this.targetUnit()}) also deleted`);
          }

          this.formClosed.emit();
        },
        error: (error) => {
          console.error('Error deleting primary:', error);
          this.messageService.showError('Failed to delete LOTO point');
          this.isDeletingPrimary.set(false);
        }
      });
  }

  /**
   * Delete counterpart LOTO point with confirmation
   */
  deleteCounterpart(): void {
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();
    if (!counterpart?.id) return;

    const tagNumber = counterpart.tagNumber || `LOTO Point #${counterpart.id}`;

    this.confirmationService.confirm(
      `Are you sure you want to delete "${tagNumber}" (Unit ${this.targetUnit()})?\n\nThis will also delete all associated equipment shapes.`
    ).then(confirmed => {
      if (!confirmed) return;

      this.executeDeleteCounterpart(counterpart.id!);
    });
  }

  private executeDeleteCounterpart(id: number): void {
    this.isDeletingCounterpart.set(true);

    this.apiService.deleteLotoPoint(id, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.showSuccess(`Unit ${this.targetUnit()} LOTO point deleted`);
          this.isDeletingCounterpart.set(false);

          this.counterpartLotoPoint.set(null);
          this.currentCounterpartValues.set(null);
          this.isCounterpartLinked.set(false);
          this.counterpartStatus.set('not-found');
        },
        error: (error) => {
          console.error('Error deleting counterpart:', error);
          this.messageService.showError('Failed to delete counterpart LOTO point');
          this.isDeletingCounterpart.set(false);
        }
      });
  }

  /**
   * Delete both LOTO points with confirmation
   */
  deleteBoth(): void {
    const primary = this.currentPrimaryValues() || this.primaryLotoPoint();
    const counterpart = this.currentCounterpartValues() || this.counterpartLotoPoint();

    if (!primary?.id) return;

    const primaryTag = primary.tagNumber || `LOTO Point #${primary.id}`;
    const counterpartTag = counterpart?.tagNumber || (counterpart?.id ? `LOTO Point #${counterpart.id}` : 'counterpart');

    this.confirmationService.confirm(
      `Are you sure you want to delete BOTH LOTO points?\n\n- ${primaryTag} (Unit ${this.sourceUnit()})\n- ${counterpartTag} (Unit ${this.targetUnit()})\n\nThis will also delete all associated equipment shapes.`
    ).then(confirmed => {
      if (!confirmed) return;

      this.isDeletingBoth.set(true);

      const counterpartId = counterpart?.id;
      this.apiService.deleteLotoPoint(primary.id!, true, counterpartId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.messageService.showSuccess('Both LOTO points deleted successfully');
            this.isDeletingBoth.set(false);
            this.formClosed.emit();
          },
          error: (error) => {
            console.error('Error deleting both:', error);
            this.messageService.showError('Failed to delete LOTO points');
            this.isDeletingBoth.set(false);
          }
        });
    });
  }

  /**
   * Close the form
   */
  close(): void {
    this.formClosed.emit();
  }
}
