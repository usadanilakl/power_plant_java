import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TrendChartComponent } from './trend-chart.component';
import { TrendDataAdapter, TrendSeries } from '../../models/trend/trend-series.model';

type Preset = '1h' | '4h' | '24h' | '7d' | 'custom';

@Component({
  selector: 'app-trend-window',
  standalone: true,
  imports: [CommonModule, FormsModule, TrendChartComponent],
  template: `
    <div class="trend-window">
      <div class="header">
        <div class="title-section">
          <h3>{{ title() || (adapter().sourceName + ' — Trend') }}</h3>
          <span class="series-count">{{ series().length }} series</span>
        </div>
        <div class="controls">
          <div class="preset-tabs">
            @for (p of presets; track p) {
              <button [class.active]="preset() === p" (click)="onPresetChange(p)">{{ p }}</button>
            }
          </div>
          @if (preset() === 'custom') {
            <div class="custom-range">
              <input type="datetime-local" [(ngModel)]="customStart" (ngModelChange)="onCustomRangeChange()">
              <span>→</span>
              <input type="datetime-local" [(ngModel)]="customEnd" (ngModelChange)="onCustomRangeChange()">
            </div>
          }
          <button class="btn-refresh" (click)="loadData()" [disabled]="loading()">
            {{ loading() ? '...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <div class="chart-area">
        @if (errorMessage()) {
          <div class="error-state">{{ errorMessage() }}</div>
        } @else {
          <app-trend-chart
            [series]="series()"
            [showLegend]="true"
            [showZoom]="true">
          </app-trend-chart>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; min-height: 500px; min-width: 700px; }
    .trend-window { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .header {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;
      padding: 8px 12px; gap: 12px; border-bottom: 1px solid var(--border-color); flex-shrink: 0;
    }
    .title-section { display: flex; align-items: center; gap: 8px; }
    .title-section h3 { margin: 0; font-size: 14px; font-weight: 600; }
    .series-count { font-size: 12px; color: var(--secondary-text); }
    .controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .preset-tabs { display: flex; gap: 2px; }
    .preset-tabs button {
      padding: 4px 10px; border: 1px solid var(--border-color); background: var(--card-background);
      color: var(--primary-text); cursor: pointer; font-size: 12px;
    }
    .preset-tabs button:first-child { border-radius: 4px 0 0 4px; }
    .preset-tabs button:last-child { border-radius: 0 4px 4px 0; }
    .preset-tabs button.active {
      background: var(--accent-color); color: var(--header-text); border-color: var(--accent-color);
    }
    .custom-range { display: flex; align-items: center; gap: 4px; }
    .custom-range input {
      padding: 4px 6px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); font-size: 12px;
    }
    .btn-refresh {
      padding: 4px 12px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--accent-color); color: var(--header-text); cursor: pointer; font-size: 12px;
    }
    .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
    .chart-area { flex: 1; min-height: 0; padding: 8px; display: flex; flex-direction: column; }
    .error-state {
      flex: 1; display: flex; align-items: center; justify-content: center;
      color: #f44336; font-size: 14px;
    }
    app-trend-chart { flex: 1; min-height: 0; }
  `]
})
export class TrendWindowComponent implements OnInit {
  /** Adapter that fetches data from a specific source */
  adapter = input.required<TrendDataAdapter>();
  /** Series IDs to display */
  seriesIds = input.required<string[]>();
  /** Optional title override */
  title = input<string>('');
  /** Initial time range preset */
  initialPreset = input<Preset>('1h');

  private destroyRef = inject(DestroyRef);

  presets: Preset[] = ['1h', '4h', '24h', '7d', 'custom'];
  preset = signal<Preset>('1h');
  customStart = '';
  customEnd = '';

  series = signal<TrendSeries[]>([]);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.preset.set(this.initialPreset());
    this.loadData();
  }

  onPresetChange(p: Preset): void {
    this.preset.set(p);
    if (p !== 'custom') {
      this.loadData();
    } else {
      // Initialize custom range to current preset's range
      const now = new Date();
      const start = new Date(now.getTime() - 60 * 60 * 1000);
      this.customEnd = this.toLocalDateTimeString(now);
      this.customStart = this.toLocalDateTimeString(start);
    }
  }

  onCustomRangeChange(): void {
    if (this.customStart && this.customEnd) {
      this.loadData();
    }
  }

  loadData(): void {
    const ids = this.seriesIds();
    if (!ids.length) {
      this.series.set([]);
      return;
    }

    const { start, end } = this.computeTimeRange();

    this.loading.set(true);
    this.errorMessage.set(null);

    this.adapter().fetchSeries({
      ids,
      startTime: start,
      endTime: end
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: result => {
        this.series.set(result);
        this.loading.set(false);
      },
      error: err => {
        console.error('[TrendWindow] Failed to load data:', err);
        this.errorMessage.set('Failed to load trend data: ' + (err.message || 'unknown error'));
        this.loading.set(false);
      }
    });
  }

  private computeTimeRange(): { start: string; end: string } {
    const p = this.preset();
    if (p === 'custom') {
      return { start: this.customStart, end: this.customEnd };
    }

    const now = new Date();
    const end = this.toLocalDateTimeString(now);
    let start: Date;

    switch (p) {
      case '1h':  start = new Date(now.getTime() - 60 * 60 * 1000); break;
      case '4h':  start = new Date(now.getTime() - 4 * 60 * 60 * 1000); break;
      case '24h': start = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '7d':  start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      default:    start = new Date(now.getTime() - 60 * 60 * 1000);
    }

    return { start: this.toLocalDateTimeString(start), end };
  }

  private toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
}
