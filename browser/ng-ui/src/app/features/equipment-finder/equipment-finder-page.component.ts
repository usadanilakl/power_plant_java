import { Component, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { EquipmentPickerComponent } from '../../shared/forms/equipment-picker/equipment-picker.component';
import { WorkAreaMapSelectComponent } from '../../shared/forms/work-area-map-select/work-area-map-select.component';
import { PwaLotoPointEntry } from '../../services/equipment-data.service';
import { QrApiService, QrForbiddenError } from '../qr/qr-api.service';
import { QrDrawingHostComponent } from '../qr/qr-drawing-host.component';
import { QrMatch } from '../qr/qr.model';
import { EquipmentFinderApiService } from './equipment-finder-api.service';
import { FinderFiltersComponent } from './finder-filters.component';
import { FinderItem, FinderRequest, FinderResult } from './equipment-finder.model';

/**
 * Equipment Finder — find a LOTO point or a piece of equipment from what you can remember about it,
 * then open its P&amp;ID with that item highlighted.
 *
 * <p>Five independent filter boxes, each a bucket of words with its own AND/OR (AND by default), and
 * boxes always combine with AND. A typed phrase splits into words on whitespace or commas, which is
 * what makes the bucket a bucket: "455 cnd" hunts two fragments and finds 1CND455, where the phrase
 * searched whole finds nothing. Words become chips so it stays visible what is actually being
 * searched for — and so a phone keyboard cannot quietly merge two terms into one.</p>
 *
 * <p>Location and Equipment type additionally suggest known Value names as you type, without ceasing
 * to be free text; see {@code loadOptions}.</p>
 *
 * <p>Equipment appears only where no LOTO point references it — a referenced equipment row IS the LOTO
 * point's occurrence on the drawing, so listing both would show one physical thing twice. That rule
 * lives on the server; see {@code PwaEquipmentFinderService}.</p>
 *
 * <p>Opening a row reuses the scanned-label machinery wholesale: {@code QrApiService.resolveItem} for
 * the drawings and {@link QrDrawingHostComponent} for the viewer, connectors and back stack.</p>
 */
@Component({
  selector: 'app-equipment-finder-page',
  standalone: true,
  imports: [
    FormsModule, MainLayoutComponent, QrDrawingHostComponent, WorkAreaMapSelectComponent,
    EquipmentPickerComponent, FinderFiltersComponent,
  ],
  template: `
    <app-main-layout [header]="'Equipment Finder'">
      <ng-container main-content>
        <div class="ef-container">

          <div class="ef-tabs" role="tablist" aria-label="Equipment finder view">
            <button type="button" class="ef-tab" role="tab"
                    [class.active]="activeTab() === 'filters'"
                    [attr.aria-selected]="activeTab() === 'filters'"
                    (click)="activeTab.set('filters')">Filters</button>
            <button type="button" class="ef-tab" role="tab"
                    [class.active]="activeTab() === 'map'"
                    [attr.aria-selected]="activeTab() === 'map'"
                    (click)="activeTab.set('map')">Map</button>
          </div>

          @if (activeTab() === 'filters') {
          <div class="ef-filter-pane">
            <app-finder-filters
              [searching]="searching()"
              (searchRequested)="runSearch($event)"
              (cleared)="clearResults()"></app-finder-filters>

          @if (error()) {
            <p class="ef-msg ef-err">{{ error() }}</p>
          }
          <!-- Only the list-level notices land here; a row-level one renders on its own row instead. -->
          @if (notice() && !noticeKey()) {
            <p class="ef-msg ef-notice">{{ notice() }}</p>
          }

            @if (result(); as r) {
            @if (!r.items.length) {
              <p class="ef-msg">Nothing matched those filters.</p>
            } @else {
              <p class="ef-summary">
                {{ r.lotoPointMatches }} LOTO {{ r.lotoPointMatches === 1 ? 'point' : 'points' }}
                · {{ r.equipmentMatches }} unreferenced equipment
                @if (r.truncated) { <span class="ef-trunc"> — showing first {{ r.items.length }}</span> }
              </p>
              <div class="ef-list">
                @for (item of r.items; track item.type + item.id) {
                  <button class="ef-item" [class.opening]="openingKey() === item.type + item.id"
                          (click)="open(item)">
                    <span class="ef-item-head">
                      <span class="ef-tag">{{ item.tagNumber || '(no tag)' }}</span>
                      <span class="ef-badge" [class.equipment]="item.type === 'equipment'">
                        {{ item.type === 'lotoPoint' ? 'LOTO point' : 'Equipment' }}
                      </span>
                    </span>
                    @if (item.description) { <span class="ef-desc">{{ item.description }}</span> }
                    <span class="ef-meta">
                      {{ metaLine(item) }}
                      @if (!item.hasDrawing) { <span class="ef-nodraw"> · no drawing</span> }
                    </span>
                    <!-- Row-level outcome shown ON the row: a message at the top of a long list is
                         off-screen by the time you have scrolled down far enough to tap this one. -->
                    @if (noticeKey() === item.type + item.id) {
                      <span class="ef-row-note">{{ notice() }}</span>
                    }
                  </button>
                }
              </div>
            }
            }
          </div>
          } @else {
            <div class="ef-map-pane">
              <app-work-area-map-select
                pickerPurpose="equipment"
                [ngModel]="selectedWorkArea"
                (ngModelChange)="onWorkAreaSelected($event)">
              </app-work-area-map-select>

              <div class="ef-map-equipment">
                @if (selectedWorkArea?.id) {
                  <p class="ef-map-selection">
                    <strong>{{ selectedWorkArea?.name }}</strong>
                    <span>Browse equipment by type and Location Value, or search by tag and description.</span>
                  </p>
                }
                <app-equipment-picker #mapEquipmentPicker
                  [workAreaId]="selectedWorkArea?.id ?? null"
                  (pointSelected)="openMapPoint($event)">
                </app-equipment-picker>
                @if (notice() && noticeKey()) {
                  <p class="ef-msg ef-notice">{{ notice() }}</p>
                }
              </div>
            </div>
          }
        </div>
      </ng-container>
    </app-main-layout>

    @if (selected(); as m) {
      <app-qr-drawing-host [title]="m.tagNumber || 'Item'" [drawings]="m.drawings" (exit)="closeDrawing()"></app-qr-drawing-host>
    }
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .ef-container { padding: 1rem; max-width: 900px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .ef-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; margin-bottom: 1rem;
      border: 1px solid var(--border-color); border-radius: 10px; background: var(--card-bg, #2a2a2a); }
    .ef-tab { padding: 0.65rem 1rem; border: none; border-radius: 7px; background: transparent;
      color: var(--secondary-text, #888); font-family: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
    .ef-tab.active { background: var(--accent-color); color: #fff; }
    .ef-filter-pane { max-width: 720px; margin: 0 auto; }
    .ef-map-pane { display: flex; flex-direction: column; gap: 0.9rem; }
    .ef-map-equipment { max-width: 720px; width: 100%; margin: 0 auto; }
    .ef-map-selection { display: flex; flex-direction: column; gap: 0.2rem; margin: 0 0 0.55rem;
      color: var(--primary-text); font-size: 0.9rem; }
    .ef-map-selection span { color: var(--secondary-text, #888); font-size: 0.78rem; }
    .ef-filters { display: flex; flex-direction: column; gap: 0.75rem; }
    .ef-filter { display: flex; flex-direction: column; gap: 0.35rem; }
    .ef-filter-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .ef-label { font-size: 0.8rem; font-weight: 700; color: var(--secondary-text, #888); text-transform: uppercase; letter-spacing: 0.03em; }
    .ef-modes { display: flex; gap: 0.25rem; }
    .ef-mode { background: transparent; border: 1px solid var(--border-color); color: var(--secondary-text, #888); border-radius: 999px; padding: 0.1rem 0.6rem; font-size: 0.72rem; font-weight: 700; font-family: inherit; cursor: pointer; }
    .ef-mode.active { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
    .ef-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .ef-chip { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--accent-color); color: #fff; border: none; border-radius: 999px; padding: 0.25rem 0.7rem; font-size: 0.8rem; font-weight: 700; font-family: inherit; cursor: pointer; }
    .ef-chip-x { opacity: 0.75; font-size: 0.7rem; }
    /* Anchor for the dropdown; the list floats so it never pushes the form around while typing. */
    .ef-input-wrap { position: relative; }
    .ef-suggest { position: absolute; top: calc(100% + 2px); left: 0; right: 0; z-index: 5; display: flex; flex-direction: column; background: var(--secondary-background, #1e1e1e); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; max-height: 15rem; overflow-y: auto; box-shadow: 0 6px 18px rgba(0,0,0,0.45); }
    .ef-suggest-item { text-align: left; background: transparent; border: none; border-bottom: 1px solid var(--border-color); color: var(--primary-text); padding: 0.55rem 0.8rem; font-family: inherit; font-size: 0.9rem; cursor: pointer; }
    .ef-suggest-item:last-child { border-bottom: none; }
    .ef-suggest-item:active { background: var(--accent-color); color: #fff; }
    .ef-input { width: 100%; box-sizing: border-box; padding: 0.6rem 0.8rem; background: var(--card-bg, #2a2a2a); color: var(--primary-text); border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 0.95rem; }
    .ef-actions { display: flex; gap: 0.5rem; margin: 1rem 0 0.5rem; }
    .ef-btn { flex: 1; background: var(--accent-color); color: #fff; border: none; border-radius: 8px; padding: 0.7rem 1rem; font-weight: 700; font-family: inherit; font-size: 0.95rem; cursor: pointer; }
    .ef-btn[disabled] { opacity: 0.6; }
    .ef-btn-plain { flex: 0 0 auto; background: transparent; border: 1px solid var(--border-color); color: var(--secondary-text, #888); }
    .ef-msg { color: var(--primary-text); text-align: center; margin: 0.8rem 0; }
    .ef-err { color: #e74c3c; }
    .ef-notice { color: var(--secondary-text, #888); font-size: 0.85rem; }
    .ef-summary { color: var(--secondary-text, #888); font-size: 0.8rem; margin: 0.9rem 0 0.5rem; }
    .ef-trunc { color: #e0a030; }
    .ef-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .ef-item { display: flex; flex-direction: column; gap: 0.25rem; text-align: left; background: var(--card-bg, #2a2a2a); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.8rem 0.9rem; font-family: inherit; cursor: pointer; }
    .ef-item.opening { opacity: 0.55; }
    .ef-item-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .ef-tag { font-weight: 700; color: var(--primary-text); }
    .ef-badge { flex-shrink: 0; font-size: 0.68rem; font-weight: 700; color: #fff; background: var(--accent-color); border-radius: 999px; padding: 0.15rem 0.55rem; }
    .ef-badge.equipment { background: #6b7280; }
    .ef-desc { color: var(--primary-text); font-size: 0.88rem; }
    .ef-meta { color: var(--secondary-text, #888); font-size: 0.75rem; }
    .ef-nodraw { color: #e0a030; }
    .ef-row-note { color: #e0a030; font-size: 0.78rem; margin-top: 0.15rem; }
  `]
})
export class EquipmentFinderPageComponent {
  @ViewChild('mapEquipmentPicker') mapEquipmentPicker?: EquipmentPickerComponent;

  private api = inject(EquipmentFinderApiService);
  private qrApi = inject(QrApiService);

  activeTab = signal<'filters' | 'map'>('filters');
  selectedWorkArea: { id: number; name: string } | null = null;

  searching = signal(false);
  error = signal<string | null>(null);
  notice = signal<string | null>(null);
  /** Set when {@link notice} belongs to one row, so it renders there instead of above the list. */
  noticeKey = signal<string | null>(null);
  result = signal<FinderResult | null>(null);

  /** The item whose drawings are open, and which row is mid-fetch (rows are one tap from a network call). */
  selected = signal<QrMatch | null>(null);
  openingKey = signal<string | null>(null);

  /** Open the area-filtered picker after a shape resolves to one concrete work area. */
  onWorkAreaSelected(area: { id: number; name: string } | null): void {
    this.selectedWorkArea = area;
    this.clearNotice();
    if (area?.id) requestAnimationFrame(() => this.mapEquipmentPicker?.open());
  }

  /** A map result is a LOTO point, so it can enter the same type+id drawing flow as filter results. */
  openMapPoint(point: PwaLotoPointEntry): void {
    void this.open({
      type: 'lotoPoint',
      id: point.id,
      tagNumber: point.tagNumber,
      description: point.description,
      eqType: point.eqType,
      specificLocation: point.specificLocation,
      hasDrawing: true,
    });
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  /** Run a request the filter form built. It owns the words; this owns the results. */
  async runSearch(request: FinderRequest): Promise<void> {
    this.error.set(null);
    this.clearNotice();
    this.searching.set(true);
    try {
      const r = await this.api.search(request);
      this.result.set(r);
      if (!r) this.error.set('Could not reach the server. This search needs a connection.');
    } catch (e) {
      this.result.set(null);
      this.error.set(e instanceof QrForbiddenError
        ? 'This account does not have plant access, so equipment data is not available.'
        : 'Search failed. Please try again.');
    } finally {
      this.searching.set(false);
    }
  }

  /** Filters were cleared — drop the results too, so a stale list cannot outlive the words behind it. */
  clearResults(): void {
    this.result.set(null);
    this.error.set(null);
    this.clearNotice();
  }

  // ── Opening a row ───────────────────────────────────────────────────────────

  /**
   * Fetch the tapped item's drawings and hand them to the viewer host. Resolved by type + id rather
   * than by tag: a row can be equipment whose tag also belongs to a LOTO point, and a tag lookup would
   * open the point instead of the thing that was tapped.
   */
  async open(item: FinderItem): Promise<void> {
    const key = item.type + item.id;
    this.clearNotice();
    this.openingKey.set(key);
    try {
      const match = await this.qrApi.resolveItem(item.type, item.id);
      if (!match) {
        this.rowNotice(key, 'Could not load this item. If you are offline, this needs a connection.');
        return;
      }
      if (!match.drawings?.length) {
        this.rowNotice(key, 'No drawing is linked to this item yet.');
        return;
      }
      this.selected.set(match);
    } catch (e) {
      this.rowNotice(key, e instanceof QrForbiddenError
        ? 'This account does not have plant access, so drawings are not available.'
        : 'Could not open this drawing.');
    } finally {
      this.openingKey.set(null);
    }
  }

  closeDrawing(): void { this.selected.set(null); }

  /** Attach a message to one row rather than to the list. */
  private rowNotice(key: string, message: string): void {
    this.notice.set(message);
    this.noticeKey.set(key);
  }

  private clearNotice(): void {
    this.notice.set(null);
    this.noticeKey.set(null);
  }

  metaLine(item: FinderItem): string {
    return [item.location, item.eqType, item.specificLocation].filter(Boolean).join(' · ') || '—';
  }

}
