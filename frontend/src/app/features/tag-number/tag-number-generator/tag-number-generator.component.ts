
import { Component, output, signal, inject, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagNumberService } from '../../../services/tag-number.service';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { ClipboardService } from '../../../services/util/clipboard.service';
import { NamingConventionComponent } from "../naming-convention/naming-convention.component";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfValueSelectComponent } from '../../values/refactored/components/rf-value-select/rf-value-select.component';
import { RfValueService } from '../../values/refactored/services/rf-value.service';
import { RfLotoPointTableComponent } from '../../loto-points/refactored/rf-loto-point-table/rf-loto-point-table.component';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { RfLotoPointApiService } from '../../loto-points/refactored/services/rf-loto-point-api.service';
import { TableSelectionService } from '../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../shared/table/refactored/services/table-drag.service';
import { TableStateService } from '../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../shared/table/refactored/services/table-data.service';
import { TableSearchService } from '../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../shared/table/refactored/services/table-sync.service';
import { TableClickService } from '../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../shared/table/refactored/services/table-controls.service';

@Component({
  selector: 'app-tag-number-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, NamingConventionComponent, RfValueSelectComponent, RfLotoPointTableComponent],
  providers: [
    TableSelectionService,
    TableDragService,
    TableStateService,
    TableDataService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    TableClickService,
    TableControlsService,
  ],
  templateUrl: './tag-number-generator.component.html',
  styleUrls: ['./tag-number-generator.component.css']
})
export class TagNumberGeneratorComponent {
  private tagNumberService = inject(TagNumberService);
  private clipboardService = inject(ClipboardService);
  private valueService = inject(RfValueService);
  private lotoPointApiService = inject(RfLotoPointApiService);
  private destroyRef = inject(DestroyRef);

  // Form state - now using value IDs
  unitId = signal<number | null>(null);
  equipmentTypeId = signal<number | null>(null);
  systemId = signal<number | null>(null);
  generatedTagNumber = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  // Table state
  showLotoPointsTable = signal<boolean>(false);
  lotoPointsWithTags = signal<LotoPointDto[]>([]);
  isLoadingLotoPoints = signal<boolean>(false);

  // Computed validation
  canGenerate = computed(() => {
    return this.unitId() && this.equipmentTypeId() && this.systemId();
  });

  // Outputs for integration with forms
  tagGenerated = output<string>();
  cancelled = output<void>();

  // Helper method to get value alias from ID
  private getValueAlias(categoryAlias: string, valueId: number): string | null {
    const values = this.valueService.getValuesByCategory(categoryAlias);
    const value = values.find(v => v.id === valueId);
    return value?.alias || value?.name || null;
  }

  onSubmit() {
    if (!this.canGenerate()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    // Get aliases from value IDs
    const unit = this.getValueAlias('unit', this.unitId()!);
    const eqType = this.getValueAlias('eqType', this.equipmentTypeId()!);
    const system = this.getValueAlias('system', this.systemId()!);

    if (!unit || !eqType || !system) {
      this.errorMessage.set('Unable to resolve values. Please try again.');
      return;
    }

    const tagNumberData = {
      unit,
      eqType,
      system
    };

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.tagNumberService.createTagNumber(tagNumberData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: SpringApiResponse<string>) => {
          this.generatedTagNumber.set(response.responseData);
          this.clipboardService.setClipboardData(response.responseData);
          this.errorMessage.set(null);
          this.isLoading.set(false);

          // Emit the generated tag number
          this.tagGenerated.emit(response.responseData);
        },
        error: (error) => {
          this.errorMessage.set('Error generating tag number. Please try again.');
          this.generatedTagNumber.set(null);
          this.isLoading.set(false);
          console.error('Error:', error);
        }
      });
  }

  onCancel() {
    this.cancelled.emit();
  }

  reset() {
    this.unitId.set(null);
    this.equipmentTypeId.set(null);
    this.systemId.set(null);
    this.generatedTagNumber.set(null);
    this.errorMessage.set(null);
    this.isLoading.set(false);
  }

  toggleLotoPointsTable() {
    const isCurrentlyShown = this.showLotoPointsTable();

    if (!isCurrentlyShown) {
      // Load LOTO points with tag numbers before showing
      this.loadLotoPointsWithTagNumbers();
    }

    this.showLotoPointsTable.set(!isCurrentlyShown);
  }

  private loadLotoPointsWithTagNumbers() {
    this.isLoadingLotoPoints.set(true);

    // Search for LOTO points that have tag numbers (non-null and non-empty)
    const searchCriteria = {
      type: 'column' as const,
      filters: {},
      page: 1,
      pageSize: 100
    };

    this.lotoPointApiService.searchLotoPoints(searchCriteria, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Filter to only include points with tag numbers
          const pointsWithTags = (response.responseData?.content || [])
            .filter(point => point.tagNumber && point.tagNumber.trim() !== '');

          this.lotoPointsWithTags.set(pointsWithTags);
          this.isLoadingLotoPoints.set(false);
        },
        error: (error) => {
          console.error('Error loading LOTO points:', error);
          this.isLoadingLotoPoints.set(false);
        }
      });
  }
}
