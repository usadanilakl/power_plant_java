import {
  Component, forwardRef, inject, input, signal, computed, effect, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EquipmentDataService, PwaLotoPointEntry } from '../../../services/equipment-data.service';

@Component({
  selector: 'app-equipment-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EquipmentPickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="picker-container">
      <!-- Selected display / trigger -->
      <button type="button" class="picker-trigger" (click)="open()">
        @if (selectedPoint()) {
          <span class="selected-tag">{{ selectedPoint()!.tagNumber }}</span>
          <span class="selected-desc">{{ selectedPoint()!.description }}</span>
        } @else {
          <span class="placeholder">Select equipment...</span>
        }
        <span class="chevron">&#9662;</span>
      </button>

      <!-- Overlay panel -->
      @if (isOpen()) {
        <div class="picker-backdrop" (click)="close()"></div>
        <div class="picker-panel">
          <div class="panel-header">
            <input
              type="text"
              class="search-input"
              [placeholder]="hasAreaPoints() ? 'Filter equipment...' : 'Search by tag or description...'"
              [ngModel]="queryText"
              (ngModelChange)="onQueryChange($event)">
            <button type="button" class="close-btn" (click)="close()">&#10005;</button>
          </div>

          <div class="panel-body">
            @if (searchAllMode() || !hasAreaPoints()) {
              <!-- Search all points -->
              @if (searchQuery().length >= 2) {
                <div class="section-label">Search Results ({{ searchResults().length }})</div>
                @if (searchResults().length === 0) {
                  <div class="empty-message">No equipment found matching "{{ searchQuery() }}"</div>
                }
                @for (point of searchResults(); track point.id) {
                  <button type="button" class="point-item" (click)="selectPoint(point)">
                    <span class="point-tag">{{ point.tagNumber }}</span>
                    <span class="point-desc">{{ point.description }}</span>
                    @if (point.specificLocation) {
                      <span class="point-loc">{{ point.specificLocation }}</span>
                    }
                  </button>
                }
              } @else {
                <div class="empty-message">
                  @if (workAreaId()) {
                    No equipment mapped to this area. Type to search all equipment.
                  } @else {
                    Select a work area on the map, or type to search all equipment.
                  }
                </div>
              }
              @if (hasAreaPoints()) {
                <button type="button" class="search-all-link" (click)="switchToAreaView()">
                  ← Back to area equipment
                </button>
              }
            } @else {
              <!-- Grouped by eqType (area-filtered, with search filter applied) -->
              @if (groupedEntries().length === 0 && searchQuery().length >= 2) {
                <div class="empty-message">No matches in this area for "{{ searchQuery() }}"</div>
              }
              @for (entry of groupedEntries(); track entry[0]) {
                <div class="type-group">
                  <div class="type-header" (click)="toggleGroup(entry[0])">
                    <span class="type-name">{{ entry[0] }}</span>
                    <span class="type-count">({{ entry[1].length }})</span>
                    <span class="type-chevron" [class.expanded]="expandedGroups().has(entry[0])">&#9656;</span>
                  </div>
                  @if (expandedGroups().has(entry[0])) {
                    @for (point of entry[1]; track point.id) {
                      <button type="button" class="point-item" (click)="selectPoint(point)">
                        <span class="point-tag">{{ point.tagNumber }}</span>
                        <span class="point-desc">{{ point.description }}</span>
                        @if (point.specificLocation) {
                          <span class="point-loc">{{ point.specificLocation }}</span>
                        }
                      </button>
                    }
                  }
                </div>
              }

              <button type="button" class="search-all-link" (click)="switchToSearch()">
                Not in this area? Search all equipment
              </button>
            }

            <div class="manual-note">
              Can't find it? Describe the equipment in the Notes field.
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .picker-container { position: relative; }
    .picker-trigger { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px;
      border: 1px solid var(--border-color, #ccc); border-radius: 6px; background: var(--input-bg, #fff);
      color: var(--primary-text); cursor: pointer; font-size: 14px; font-family: inherit; text-align: left; }
    .picker-trigger:hover { border-color: var(--accent-color); }
    .selected-tag { font-weight: 600; white-space: nowrap; }
    .selected-desc { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--secondary-text, #888); font-size: 13px; }
    .placeholder { color: var(--secondary-text, #888); }
    .chevron { margin-left: auto; font-size: 10px; color: var(--secondary-text, #888); }

    .picker-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 999; }
    .picker-panel { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
      width: min(90vw, 500px); max-height: 70vh; background: var(--primary-background, #fff);
      border: 1px solid var(--border-color, #ccc); border-radius: 12px; z-index: 1000;
      display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }

    .panel-header { display: flex; gap: 8px; padding: 12px; border-bottom: 1px solid var(--border-color, #ccc); }
    .search-input { flex: 1; padding: 8px 10px; border: 1px solid var(--border-color, #ccc); border-radius: 6px;
      font-size: 14px; background: var(--input-bg, #fff); color: var(--primary-text); font-family: inherit; }
    .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--secondary-text, #888);
      padding: 4px 8px; }

    .panel-body { flex: 1; overflow-y: auto; padding: 8px; }
    .section-label { font-size: 12px; font-weight: 600; color: var(--secondary-text, #888); padding: 4px 8px;
      text-transform: uppercase; letter-spacing: 0.5px; }
    .empty-message { padding: 16px 8px; text-align: center; color: var(--secondary-text, #888); font-size: 14px; }

    .type-group { margin-bottom: 4px; }
    .type-header { display: flex; align-items: center; gap: 6px; padding: 8px; cursor: pointer;
      border-radius: 6px; font-size: 14px; font-weight: 600; color: var(--primary-text); }
    .type-header:hover { background: var(--hover-background, #f0f2f5); }
    .type-count { color: var(--secondary-text, #888); font-weight: 400; font-size: 13px; }
    .type-chevron { font-size: 10px; margin-left: auto; transition: transform 0.15s; }
    .type-chevron.expanded { transform: rotate(90deg); }

    .point-item { display: flex; flex-direction: column; gap: 2px; width: 100%; padding: 8px 12px;
      border: none; background: none; cursor: pointer; border-radius: 6px; text-align: left;
      color: var(--primary-text); font-family: inherit; }
    .point-item:hover { background: var(--selected-background, #cce5ff); }
    .point-tag { font-size: 14px; font-weight: 600; }
    .point-desc { font-size: 13px; color: var(--secondary-text, #888); }
    .point-loc { font-size: 12px; color: var(--secondary-text, #888); font-style: italic; }

    .search-all-link { display: block; width: 100%; padding: 10px; margin-top: 8px;
      background: none; border: 1px dashed var(--border-color, #ccc); border-radius: 6px;
      color: var(--accent-color); cursor: pointer; font-size: 13px; font-family: inherit; text-align: center; }
    .search-all-link:hover { background: var(--hover-background, #f0f2f5); }

    .search-prompt { padding: 4px 0 8px; }
    .inline-search { width: 100%; }
    .manual-note { padding: 8px; margin-top: 8px; font-size: 12px; color: var(--secondary-text, #888);
      text-align: center; border-top: 1px solid var(--border-color, #ccc); }

    @media (max-width: 768px) {
      .picker-panel { width: 100vw; height: 100vh; max-height: 100vh; top: 0; left: 0;
        transform: none; border-radius: 0; }
    }
  `]
})
export class EquipmentPickerComponent implements ControlValueAccessor, OnInit {
  workAreaId = input<number | null>(null);

  private equipmentService = inject(EquipmentDataService);

  isOpen = signal(false);
  searchQuery = signal('');
  selectedPoint = signal<PwaLotoPointEntry | null>(null);
  expandedGroups = signal<Set<string>>(new Set());
  searchAllMode = signal(false);

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  // Area-filtered points
  private areaPoints = computed(() => {
    const areaId = this.workAreaId();
    if (!areaId) return [] as PwaLotoPointEntry[];
    return this.equipmentService.getPointsForWorkArea(areaId);
  });

  // Filtered + grouped: apply search within area points
  groupedPoints = computed(() => {
    let points = this.areaPoints();
    const query = this.searchQuery();
    if (query.length >= 2) {
      points = this.equipmentService.searchPoints(query, points);
    }
    return this.equipmentService.getPointsGroupedByEqType(points);
  });

  groupedEntries = computed(() => Array.from(this.groupedPoints().entries()));

  // Full search results (all points)
  searchResults = computed(() => {
    const query = this.searchQuery();
    if (query.length < 2) return [] as PwaLotoPointEntry[];
    return this.equipmentService.searchAllPoints(query);
  });

  hasAreaPoints = computed(() => this.areaPoints().length > 0);

  constructor() {
    // Reset expanded groups when area changes (all collapsed by default)
    effect(() => {
      this.groupedEntries(); // track dependency
      this.expandedGroups.set(new Set());
    });
  }

  ngOnInit(): void {
    this.equipmentService.loadAll();
  }

  writeValue(value: any): void {
    if (value && typeof value === 'object' && value.tagNumber) {
      this.selectedPoint.set(value);
    } else if (typeof value === 'string' && value) {
      this.selectedPoint.set({ id: 0, tagNumber: value, description: '', specificLocation: '', eqType: '', locationId: null });
    } else {
      this.selectedPoint.set(null);
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  queryText = '';

  open(): void {
    this.isOpen.set(true);
    this.searchAllMode.set(false);
    this.queryText = '';
    this.searchQuery.set('');
    this.onTouched();
  }

  close(): void {
    this.isOpen.set(false);
  }

  selectPoint(point: PwaLotoPointEntry): void {
    this.selectedPoint.set(point);
    this.onChange(point);
    this.close();
  }

  toggleGroup(name: string): void {
    const current = new Set(this.expandedGroups());
    if (current.has(name)) {
      current.delete(name);
    } else {
      current.add(name);
    }
    this.expandedGroups.set(current);
  }

  onQueryChange(value: string): void {
    this.queryText = value;
    this.searchQuery.set(value);
  }

  switchToSearch(): void {
    this.searchAllMode.set(true);
    this.queryText = '';
    this.searchQuery.set('');
  }

  switchToAreaView(): void {
    this.searchAllMode.set(false);
    this.queryText = '';
    this.searchQuery.set('');
  }
}
