import { Component, inject, DestroyRef, OnInit, output, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LotoConflictStateService } from '../services/loto-conflict-state.service';
import { LotoConflictApiService } from '../services/loto-conflict-api.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { ValueDto } from '../../../models/value.model';
import { DuplicateGroup } from '../../../models/loto/loto-conflict.model';
import {
  ConflictType,
  CONFLICT_TYPE_LABELS,
  CONFLICT_TYPE_ICONS,
} from '../../../models/loto/loto-conflict.model';

interface ConflictTypeEntry {
  type: ConflictType;
  label: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-loto-conflict-left-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './loto-conflict-left-panel.component.html',
  styleUrl: './loto-conflict-left-panel.component.css',
})
export class LotoConflictLeftPanelComponent implements OnInit {
  protected state = inject(LotoConflictStateService);
  private api = inject(LotoConflictApiService);
  private sharedData = inject(SharedDataService);
  private destroyRef = inject(DestroyRef);

  summaryRefreshRequested = output<void>();

  // Filter signals
  filterTagNumber = signal('');
  filterDescription = signal('');
  filterLocation = signal<number | null>(null);  // Value ID
  filterUnit = signal('');
  filterEqType = signal<number | null>(null);    // Value ID
  isFilterExpanded = signal(false);

  // Dropdown options from SharedDataService
  locations: ValueDto[] = [];
  equipmentTypes: ValueDto[] = [];

  // Filtered lists — always exclude resolved point IDs
  filteredPoints = computed(() => {
    const resolved = this.state.resolvedPointIds();
    const points = this.state.conflictPoints().filter((p) => !resolved.has(p.id!));
    return this.applyFilters(points);
  });

  filteredDuplicateGroups = computed(() => {
    const resolved = this.state.resolvedPointIds();
    const groups = this.state.duplicateGroups();

    return groups
      .map((group) => {
        // Exclude resolved points from each group
        const remaining = group.points.filter((p) => !resolved.has(p.id!));
        if (remaining.length <= 1) return null; // No longer a duplicate group
        const filtered = this.applyFilters(remaining);
        if (filtered.length === 0) return null;
        return { ...group, points: filtered } as DuplicateGroup;
      })
      .filter((g): g is DuplicateGroup => g !== null);
  });

  /** Count of items currently visible after filters. For duplicates, counts unique points across groups. */
  filteredCount = computed(() => {
    if (this.state.activeConflictType() === 'DUPLICATE_TAG') {
      return this.filteredDuplicateGroups().reduce((sum, g) => sum + g.points.length, 0);
    }
    return this.filteredPoints().length;
  });

  ngOnInit(): void {
    this.sharedData.locations$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((vals) => (this.locations = vals));

    this.sharedData.equipmentTypes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((vals) => (this.equipmentTypes = vals));

    // Trigger loading if not yet loaded
    this.sharedData.loadLocations().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.sharedData.loadEqTypes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  getConflictTypes(): ConflictTypeEntry[] {
    const summary = this.state.conflictSummary();
    if (!summary) return [];
    return [
      { type: 'DUPLICATE_TAG', label: CONFLICT_TYPE_LABELS.DUPLICATE_TAG, icon: CONFLICT_TYPE_ICONS.DUPLICATE_TAG, count: summary.duplicateTagCount },
      { type: 'NO_EQUIPMENT', label: CONFLICT_TYPE_LABELS.NO_EQUIPMENT, icon: CONFLICT_TYPE_ICONS.NO_EQUIPMENT, count: summary.noEquipmentCount },
      { type: 'NO_ZERO_ENERGY', label: CONFLICT_TYPE_LABELS.NO_ZERO_ENERGY, icon: CONFLICT_TYPE_ICONS.NO_ZERO_ENERGY, count: summary.noZeroEnergyCount },
      { type: 'NO_CHARACTERISTICS', label: CONFLICT_TYPE_LABELS.NO_CHARACTERISTICS, icon: CONFLICT_TYPE_ICONS.NO_CHARACTERISTICS, count: summary.noCharacteristicsCount },
      { type: 'MISSING_COUNTERPART', label: CONFLICT_TYPE_LABELS.MISSING_COUNTERPART, icon: CONFLICT_TYPE_ICONS.MISSING_COUNTERPART, count: summary.missingCounterpartCount },
    ];
  }

  selectConflictType(type: ConflictType): void {
    this.state.setConflictType(type);
    this.state.currentPage.set(1);
    this.clearFilters();

    if (type === 'DUPLICATE_TAG') {
      this.loadDuplicateGroups();
    } else {
      this.loadConflictPoints(type, 1);
    }
  }

  goBack(): void {
    this.state.setConflictType(null);
    this.clearFilters();
  }

  selectPoint(point: LotoPointDto): void {
    this.state.selectPoint(point);
  }

  loadMore(): void {
    const type = this.state.activeConflictType();
    if (!type || type === 'DUPLICATE_TAG') return;
    const nextPage = this.state.currentPage() + 1;
    this.state.currentPage.set(nextPage);
    this.loadConflictPoints(type, nextPage, true);
  }

  selectDuplicateGroup(group: DuplicateGroup): void {
    this.state.selectedDuplicateGroup.set(group);
    if (group.points && group.points.length > 0) {
      this.state.selectPoint(group.points[0]);
    }
  }

  toggleFilters(): void {
    this.isFilterExpanded.update((v) => !v);
  }

  clearFilters(): void {
    this.filterTagNumber.set('');
    this.filterDescription.set('');
    this.filterLocation.set(null);
    this.filterUnit.set('');
    this.filterEqType.set(null);
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.filterTagNumber() ||
      this.filterDescription() ||
      this.filterLocation() ||
      this.filterUnit() ||
      this.filterEqType()
    );
  }

  private applyFilters(points: LotoPointDto[]): LotoPointDto[] {
    const tag = this.filterTagNumber().toLowerCase();
    const desc = this.filterDescription().toLowerCase();
    const locId = this.filterLocation();
    const unit = this.filterUnit().toLowerCase();
    const eqTypeId = this.filterEqType();

    if (!tag && !desc && !locId && !unit && !eqTypeId) return points;

    return points.filter((p) => {
      if (tag && !p.tagNumber?.toLowerCase().includes(tag)) return false;
      if (desc && !p.description?.toLowerCase().includes(desc)) return false;
      if (unit && !p.unit?.toLowerCase().includes(unit)) return false;
      if (locId && p.location?.id !== locId) return false;
      if (eqTypeId && p.eqType?.id !== eqTypeId) return false;
      return true;
    });
  }

  private loadConflictPoints(type: ConflictType, page: number, append = false): void {
    // Use large page size so client-side filters see the full dataset.
    // Conflict lists are bounded (typically hundreds, not millions).
    this.api
      .getConflictsByType({ conflictType: type, page, pageSize: 10000 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.responseData) {
            const points = res.responseData.content;
            const total = res.responseData.totalElements;
            if (append) {
              this.state.appendConflictPoints(points, total);
            } else {
              this.state.setConflictPoints(points, total);
            }
          }
        },
        error: (err) => console.error('Failed to load conflicts:', err),
      });
  }

  private loadDuplicateGroups(): void {
    this.api
      .getDuplicateGroups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.responseData) {
            this.state.duplicateGroups.set(res.responseData);
          }
        },
        error: (err) => console.error('Failed to load duplicate groups:', err),
      });
  }

  get hasMore(): boolean {
    return this.state.conflictPoints().length < this.state.totalConflictPoints();
  }
}
