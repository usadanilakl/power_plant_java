import { Component, DestroyRef, computed, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TrendChartComponent } from './trend-chart.component';
import { TrendDataAdapter, TrendSeries } from '../../models/trend/trend-series.model';

interface Period { label: string; ms: number; }
interface Available { id: string; label: string; unit?: string; category?: string; }

const MIN = 60_000, HOUR = 3_600_000, DAY = 86_400_000;
const PERIODS: Period[] = [
  { label: '10m',  ms: 10 * MIN },
  { label: '30m',  ms: 30 * MIN },
  { label: '60m',  ms: 60 * MIN },
  { label: '120m', ms: 120 * MIN },
  { label: '5h',   ms: 5 * HOUR },
  { label: '12h',  ms: 12 * HOUR },
  { label: '24h',  ms: 24 * HOUR },
  { label: '7d',   ms: 7 * DAY },
  { label: '30d',  ms: 30 * DAY },
];

/**
 * Self-contained trend window: pick a period + points and it fetches that window from the adapter.
 *
 * <ul>
 *   <li><b>Period</b> presets (10m … 30d) set the window width.</li>
 *   <li><b>Points</b> can be added/removed from the chart (from the adapter's available series).</li>
 *   <li><b>Paging</b> — ◀/▶ shift the whole window by exactly one width (a 10m window pages 10m).</li>
 *   <li><b>Live vs historical</b> is derived from the window: when its right edge is "now" it FOLLOWS
 *       (re-fetches forward every tick); paging back makes it historical/static until you go Live again.</li>
 * </ul>
 */
@Component({
  selector: 'app-trend-window',
  standalone: true,
  imports: [CommonModule, FormsModule, TrendChartComponent],
  template: `
    <div class="trend-window">
      <div class="header">
        <div class="title-row">
          <h3>{{ title() || (adapter().sourceName + ' — Trend') }}</h3>
          @if (isLive()) {
            <span class="badge live"><span class="dot"></span> LIVE</span>
          } @else {
            <span class="badge hist">HISTORICAL</span>
          }
          <span class="range">{{ rangeLabel() }}</span>
          @if (loading()) { <span class="loading">…</span> }
        </div>

        <div class="controls">
          <div class="periods">
            @for (p of periods; track p.label) {
              <button [class.active]="periodMs() === p.ms" (click)="selectPeriod(p.ms)">{{ p.label }}</button>
            }
          </div>
          <div class="pager">
            <button title="Back one window" (click)="pageBack()">◀</button>
            <button title="Forward one window" [disabled]="following()" (click)="pageForward()">▶</button>
            <button class="live-btn" [class.active]="following()" title="Jump to now / follow live"
                    (click)="goLive()">Live</button>
            <select class="refresh-sel" title="Live refresh rate"
                    [ngModel]="refreshMs()" (ngModelChange)="refreshMs.set($event)">
              <option [ngValue]="null">Auto</option>
              <option [ngValue]="1000">1s</option>
              <option [ngValue]="3000">3s</option>
              <option [ngValue]="5000">5s</option>
              <option [ngValue]="10000">10s</option>
              <option [ngValue]="30000">30s</option>
              <option [ngValue]="60000">60s</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Point picker -->
      <div class="points-bar">
        <div class="chips">
          @for (id of pointIds(); track id) {
            <span class="chip">
              {{ labelFor(id) }}
              <button class="chip-x" (click)="removePoint(id)" title="Remove">✕</button>
            </span>
          }
          @if (pointIds().length === 0) {
            <span class="chips-empty">No points — add one to chart →</span>
          }
        </div>
        <div class="add">
          <input type="text" placeholder="Add point…" [ngModel]="addSearch()"
                 (ngModelChange)="addSearch.set($event)" (focus)="pickerOpen.set(true)">
          @if (pickerOpen() && filteredAvailable().length) {
            <div class="add-dropdown">
              @for (a of filteredAvailable(); track a.id) {
                <button class="add-item" (click)="addPoint(a.id)">
                  <span class="ai-id">{{ a.id }}</span>
                  @if (a.label && a.label !== a.id) { <span class="ai-label">{{ a.label }}</span> }
                  @if (a.unit) { <span class="ai-unit">{{ a.unit }}</span> }
                </button>
              }
            </div>
          }
        </div>
      </div>

      <div class="chart-area" (click)="pickerOpen.set(false)">
        @if (errorMessage()) {
          <div class="error-state">{{ errorMessage() }}</div>
        } @else if (pointIds().length === 0) {
          <div class="empty-state">Add one or more points to see the trend.</div>
        } @else {
          <app-trend-chart [series]="series()" [showLegend]="true" [showZoom]="true"></app-trend-chart>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; min-height: 500px; min-width: 700px; }
    .trend-window { display: flex; flex-direction: column; flex: 1; min-height: 0; }

    .header { padding: 8px 12px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
    .title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
    .title-row h3 { margin: 0; font-size: 14px; font-weight: 600; }
    .badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; letter-spacing: .5px; }
    .badge.live { background: #d4edda; color: #155724; display: inline-flex; align-items: center; gap: 5px; }
    .badge.hist { background: #e2e3e5; color: #383d41; }
    .badge .dot { width: 7px; height: 7px; border-radius: 50%; background: #28a745; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
    .range { font-size: 12px; color: var(--secondary-text); font-family: monospace; }
    .loading { color: var(--accent-color); font-weight: 700; }

    .controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .periods { display: flex; gap: 1px; }
    .periods button {
      padding: 4px 9px; border: 1px solid var(--border-color); background: var(--card-background);
      color: var(--primary-text); cursor: pointer; font-size: 12px;
    }
    .periods button:first-child { border-radius: 4px 0 0 4px; }
    .periods button:last-child { border-radius: 0 4px 4px 0; }
    .periods button:not(:first-child) { border-left: none; }
    .periods button.active { background: var(--accent-color); color: var(--header-text); border-color: var(--accent-color); }

    .pager { display: flex; align-items: center; gap: 4px; }
    .pager button {
      padding: 4px 10px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 12px;
    }
    .pager button:disabled { opacity: .4; cursor: not-allowed; }
    .pager .live-btn.active { background: #28a745; color: #fff; border-color: #28a745; }
    .refresh-sel {
      padding: 4px 6px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); font-size: 12px; cursor: pointer;
    }

    .points-bar {
      display: flex; align-items: flex-start; gap: 8px; padding: 6px 12px; flex-shrink: 0;
      border-bottom: 1px solid var(--border-color); flex-wrap: wrap;
    }
    .chips { display: flex; flex-wrap: wrap; gap: 4px; flex: 1; min-width: 200px; }
    .chip {
      display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; font-size: 11px;
      background: var(--hover-background); border: 1px solid var(--border-color); border-radius: 12px;
      font-family: monospace;
    }
    .chip-x { border: none; background: none; cursor: pointer; color: var(--secondary-text); font-size: 11px; padding: 0 2px; }
    .chip-x:hover { color: #f44336; }
    .chips-empty { font-size: 12px; color: var(--secondary-text); font-style: italic; }

    .add { position: relative; }
    .add input {
      padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); font-size: 12px; width: 180px;
    }
    .add-dropdown {
      position: absolute; right: 0; top: 100%; margin-top: 2px; z-index: 20; width: 280px; max-height: 260px;
      overflow: auto; background: var(--card-background); border: 1px solid var(--border-color);
      border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,.15);
    }
    .add-item {
      display: flex; align-items: baseline; gap: 8px; width: 100%; text-align: left; padding: 5px 8px;
      border: none; border-bottom: 1px solid var(--border-color); background: none; cursor: pointer;
      color: var(--primary-text); font-size: 12px;
    }
    .add-item:hover { background: var(--hover-background); }
    .ai-id { font-family: monospace; font-weight: 600; }
    .ai-label { color: var(--secondary-text); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ai-unit { color: var(--secondary-text); font-size: 11px; }

    .chart-area { flex: 1; min-height: 0; padding: 8px; display: flex; flex-direction: column; }
    app-trend-chart { flex: 1; min-height: 0; }
    .error-state, .empty-state {
      flex: 1; display: flex; align-items: center; justify-content: center; font-size: 14px;
    }
    .error-state { color: #f44336; }
    .empty-state { color: var(--secondary-text); }
  `]
})
export class TrendWindowComponent implements OnInit {
  /** Adapter that fetches data + the available-series list. */
  adapter = input.required<TrendDataAdapter>();
  /** Seed points to chart (the window then manages its own add/remove). */
  seriesIds = input<string[]>([]);
  /** Optional title override. */
  title = input<string>('');
  /** Initial period preset label (one of 10m,30m,60m,120m,5h,12h,24h,7d,30d). */
  initialPreset = input<string>('60m');
  /** Emits the current point set whenever it changes (so a host can persist it across remounts). */
  pointsChange = output<string[]>();

  private destroyRef = inject(DestroyRef);

  periods = PERIODS;
  pointIds = signal<string[]>([]);
  periodMs = signal<number>(60 * MIN);
  /** Window right edge (epoch ms). Kept synced to now while following. */
  private anchorEnd = signal<number>(Date.now());
  following = signal<boolean>(true);
  /** Live refresh interval in ms; null = Auto (scaled to the window width). */
  refreshMs = signal<number | null>(null);

  available = signal<Available[]>([]);
  addSearch = signal<string>('');
  pickerOpen = signal<boolean>(false);

  series = signal<TrendSeries[]>([]);
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  private loadedRange = signal<{ start: number; end: number }>({ start: Date.now() - 60 * MIN, end: Date.now() });

  private followTimer: any = null;
  private inflight = false;

  isLive = computed(() => this.following());

  rangeLabel = computed(() => {
    const { start, end } = this.loadedRange();
    return `${this.fmt(start)} → ${this.fmt(end)}`;
  });

  filteredAvailable = computed(() => {
    const q = this.addSearch().trim().toLowerCase();
    const selected = new Set(this.pointIds());
    return this.available()
      .filter(a => !selected.has(a.id))
      .filter(a => !q || a.id.toLowerCase().includes(q) || (a.label || '').toLowerCase().includes(q))
      .slice(0, 50);
  });

  ngOnInit(): void {
    const seed = this.seriesIds();
    this.pointIds.set(seed ? [...seed] : []);
    const preset = PERIODS.find(p => p.label === this.initialPreset());
    if (preset) this.periodMs.set(preset.ms);

    this.adapter().fetchAvailableSeries().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: list => this.available.set(list || []),
      error: () => this.available.set([])
    });

    this.loadData();
    this.startFollowLoop();
  }

  selectPeriod(ms: number): void {
    this.periodMs.set(ms);
    this.loadData();
  }

  pageBack(): void {
    const base = this.following() ? Date.now() : this.anchorEnd();
    this.following.set(false);
    this.anchorEnd.set(base - this.periodMs());
    this.loadData();
  }

  pageForward(): void {
    const next = this.anchorEnd() + this.periodMs();
    if (next >= Date.now()) {
      this.goLive();
    } else {
      this.anchorEnd.set(next);
      this.loadData();
    }
  }

  goLive(): void {
    this.following.set(true);
    this.anchorEnd.set(Date.now());
    this.loadData();
  }

  addPoint(id: string): void {
    if (!this.pointIds().includes(id)) {
      this.pointIds.update(ids => [...ids, id]);
      this.addSearch.set('');
      this.pickerOpen.set(false);
      this.pointsChange.emit(this.pointIds());
      this.loadData();
    }
  }

  removePoint(id: string): void {
    this.pointIds.update(ids => ids.filter(x => x !== id));
    this.series.update(s => s.filter(x => x.id !== id));
    this.pointsChange.emit(this.pointIds());
    if (this.pointIds().length) this.loadData();
  }

  labelFor(id: string): string {
    const a = this.available().find(x => x.id === id);
    return a && a.label && a.label !== id ? `${id}` : id;
  }

  loadData(silent = false): void {
    const ids = this.pointIds();
    if (!ids.length) { this.series.set([]); return; }

    const end = this.following() ? Date.now() : this.anchorEnd();
    if (this.following()) this.anchorEnd.set(end);
    const start = end - this.periodMs();
    this.loadedRange.set({ start, end });

    this.inflight = true;
    if (!silent) this.loading.set(true);   // live ticks are silent — no flashing indicator
    this.errorMessage.set(null);

    this.adapter().fetchSeries({
      ids,
      startTime: this.toLocalDateTimeString(new Date(start)),
      endTime: this.toLocalDateTimeString(new Date(end))
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: result => { this.series.set(result); this.loading.set(false); this.inflight = false; },
      error: err => {
        console.error('[TrendWindow] Failed to load data:', err);
        this.errorMessage.set('Failed to load trend data: ' + (err?.message || 'unknown error'));
        this.loading.set(false); this.inflight = false;
      }
    });
  }

  /**
   * Live cadence: ~3s for short windows (10m–60m) so it genuinely ticks forward, scaling up for very
   * wide windows so they poll gently (capped at 30s). Overlap on slow fetches is prevented by the
   * inflight guard in the follow loop.
   */
  private pollMs(): number {
    const chosen = this.refreshMs();
    if (chosen != null) return chosen;               // user-selected fixed rate
    return Math.max(3_000, Math.min(30_000, Math.round(this.periodMs() / 1200)));  // Auto
  }

  private startFollowLoop(): void {
    const tick = () => {
      this.followTimer = setTimeout(() => {
        if (this.following() && !this.inflight && this.pointIds().length) {
          this.loadData(true);  // following → recomputes end=now, window slides forward (silent)
        }
        tick();
      }, this.pollMs());
    };
    tick();
    this.destroyRef.onDestroy(() => { if (this.followTimer) clearTimeout(this.followTimer); });
  }

  private fmt(ms: number): string {
    const d = new Date(ms);
    const span = this.periodMs();
    // Include the date for windows >= 24h; time-only for short intraday windows.
    return span >= DAY
      ? d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
           `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
}
