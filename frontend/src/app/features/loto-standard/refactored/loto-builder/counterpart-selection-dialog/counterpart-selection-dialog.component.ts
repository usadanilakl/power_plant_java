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
import { ZeroEnergyDto } from '../../../../../models/loto/zero-energy.model';
import { RfLotoPointApiService } from '../../../../loto-points/refactored/services/rf-loto-point-api.service';
import { RfLotoPointStateService } from '../../../../loto-points/refactored/services/rf-loto-point-state.service';
import { LotoPointMapperService } from '../../../../loto-points/refactored/services/rf-loto-point-mapper.service';
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
  private apiService = inject(RfLotoPointApiService);
  private mapperService = inject(LotoPointMapperService);
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
   * Transfer rules:
   * 1. tagNumber: swap 01<->02 prefix
   * 2. unit, description, specificLocation: transform unit text patterns (U1<->U2, Unit1<->Unit2, etc.)
   * 3. isoPos, normPos, eqType, location: copy as-is (value-select fields)
   * 4. zeroEnergy: keep template and lookup counterpart equipment IDs via API
   * 5. equipmentList: starts empty (to be set manually)
   */
  private generateNewCounterpartData(): void {
    const primary = this.primaryLotoPoint();
    if (!primary) return;

    const sourceUnit = this.getSourceUnit(primary);
    const targetUnit = this.targetUnit();

    // 1. Transform tag number (swap 01<->02 prefix)
    const counterpartTag = this.convertTagToCounterpart(primary.tagNumber || '');

    // 2. Transform text fields with unit patterns
    const counterpartDescription = this.transformUnitText(primary.description, sourceUnit, targetUnit);
    const counterpartSpecificLocation = this.transformUnitText(primary.specificLocation, sourceUnit, targetUnit);

    // 4. Transfer zeroEnergy - lookup counterpart equipment IDs via API
    const sourceEquipmentIds = primary.zeroEnergy?.templateEquipmentIds || [];
    if (primary.zeroEnergy && sourceEquipmentIds.length > 0) {
      // Call API to lookup counterpart equipment IDs
      this.createCounterpartWithZeroEnergyLookup(
        primary,
        counterpartTag,
        counterpartDescription,
        counterpartSpecificLocation,
        sourceUnit,
        targetUnit
      );
    } else {
      // No zeroEnergy or no equipment to lookup - create counterpart directly
      this.setCounterpartData(
        primary,
        counterpartTag,
        counterpartDescription,
        counterpartSpecificLocation,
        targetUnit,
        primary.zeroEnergy ? new ZeroEnergyDto({
          zeroEnergyTemplate: primary.zeroEnergy.zeroEnergyTemplate,
          method: primary.zeroEnergy.method,
          templateEquipment: [],
          templateEquipmentIds: [],
        }) : null
      );
    }
  }

  /**
   * Call API to lookup counterpart equipment and create counterpart with zeroEnergy
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

          const counterpartZeroEnergy = new ZeroEnergyDto({
            zeroEnergyTemplate: primary.zeroEnergy?.zeroEnergyTemplate,
            method: primary.zeroEnergy?.method,
            templateEquipment: counterpartEquipment,
            templateEquipmentIds: counterpartEquipmentIds,
          });

          this.setCounterpartData(
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

          // Fallback: create counterpart with empty equipment
          const counterpartZeroEnergy = new ZeroEnergyDto({
            zeroEnergyTemplate: primary.zeroEnergy?.zeroEnergyTemplate,
            method: primary.zeroEnergy?.method,
            templateEquipment: [],
            templateEquipmentIds: [],
          });

          this.setCounterpartData(
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
   * Set counterpart data with all transformed fields
   */
  private setCounterpartData(
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
      tagNumber: counterpartTag,
      // 2. Transformed text fields
      unit: targetUnit,
      description: counterpartDescription,
      specificLocation: counterpartSpecificLocation,
      // 3. Value-select fields copied as-is (already spread from primary)
      // isoPos, normPos, eqType, location stay the same
      // Set counterpart link
      counterpartId: primary.id || undefined,
      // 4. Transfer zeroEnergy with counterpart equipment
      zeroEnergy: counterpartZeroEnergy,
      // 5. Clear equipment list - will be set manually
      equipmentList: [],
      equipmentIdList: [],
    });

    this.newCounterpartData.set(counterpart);
  }

  /**
   * Get the source unit from the primary LOTO point
   */
  private getSourceUnit(primary: LotoPointDto): string {
    const tagNumber = primary.tagNumber || '';
    const unit = primary.unit || '';

    if (tagNumber.startsWith('01') || unit.startsWith('01')) {
      return '01';
    }
    if (tagNumber.startsWith('02') || unit.startsWith('02')) {
      return '02';
    }
    return '01'; // Default to 01
  }

  /**
   * Transform unit references in text (01<->02, Unit1<->Unit2, etc.)
   * Handles: U1, U 1, Unit1, Unit 1, u1, u 1, unit1, unit 1, UNIT1, UNIT 1, #1, #2
   */
  private transformUnitText(text: string | null | undefined, fromUnit: string, toUnit: string): string {
    if (!text) return '';

    let result = text;

    // Get numeric versions (1 or 2) from unit strings (01 or 02)
    const fromNum = fromUnit.replace(/^0/, '');
    const toNum = toUnit.replace(/^0/, '');

    // Replace patterns in order of specificity (longer patterns first to avoid partial replacements)

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

  private convertTagToCounterpart(tag: string): string {
    if (!tag) return '';
    if (tag.startsWith('01')) {
      return '02' + tag.substring(2);
    }
    if (tag.startsWith('02')) {
      return '01' + tag.substring(2);
    }
    return tag;
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
