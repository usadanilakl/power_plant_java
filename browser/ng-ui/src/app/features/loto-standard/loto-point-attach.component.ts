import { Component, ElementRef, ViewChild, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EquipmentFinderApiService } from '../equipment-finder/equipment-finder-api.service';
import { FinderItem, FinderRequest, FinderResult } from '../equipment-finder/equipment-finder.model';
import { FinderFiltersComponent } from '../equipment-finder/finder-filters.component';
import { EquipmentPickerComponent } from '../../shared/forms/equipment-picker/equipment-picker.component';
import { WorkAreaMapSelectComponent } from '../../shared/forms/work-area-map-select/work-area-map-select.component';
import { PwaLotoPointEntry } from '../../services/equipment-data.service';
import { LotoPermitApiService } from '../loto-permit/loto-permit-api.service';
import { LotoStandardApiService } from './loto-standard-api.service';

/** Where picked points are going. The kind decides the endpoint and the create-new deep link. */
export interface AttachTarget {
  kind: 'standard' | 'permit';
  id: number;
}

/**
 * Add LOTO points to a standard or a permit by pointing at the plant instead of typing a tag.
 *
 * <p>Two ways in, mirroring Plant → Finder, because the two are good at opposite things:</p>
 * <ul>
 *   <li><b>Map</b> — pick a work area, then pick points off that area's list. Best when you know where
 *       you are standing. Reads the published offline snapshot, so it works with no signal, but a
 *       point created minutes ago on a desktop will not be in it yet.</li>
 *   <li><b>Filters</b> — the five-field search (tag, description, type, location, specific location),
 *       restricted to LOTO points. A LIVE query, so it sees points the snapshot has not caught up to,
 *       and it finds things that are nowhere near the area you expected.</li>
 * </ul>
 *
 * <p>Both select many at a time and share one attach path. Why this exists at all: the older route
 * asks for the tag number first, so a walker standing in front of a valve whose label is weathered or
 * missing had no way in.</p>
 *
 * <p><b>Server decides.</b> Attaching to a permit requires CONTROL_AUTHORITY and a structurally
 * editable status; attaching to a standard has its own draft/reapproval rules. Neither is re-checked
 * here — refusals surface as the message the server sent, so this component can never disagree with
 * the rule that actually applies.</p>
 *
 * <p>Filter results are restricted to LOTO points ({@code lotoPointsOnly}): an unreferenced equipment
 * row cannot be attached to anything, and including them would eat into the row cap with rows that
 * can never be selected.</p>
 */
@Component({
  selector: 'app-loto-point-attach',
  standalone: true,
  imports: [FormsModule, WorkAreaMapSelectComponent, EquipmentPickerComponent, FinderFiltersComponent],
  template: `
    <div class="at">
      <div class="at-head">
        <span class="at-title">Add points</span>
        <button type="button" class="at-x" (click)="closed.emit()" aria-label="Close">✕</button>
      </div>

      <div class="at-tabs" role="tablist" aria-label="How to find points">
        <button type="button" class="at-tab" role="tab" [class.active]="tab() === 'map'"
                [attr.aria-selected]="tab() === 'map'" (click)="tab.set('map')">Map</button>
        <button type="button" class="at-tab" role="tab" [class.active]="tab() === 'filters'"
                [attr.aria-selected]="tab() === 'filters'" (click)="tab.set('filters')">Filters</button>
      </div>

      @if (tab() === 'map') {
      <app-work-area-map-select
        pickerPurpose="equipment"
        [ngModel]="area()"
        (ngModelChange)="onArea($event)"></app-work-area-map-select>

      @if (area(); as a) {
        <p class="at-area">
          <strong>{{ a.name }}</strong>
          <span>Tap points to select several, or search all equipment from inside the picker.</span>
        </p>
      }

      <app-equipment-picker #picker
        [workAreaId]="area()?.id ?? null"
        [multiple]="true"
        [triggerLabel]="area() ? 'Choose points in ' + area()!.name : 'Choose points…'"
        (pointsSelected)="attach($event)"></app-equipment-picker>
      } @else {
        <!--
          Same five-field search as Plant → Finder, restricted to LOTO points: an unreferenced
          equipment row cannot be attached to anything, so offering one would only produce a
          selection that fails. It is a LIVE query, which also covers the map picker's blind spot —
          the picker reads the published snapshot, so a point created minutes ago is not in it yet.
        -->
        <app-finder-filters
          [searching]="searching()"
          [lotoPointsOnly]="true"
          (searchRequested)="runSearch($event)"
          (cleared)="clearResults()"></app-finder-filters>

        @if (searchError()) { <p class="at-msg at-err">{{ searchError() }}</p> }

        @if (found(); as r) {
          @if (!r.items.length) {
            <p class="at-msg">Nothing matched those filters.</p>
          } @else {
            <p class="at-found">
              {{ r.lotoPointMatches }} match{{ r.lotoPointMatches === 1 ? '' : 'es' }}
              @if (r.truncated) { <span class="at-trunc"> — showing first {{ r.items.length }}</span> }
            </p>
            <div class="at-list">
              @for (item of r.items; track item.id) {
                <button type="button" class="at-row" [class.on]="isChecked(item)" (click)="toggle(item)">
                  <span class="at-check">{{ isChecked(item) ? '☑' : '☐' }}</span>
                  <span class="at-row-main">
                    <span class="at-row-tag">{{ item.tagNumber || '(no tag)' }}</span>
                    @if (item.description) { <span class="at-row-desc">{{ item.description }}</span> }
                    <span class="at-row-meta">{{ metaLine(item) }}</span>
                  </span>
                </button>
              }
            </div>
            <button type="button" class="at-add" [disabled]="!checked().length || !!busy()"
                    (click)="attachChecked()">
              Add {{ checked().length || '' }} selected
            </button>
          }
        }
      }

      @if (busy()) { <p class="at-msg">Adding {{ busy() }}…</p> }
      @if (result()) { <p class="at-msg" [class.at-err]="failed()">{{ result() }}</p> }

      <button type="button" class="at-new" (click)="createNew()">
        + Create a new point{{ area() ? ' in ' + area()!.name : '' }}
      </button>
    </div>
  `,
  styles: [`
    .at { border: 1px solid var(--border-color); border-radius: 10px; padding: 10px; margin-bottom: 10px; background: var(--card-background, #2a2a2a); }
    .at-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .at-title { font-size: 13px; font-weight: 700; color: var(--primary-text); text-transform: uppercase; }
    .at-x { background: none; border: none; color: var(--secondary-text); font-size: 15px; }
    .at-area { margin: 8px 0; font-size: 12px; color: var(--secondary-text); display: flex; flex-direction: column; gap: 2px; }
    .at-area strong { color: var(--primary-text); font-size: 14px; }
    .at-msg { margin: 8px 0 0; font-size: 13px; color: var(--secondary-text); }
    .at-err { color: var(--danger-text, #e74c3c); }
    .at-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; margin-bottom: 10px; border: 1px solid var(--border-color); border-radius: 10px; }
    .at-tab { padding: 8px 10px; border: none; border-radius: 7px; background: transparent; color: var(--secondary-text); font-family: inherit; font-size: 13px; font-weight: 700; }
    .at-tab.active { background: var(--accent-color); color: #fff; }
    .at-found { margin: 10px 0 6px; font-size: 12px; color: var(--secondary-text); }
    .at-trunc { color: #e0a030; }
    .at-list { display: flex; flex-direction: column; gap: 6px; }
    .at-row { display: flex; align-items: flex-start; gap: 8px; text-align: left; background: var(--secondary-background, #1e1e1e); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px; font-family: inherit; }
    .at-row.on { border-color: var(--accent-color); background: var(--info-bg, rgba(21,101,192,0.12)); }
    .at-check { font-size: 15px; line-height: 1.2; }
    .at-row-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .at-row-tag { font-weight: 700; color: var(--primary-text); font-size: 14px; }
    .at-row-desc { color: var(--primary-text); font-size: 12px; }
    .at-row-meta { color: var(--secondary-text); font-size: 11px; }
    .at-add { width: 100%; min-height: 44px; margin-top: 10px; background: var(--accent-color); border: none; border-radius: 8px; color: #fff; font-weight: 700; font-family: inherit; font-size: 14px; }
    .at-add:disabled { opacity: 0.5; }
    .at-new { width: 100%; min-height: 44px; margin-top: 10px; background: none; border: 1px dashed var(--border-color); border-radius: 8px; color: var(--accent-color); font-size: 14px; font-weight: 600; font-family: inherit; }
  `],
})
export class LotoPointAttachComponent {
  target = input.required<AttachTarget>();
  /** One or more points were attached — the host should reload its detail. */
  attached = output<void>();
  closed = output<void>();

  @ViewChild('picker') picker?: EquipmentPickerComponent;

  private finderApi = inject(EquipmentFinderApiService);
  private standardApi = inject(LotoStandardApiService);
  private permitApi = inject(LotoPermitApiService);
  private router = inject(Router);

  tab = signal<'map' | 'filters'>('map');
  area = signal<{ id: number; name: string } | null>(null);

  // ── Filters tab ─────────────────────────────────────────────────────────────
  searching = signal(false);
  searchError = signal<string | null>(null);
  found = signal<FinderResult | null>(null);
  /** Rows ticked in the results list, kept as whole items so the batch can report tags on failure. */
  checked = signal<FinderItem[]>([]);
  busy = signal<string>('');
  result = signal<string>('');
  failed = signal(false);

  /** Choosing an area opens the picker straight away — the extra tap taught nobody anything. */
  onArea(area: { id: number; name: string } | null): void {
    this.area.set(area);
    this.result.set('');
    if (area?.id) requestAnimationFrame(() => this.picker?.open());
  }

  /**
   * Attach the batch one at a time.
   *
   * <p>Sequential, not parallel: each attach mutates the same parent row, and the desktop service
   * re-saves the whole aggregate, so concurrent writes would race to overwrite each other's point
   * list. A failure does not abort the rest — the walker gets a count of what landed and the first
   * reason it stopped for, which beats an all-or-nothing rollback of an eight-point selection.</p>
   */
  async attach(points: PwaLotoPointEntry[]): Promise<void> {
    if (!points.length) return;
    this.result.set('');
    this.failed.set(false);
    let added = 0;
    let firstError = '';

    for (const p of points) {
      this.busy.set(p.tagNumber || `#${p.id}`);
      try {
        const t = this.target();
        if (t.kind === 'standard') await firstValueFrom(this.standardApi.addPointToStandard(t.id, p.id));
        else await firstValueFrom(this.permitApi.addPoint(t.id, p.id));
        added++;
      } catch (e: any) {
        if (!firstError) firstError = e?.error?.message || e?.message || 'Failed';
      }
    }

    this.busy.set('');
    this.failed.set(added < points.length);
    this.result.set(added === points.length
      ? `Added ${added} point${added === 1 ? '' : 's'}.`
      : `Added ${added} of ${points.length}. ${firstError}`);
    if (added) this.attached.emit();
  }

  /** Run the shared filter form's request against the live finder search. */
  async runSearch(request: FinderRequest): Promise<void> {
    this.searchError.set(null);
    this.result.set('');
    this.searching.set(true);
    try {
      const r = await this.finderApi.search(request);
      this.found.set(r);
      this.checked.set([]);
      if (!r) this.searchError.set('Could not reach the server. This search needs a connection.');
    } catch {
      this.found.set(null);
      this.searchError.set('Search failed. Please try again.');
    } finally {
      this.searching.set(false);
    }
  }

  /** Filters cleared — drop the results and the ticks, so neither outlives the words behind them. */
  clearResults(): void {
    this.found.set(null);
    this.checked.set([]);
    this.searchError.set(null);
  }

  isChecked(item: FinderItem): boolean { return this.checked().some(i => i.id === item.id); }

  toggle(item: FinderItem): void {
    this.checked.update(list => list.some(i => i.id === item.id)
      ? list.filter(i => i.id !== item.id)
      : [...list, item]);
  }

  /**
   * Attach the ticked rows. Same batch path as the map picker — the only difference is where the
   * points came from, so the sequential-write reasoning in {@link attach} applies unchanged.
   */
  async attachChecked(): Promise<void> {
    const items = this.checked();
    if (!items.length) return;
    await this.attach(items.map(i => ({
      id: i.id,
      tagNumber: i.tagNumber ?? '',
      description: i.description ?? '',
      specificLocation: i.specificLocation ?? '',
      eqType: i.eqType ?? '',
      locationId: null,
    })));
    this.checked.set([]);
  }

  metaLine(item: FinderItem): string {
    return [item.location, item.eqType, item.specificLocation].filter(Boolean).join(' · ') || '—';
  }

  /**
   * Hand off to the create form with the area carried along, so the new point lands in the right
   * Location without hunting the dropdown, and gets attached to this target on save.
   */
  createNew(): void {
    const t = this.target();
    const queryParams: Record<string, number> = t.kind === 'standard'
      ? { addToStandard: t.id }
      : { addToLoto: t.id };
    const a = this.area();
    if (a?.id) queryParams['areaId'] = a.id;
    void this.router.navigate(['/loto-points/new'], { queryParams });
  }
}
