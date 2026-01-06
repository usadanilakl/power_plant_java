import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
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

  private generateNewCounterpartData(): void {
    const primary = this.primaryLotoPoint();
    if (!primary) return;

    const targetUnit = this.targetUnit();
    const counterpartTag = this.convertTagToCounterpart(primary.tagNumber || '');

    // Transfer zeroEnergy with template but clear equipment
    let counterpartZeroEnergy: ZeroEnergyDto | null = null;
    if (primary.zeroEnergy) {
      counterpartZeroEnergy = new ZeroEnergyDto({
        zeroEnergyTemplate: primary.zeroEnergy.zeroEnergyTemplate,
        method: primary.zeroEnergy.method,
        templateEquipment: [],
        templateEquipmentIds: [],
      });
    }

    const counterpart = new LotoPointDto({
      ...primary,
      id: undefined,
      tagNumber: counterpartTag,
      unit: targetUnit,
      counterpartId: primary.id || undefined,
      zeroEnergy: counterpartZeroEnergy,
      equipmentList: [],
      equipmentIdList: [],
    });

    this.newCounterpartData.set(counterpart);
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
