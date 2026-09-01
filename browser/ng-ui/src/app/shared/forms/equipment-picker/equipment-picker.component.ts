import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, effect, forwardRef,
  inject, input, output, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  EquipmentDataService, EquipmentFilterMode, EquipmentPointFilters, PwaLocationEntry,
  PwaLotoPointEntry,
} from '../../../services/equipment-data.service';

type PickerFilterKey = 'tagNumber' | 'description' | 'specificLocation' | 'eqType';

interface LocationTab extends PwaLocationEntry {
  label: string;
  count: number;
}

/**
 * The filter boxes, using the Equipment Finder's own labels and placeholders so the two search
 * surfaces read the same. Every key is a string property of `PwaLotoPointEntry`, which is what lets
 * this search run entirely against the offline snapshot — the Finder itself is hub-only and gated
 * on plant access, and the work-request flow is deliberately open to anonymous contractors.
 */
const PICKER_FILTERS: ReadonlyArray<{ key: PickerFilterKey; label: string; placeholder: string }> = [
  { key: 'tagNumber', label: 'Tag number', placeholder: 'e.g. cnd 455' },
  { key: 'description', label: 'Description', placeholder: 'e.g. feedwater pump' },
  { key: 'eqType', label: 'Equipment type', placeholder: 'e.g. valve, breaker' },
  { key: 'specificLocation', label: 'Specific location', placeholder: 'e.g. elev 20, north wall' },
];

@Component({
  selector: 'app-equipment-picker',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EquipmentPickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="picker-container">
      <button type="button" class="picker-trigger" (click)="open()">
        @if (selectedPoint()) {
          <span class="selected-tag">{{ selectedPoint()!.tagNumber }}</span>
          <span class="selected-desc">{{ selectedPoint()!.description }}</span>
        } @else {
          <span class="placeholder">{{ triggerLabel() }}</span>
        }
        <span class="chevron">&#9662;</span>
      </button>

      <!-- Keep the closed dialog mounted so the first tap always has a concrete element to open.
           Once modal, it enters the browser's top layer and stays in the current viewport. -->
      <dialog #pickerDialog class="picker-panel" aria-label="Select equipment"
              (cancel)="onCancel($event)">
          <div class="panel-header">
            <div>
              <div class="panel-title">Select equipment</div>
              <div class="panel-subtitle">
                {{ searchAllMode() || !hasAreaPoints() ? 'All equipment' : 'Selected work area' }}
              </div>
            </div>
            <button type="button" class="close-btn" aria-label="Close equipment picker" (click)="close()">&#10005;</button>
          </div>

          @if (!searchAllMode() && hasAreaPoints() && locationTabs().length > 1) {
            <div class="location-tabs" role="tablist" aria-label="Filter by location">
              <button type="button" class="location-tab" role="tab"
                      [class.active]="activeLocationId() === null"
                      [attr.aria-selected]="activeLocationId() === null"
                      (click)="selectLocation(null)">
                All <span>{{ allFilteredAreaPoints().length }}</span>
              </button>
              @for (location of locationTabs(); track location.id) {
                <button type="button" class="location-tab" role="tab"
                        [class.active]="activeLocationId() === location.id"
                        [attr.aria-selected]="activeLocationId() === location.id"
                        [title]="location.name"
                        (click)="selectLocation(location.id)">
                  {{ location.label }} <span>{{ location.count }}</span>
                </button>
              }
            </div>
          }

          <div class="bucket-filters">
            @for (field of filterFields; track field.key) {
              <div class="bucket-filter">
                <div class="bucket-head">
                  <span class="bucket-label">{{ field.label }}</span>
                  @if (effectiveTerms(field.key).length > 1) {
                    <span class="bucket-modes" [attr.aria-label]="field.label + ' word matching'">
                      <button type="button" class="bucket-mode"
                              [class.active]="modes()[field.key] === 'OR'"
                              (click)="setMode(field.key, 'OR')">any</button>
                      <button type="button" class="bucket-mode"
                              [class.active]="modes()[field.key] === 'AND'"
                              (click)="setMode(field.key, 'AND')">all</button>
                    </span>
                  }
                </div>

                @if (terms()[field.key].length) {
                  <div class="bucket-chips">
                    @for (term of terms()[field.key]; track term) {
                      <button type="button" class="bucket-chip"
                              [attr.aria-label]="'Remove ' + term"
                              (click)="removeTerm(field.key, term)">
                        {{ term }} <span>&#10005;</span>
                      </button>
                    }
                  </div>
                }

                <input type="search" class="bucket-input" autocomplete="off" autocapitalize="none"
                       [placeholder]="field.placeholder" [value]="pending()[field.key]"
                       (input)="onInput(field.key, $event)"
                       (keydown.enter)="commit(field.key)">
              </div>
            }
            @if (hasActiveFilters()) {
              <button type="button" class="clear-filter-btn" (click)="clearFilters()">Clear filters</button>
            }
          </div>

          <div class="panel-body">
            @if (searchAllMode() || !hasAreaPoints()) {
              @if (hasActiveFilters()) {
                <div class="section-label">Search results ({{ searchResults().length }})</div>
                @if (searchResults().length === 0) {
                  <div class="empty-message">No equipment matches these tag and description words.</div>
                }
                @for (point of searchResults(); track point.id) {
                  <button type="button" class="point-item" [class.picked]="isPicked(point)"
                          (click)="selectPoint(point)">
                    @if (multiple()) { <span class="point-check">{{ isPicked(point) ? '☑' : '☐' }}</span> }
                    <span class="point-tag">{{ point.tagNumber }}</span>
                    <span class="point-desc">{{ point.description }}</span>
                    @if (pointMeta(point)) { <span class="point-loc">{{ pointMeta(point) }}</span> }
                  </button>
                }
              } @else {
                <div class="empty-message">
                  Add a Tag number or Description word above. Multiple words can match <strong>all</strong>
                  or <strong>any</strong> within each field.
                </div>
              }
              @if (hasAreaPoints()) {
                <button type="button" class="search-all-link" (click)="switchToAreaView()">
                  &larr; Back to area equipment
                </button>
              }
            } @else {
              @if (groupedEntries().length === 0) {
                <div class="empty-message">No equipment matches this location and filter.</div>
              }
              @for (entry of groupedEntries(); track entry[0]) {
                <div class="type-group">
                  <button type="button" class="type-header" (click)="toggleGroup(entry[0])"
                          [attr.aria-expanded]="expandedGroups().has(entry[0])">
                    <span class="type-name">{{ entry[0] }}</span>
                    <span class="type-count">({{ entry[1].length }})</span>
                    <span class="type-chevron" [class.expanded]="expandedGroups().has(entry[0])">&#9656;</span>
                  </button>
                  @if (expandedGroups().has(entry[0])) {
                    @for (point of entry[1]; track point.id) {
                      <button type="button" class="point-item" [class.picked]="isPicked(point)"
                              (click)="selectPoint(point)">
                        @if (multiple()) { <span class="point-check">{{ isPicked(point) ? '☑' : '☐' }}</span> }
                        <span class="point-tag">{{ point.tagNumber }}</span>
                        <span class="point-desc">{{ point.description }}</span>
                        @if (pointMeta(point)) { <span class="point-loc">{{ pointMeta(point) }}</span> }
                      </button>
                    }
                  }
                </div>
              }

              <button type="button" class="search-all-link" (click)="switchToSearch()">
                Not in this area? Search all equipment
              </button>
            }

            @if (!multiple()) {
              <div class="manual-note">Can't find it? Describe the equipment in the Notes field.</div>
            }
          </div>

          @if (multiple()) {
            <div class="picker-confirm">
              <span class="picker-count">{{ picked().length }} selected</span>
              <button type="button" class="picker-cancel" (click)="close()">Cancel</button>
              <button type="button" class="picker-add" [disabled]="!picked().length" (click)="confirmPicked()">
                Add {{ picked().length || '' }}
              </button>
            </div>
          }
      </dialog>
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

    .picker-panel { box-sizing: border-box; width: min(92vw, 620px); height: min(82dvh, 760px);
      max-width: none; max-height: none; margin: auto; padding: 0; overflow: hidden;
      color: var(--primary-text); background: var(--primary-background, #fff);
      border: 1px solid var(--border-color, #ccc); border-radius: 12px;
      box-shadow: 0 12px 42px rgba(0,0,0,0.35); }
    .picker-panel[open] { display: flex; flex-direction: column; }
    .picker-panel::backdrop { background: rgba(0,0,0,0.48); }

    .panel-header { display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 14px; border-bottom: 1px solid var(--border-color, #ccc); flex-shrink: 0; }
    .panel-title { font-size: 16px; font-weight: 700; }
    .panel-subtitle { margin-top: 2px; color: var(--secondary-text, #888); font-size: 12px; }
    .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--secondary-text, #888); padding: 8px; }

    .location-tabs { display: flex; gap: 6px; padding: 9px 12px; overflow-x: auto; flex-shrink: 0;
      border-bottom: 1px solid var(--border-color, #ccc); scrollbar-width: thin; }
    .location-tab { flex: 0 0 auto; border: 1px solid var(--border-color, #ccc); border-radius: 999px;
      padding: 6px 11px; background: transparent; color: var(--primary-text); font-family: inherit;
      font-size: 12px; font-weight: 600; cursor: pointer; }
    .location-tab span { color: var(--secondary-text, #888); font-weight: 400; }
    .location-tab.active { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
    .location-tab.active span { color: inherit; opacity: 0.85; }

    .bucket-filters { display: grid; grid-template-columns: 1fr 1fr auto; align-items: end; gap: 8px;
      padding: 10px 12px; border-bottom: 1px solid var(--border-color, #ccc); flex-shrink: 0; }
    .bucket-filter { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
    .bucket-head { display: flex; min-height: 22px; align-items: center; justify-content: space-between; gap: 6px; }
    .bucket-label { color: var(--secondary-text, #888); font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .bucket-modes { display: flex; gap: 3px; }
    .bucket-mode { padding: 2px 7px; border: 1px solid var(--border-color, #ccc); border-radius: 999px;
      background: transparent; color: var(--secondary-text, #888); font-family: inherit;
      font-size: 10px; font-weight: 700; cursor: pointer; }
    .bucket-mode.active { border-color: var(--accent-color); background: var(--accent-color); color: #fff; }
    .bucket-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .bucket-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border: none;
      border-radius: 999px; background: var(--accent-color); color: #fff; font-family: inherit;
      font-size: 11px; font-weight: 700; cursor: pointer; }
    .bucket-chip span { font-size: 9px; opacity: 0.8; }
    .bucket-input { box-sizing: border-box; width: 100%; padding: 8px 9px; border: 1px solid var(--border-color, #ccc);
      border-radius: 6px; background: var(--input-bg, #fff); color: var(--primary-text);
      font-family: inherit; font-size: 14px; }
    .clear-filter-btn { padding: 8px 9px; border: 1px solid var(--border-color, #ccc); border-radius: 6px;
      background: transparent; color: var(--secondary-text, #888); font-family: inherit;
      font-size: 12px; font-weight: 600; cursor: pointer; }

    .panel-body { flex: 1; min-height: 0; overflow-y: auto; padding: 8px; }
    .section-label { padding: 4px 8px; color: var(--secondary-text, #888); font-size: 12px;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .empty-message { padding: 20px 10px; text-align: center; color: var(--secondary-text, #888); font-size: 14px; line-height: 1.45; }
    .type-group { margin-bottom: 4px; }
    .type-header { display: flex; width: 100%; align-items: center; gap: 6px; padding: 9px 8px; cursor: pointer;
      border: none; border-radius: 6px; background: none; color: var(--primary-text); font-family: inherit;
      font-size: 14px; font-weight: 600; text-align: left; }
    .type-header:hover { background: var(--hover-background, #f0f2f5); }
    .type-count { color: var(--secondary-text, #888); font-weight: 400; font-size: 13px; }
    .type-chevron { margin-left: auto; font-size: 10px; transition: transform 0.15s; }
    .type-chevron.expanded { transform: rotate(90deg); }
    /* Multi-select affordances. The confirm bar sits outside the scrolling body so a long list
       cannot push it out of reach on a phone. */
    .point-item.picked { border-color: var(--accent-color); background: var(--info-bg, rgba(21,101,192,0.12)); }
    .point-check { margin-right: 6px; font-size: 15px; }
    .picker-confirm { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--border-color); background: var(--secondary-background, #1e1e1e); }
    .picker-count { flex: 1; font-size: 13px; color: var(--secondary-text); }
    .picker-cancel { min-height: 40px; padding: 0 14px; background: none; border: 1px solid var(--border-color); border-radius: 8px; color: var(--secondary-text); font-family: inherit; font-size: 14px; }
    .picker-add { min-height: 40px; padding: 0 18px; background: var(--accent-color); border: none; border-radius: 8px; color: #fff; font-weight: 700; font-family: inherit; font-size: 14px; }
    .picker-add:disabled { opacity: 0.5; }
    .point-item { display: flex; flex-direction: column; gap: 2px; width: 100%; padding: 8px 12px;
      border: none; background: none; cursor: pointer; border-radius: 6px; text-align: left;
      color: var(--primary-text); font-family: inherit; }
    .point-item:hover { background: var(--selected-background, #cce5ff); }
    .point-tag { font-size: 14px; font-weight: 600; }
    .point-desc { font-size: 13px; color: var(--secondary-text, #888); }
    .point-loc { font-size: 12px; color: var(--secondary-text, #888); font-style: italic; }
    .search-all-link { display: block; width: 100%; padding: 10px; margin-top: 8px;
      background: none; border: 1px dashed var(--border-color, #ccc); border-radius: 6px;
      color: var(--accent-color); cursor: pointer; font-family: inherit; font-size: 13px; text-align: center; }
    .manual-note { padding: 10px 8px 8px; margin-top: 8px; color: var(--secondary-text, #888);
      border-top: 1px solid var(--border-color, #ccc); text-align: center; font-size: 12px; }

    @media (max-width: 768px) {
      .picker-panel { width: 100vw; height: 100dvh; margin: 0; border: none; border-radius: 0; }
      .bucket-filters { grid-template-columns: 1fr; align-items: stretch; }
      .clear-filter-btn { justify-self: end; }
    }
  `],
})
export class EquipmentPickerComponent implements ControlValueAccessor, OnInit, OnDestroy {
  workAreaId = input<number | null>(null);
  /**
   * Multi-area filter. When set (non-empty), the picker unions the equipment across
   * every listed area and keeps the "group by equipment type" view intact — grouping
   * is by eqType, not by area, so multiple areas merge naturally. When null or empty
   * it falls back to {@link workAreaId} so every existing single-area host is
   * unaffected. Ordering is preserved as the caller passed it (the first id is the
   * "primary" area — used for the location tabs so a plant-map user still sees the
   * area they originally opened).
   */
  workAreaIds = input<number[] | null>(null);
  pointSelected = output<PwaLotoPointEntry>();

  /**
   * Multi-select mode. Rows toggle instead of closing the dialog, and a footer confirms the batch
   * through {@link pointsSelected}.
   *
   * <p>In this mode the component is NOT acting as a form control — {@code onChange} stays silent,
   * because a ControlValueAccessor value here is a single entry and widening it would change the
   * contract for every existing consumer (Field List, Work Request, the Finder map tab). Hosts that
   * want a batch listen to the output instead.</p>
   */
  multiple = input<boolean>(false);
  /** The confirmed batch, in the order it was picked. Only emitted in {@link multiple} mode. */
  pointsSelected = output<PwaLotoPointEntry[]>();
  /** Trigger label; hosts that open the dialog programmatically can name the action. */
  triggerLabel = input<string>('Select equipment...');

  @ViewChild('pickerDialog') pickerDialog?: ElementRef<HTMLDialogElement>;

  private equipmentService = inject(EquipmentDataService);
  readonly filterFields = PICKER_FILTERS;

  isOpen = signal(false);
  selectedPoint = signal<PwaLotoPointEntry | null>(null);
  /** Multi-select working set. Kept in pick order so the host attaches them the way they were chosen. */
  picked = signal<PwaLotoPointEntry[]>([]);
  expandedGroups = signal<Set<string>>(new Set());
  searchAllMode = signal(false);
  activeLocationId = signal<number | null>(null);
  terms = signal<Record<PickerFilterKey, string[]>>(this.emptyTerms());
  pending = signal<Record<PickerFilterKey, string>>(this.emptyPending());
  modes = signal<Record<PickerFilterKey, EquipmentFilterMode>>(this.defaultModes());

  private onChange: (value: PwaLotoPointEntry | null) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * Effective list of area ids to pull equipment from — {@link workAreaIds} when the
   * host passes a multi-area list, else the single {@link workAreaId} it always had.
   * Empty means "no filter, no points" (same behaviour as the pre-multi picker with
   * a null area id).
   */
  private effectiveAreaIds = computed<number[]>(() => {
    const many = this.workAreaIds();
    if (many && many.length > 0) return many.filter(id => id != null);
    const one = this.workAreaId();
    return one != null ? [one] : [];
  });

  private areaPoints = computed(() => {
    const ids = this.effectiveAreaIds();
    if (!ids.length) return [];
    // Union across every area — dedup by point id (a shared cross-area point
    // otherwise appears twice under the same eqType group).
    const seen = new Set<number>();
    const out: PwaLotoPointEntry[] = [];
    for (const id of ids) {
      for (const p of this.equipmentService.getPointsForWorkArea(id)) {
        if (p.id == null || !seen.has(p.id)) {
          if (p.id != null) seen.add(p.id);
          out.push(p);
        }
      }
    }
    return out;
  });

  hasAreaPoints = computed(() => this.areaPoints().length > 0);
  hasActiveFilters = computed(() => PICKER_FILTERS.some(field => this.effectiveTerms(field.key).length > 0));

  allFilteredAreaPoints = computed(() =>
    this.equipmentService.filterPoints(this.currentFilters(), this.areaPoints()));

  filteredAreaPoints = computed(() => {
    const activeLocationId = this.activeLocationId();
    return activeLocationId == null
      ? this.allFilteredAreaPoints()
      : this.allFilteredAreaPoints().filter(point => point.locationId === activeLocationId);
  });

  locationTabs = computed<LocationTab[]>(() => {
    const ids = this.effectiveAreaIds();
    if (!ids.length) return [];
    // Union locations across every included area, preserving first-seen order and
    // deduping by id (two areas can share a location). Single-area callers see the
    // same tabs they always did.
    const seen = new Set<number>();
    const locations: PwaLocationEntry[] = [];
    for (const id of ids) {
      for (const loc of this.equipmentService.getLocationsForWorkArea(id)) {
        if (loc.id != null && !seen.has(loc.id)) {
          seen.add(loc.id);
          locations.push(loc);
        }
      }
    }
    const labels = this.shortLocationLabels(locations);
    return locations.map((location, index) => ({
      ...location,
      label: labels[index],
      count: this.allFilteredAreaPoints().filter(point => point.locationId === location.id).length,
    }));
  });

  groupedPoints = computed(() => this.equipmentService.getPointsGroupedByEqType(this.filteredAreaPoints()));
  groupedEntries = computed(() => Array.from(this.groupedPoints().entries()));
  searchResults = computed(() => this.hasActiveFilters()
    ? this.equipmentService.filterPoints(this.currentFilters(), undefined, 100)
    : []);

  constructor() {
    effect(() => {
      // Track BOTH inputs so a multi-area host swap resets state just like the single-area one.
      // Reading through effectiveAreaIds() would collapse identical id lists to no-op and miss
      // the case where the caller swaps single ↔ multi with the same primary.
      this.workAreaId();
      this.workAreaIds();
      this.activeLocationId.set(null);
      this.expandedGroups.set(new Set());
    });
  }

  ngOnInit(): void {
    this.equipmentService.loadAll();
  }

  ngOnDestroy(): void {
    if (this.pickerDialog?.nativeElement.open) this.pickerDialog.nativeElement.close();
    document.body.style.overflow = '';
  }

  writeValue(value: PwaLotoPointEntry | string | null): void {
    if (value && typeof value === 'object' && value.tagNumber) {
      this.selectedPoint.set(value);
    } else if (typeof value === 'string' && value) {
      this.selectedPoint.set({ id: 0, tagNumber: value, description: '', specificLocation: '', eqType: '', locationId: null });
    } else {
      this.selectedPoint.set(null);
    }
  }

  registerOnChange(fn: (value: PwaLotoPointEntry | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  open(): void {
    const dialog = this.pickerDialog?.nativeElement;
    if (dialog?.open) return;

    this.searchAllMode.set(false);
    this.activeLocationId.set(null);
    this.clearFilters();
    this.picked.set([]);
    this.isOpen.set(true);
    this.onTouched();
    document.body.style.overflow = 'hidden';
    dialog?.showModal();
  }

  close(): void {
    const dialog = this.pickerDialog?.nativeElement;
    if (dialog?.open) dialog.close();
    this.isOpen.set(false);
    document.body.style.overflow = '';
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  selectPoint(point: PwaLotoPointEntry): void {
    if (this.multiple()) { this.togglePicked(point); return; }
    this.selectedPoint.set(point);
    this.onChange(point);
    this.pointSelected.emit(point);
    this.close();
  }

  /** Add or remove one point from the batch. The dialog stays open — that is the whole point. */
  togglePicked(point: PwaLotoPointEntry): void {
    this.picked.update(list => list.some(p => p.id === point.id)
      ? list.filter(p => p.id !== point.id)
      : [...list, point]);
  }

  isPicked(point: PwaLotoPointEntry): boolean { return this.picked().some(p => p.id === point.id); }

  /** Hand the batch to the host and close. */
  confirmPicked(): void {
    const batch = this.picked();
    if (!batch.length) return;
    this.pointsSelected.emit(batch);
    this.close();
  }

  selectLocation(locationId: number | null): void {
    this.activeLocationId.set(locationId);
    this.expandedGroups.set(new Set());
  }

  toggleGroup(name: string): void {
    const current = new Set(this.expandedGroups());
    current.has(name) ? current.delete(name) : current.add(name);
    this.expandedGroups.set(current);
  }

  onInput(key: PickerFilterKey, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.pending.update(pending => ({ ...pending, [key]: value }));
    if (value.includes(',')) this.commit(key);
  }

  commit(key: PickerFilterKey): void {
    const added = this.tokenize(this.pending()[key]);
    const existing = this.terms()[key];
    const unique = added.filter(term => !existing.some(item => item.toLowerCase() === term.toLowerCase()));
    if (unique.length) this.terms.update(terms => ({ ...terms, [key]: [...existing, ...unique] }));
    this.pending.update(pending => ({ ...pending, [key]: '' }));
  }

  removeTerm(key: PickerFilterKey, term: string): void {
    this.terms.update(terms => ({ ...terms, [key]: terms[key].filter(item => item !== term) }));
  }

  setMode(key: PickerFilterKey, mode: EquipmentFilterMode): void {
    this.modes.update(modes => ({ ...modes, [key]: mode }));
  }

  clearFilters(): void {
    this.terms.set(this.emptyTerms());
    this.pending.set(this.emptyPending());
    this.modes.set(this.defaultModes());
  }

  switchToSearch(): void {
    this.searchAllMode.set(true);
    this.activeLocationId.set(null);
    this.expandedGroups.set(new Set());
  }

  switchToAreaView(): void {
    this.searchAllMode.set(false);
    this.activeLocationId.set(null);
    this.expandedGroups.set(new Set());
  }

  effectiveTerms(key: PickerFilterKey): string[] {
    const combined = [...this.terms()[key], ...this.tokenize(this.pending()[key])];
    return combined.filter((term, index, all) =>
      all.findIndex(item => item.toLowerCase() === term.toLowerCase()) === index);
  }

  pointMeta(point: PwaLotoPointEntry): string {
    const location = this.equipmentService.getLocationName(point.locationId);
    return [location, point.specificLocation].filter(Boolean).join(' · ');
  }

  private currentFilters(): EquipmentPointFilters {
    const filters: EquipmentPointFilters = {};
    for (const field of PICKER_FILTERS) {
      const terms = this.effectiveTerms(field.key);
      if (terms.length) filters[field.key] = { terms, mode: this.modes()[field.key] };
    }
    return filters;
  }

  /** Remove the common leading words so HRSG Lower West/East/North become West/East/North tabs. */
  private shortLocationLabels(locations: PwaLocationEntry[]): string[] {
    const words = locations.map(location => location.name.trim().split(/\s+/).filter(Boolean));
    if (words.length < 2) return locations.map(location => location.name);
    let common = 0;
    while (words.every(parts => parts.length > common && parts[common].toLowerCase() === words[0][common].toLowerCase())) {
      common++;
    }
    return words.map((parts, index) => parts.slice(common).join(' ') || locations[index].name);
  }

  private tokenize(value: string): string[] {
    return (value ?? '').split(/[\s,]+/).map(term => term.trim()).filter(Boolean);
  }

  private emptyTerms(): Record<PickerFilterKey, string[]> {
    return { tagNumber: [], description: [], eqType: [], specificLocation: [] };
  }
  private emptyPending(): Record<PickerFilterKey, string> {
    return { tagNumber: '', description: '', eqType: '', specificLocation: '' };
  }
  private defaultModes(): Record<PickerFilterKey, EquipmentFilterMode> {
    return { tagNumber: 'AND', description: 'AND', eqType: 'AND', specificLocation: 'AND' };
  }
}
