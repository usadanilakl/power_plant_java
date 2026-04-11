import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';
import { TrendChartComponent } from '../../../shared/trend-chart/trend-chart.component';
import { EtaProPointPickerComponent } from '../etapro-point-picker/etapro-point-picker.component';
import { EtaProStateService } from '../services/etapro-state.service';
import { EtaProApiService } from '../services/etapro-api.service';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';
import { EtaProReadingDto } from '../../../models/etapro/etapro-reading.model';
import { TrendSeries } from '../../../models/trend/trend-series.model';

@Component({
  selector: 'app-etapro-live',
  standalone: true,
  imports: [CommonModule, FormsModule, EtaProPointPickerComponent, TrendChartComponent],
  template: `
    <div class="live-container">
      @if (!isActive()) {
        <!-- Point selection mode -->
        <div class="selection-header">
          <span class="count">{{ selectedPointIds.length }} points selected</span>
          <button class="btn btn-start" [disabled]="selectedPointIds.length === 0" (click)="onStart()">
            Start Live ({{ selectedPointIds.length }})
          </button>
        </div>
        <div class="table-area">
          <app-etapro-point-picker
            (selectedItemsEvent)="onPointsSelected($event)">
          </app-etapro-point-picker>
        </div>
      } @else {
        <!-- Live mode active -->
        <div class="status-bar">
          <span class="status-dot active"></span>
          <span class="status-text">{{ statusLabel() }}</span>
          @if (status().lastCycleAt) {
            <span class="status-text"> · last cycle: {{ formatTime(status().lastCycleAt) }}</span>
          }
          @if (status().engineStatus) {
            <span class="status-text muted"> · engine: {{ status().engineStatus }}</span>
          }
          <button class="btn btn-stop" (click)="onStop()">Stop Live</button>
        </div>

        <div class="split-view">
          <div class="table-panel">
            <h4>Latest Values</h4>
            @if (latestByPoint().length === 0) {
              <div class="empty">Waiting for first data...</div>
            } @else {
              <table class="live-table">
                <thead>
                  <tr><th>Point</th><th>Value</th><th>Unit</th><th>Timestamp</th></tr>
                </thead>
                <tbody>
                  @for (r of latestByPoint(); track r.pointId) {
                    <tr [class.stale]="isStale(r)">
                      <td class="point-id">{{ r.pointId }}</td>
                      <td class="value">{{ r.readingValue != null ? r.readingValue.toFixed(2) : 'N/A' }}</td>
                      <td class="unit">{{ getUnit(r.pointId!) }}</td>
                      <td class="time">{{ formatTime(r.readingTime) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
          <div class="chart-panel">
            <h4>Rolling Trend (last ~1 min)</h4>
            <app-trend-chart
              [series]="trendSeries()"
              [showLegend]="true"
              [showZoom]="false">
            </app-trend-chart>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .live-container { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 8px; }

    .selection-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px; flex-shrink: 0;
    }
    .count { font-size: 13px; color: var(--secondary-text); }
    .table-area { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
    .table-area app-table { flex: 1; min-height: 0; }

    .btn { padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-start { background: #4caf50; color: white; }
    .btn-start:hover:not(:disabled) { background: #43a047; }
    .btn-stop { background: #f44336; color: white; margin-left: auto; }
    .btn-stop:hover { background: #e53935; }

    .status-bar {
      display: flex; align-items: center; gap: 6px; padding: 6px 10px;
      background: var(--card-background); border: 1px solid var(--border-color); border-radius: 4px;
      font-size: 12px; flex-shrink: 0;
    }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; background: #9e9e9e; }
    .status-dot.active { background: #4caf50; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .status-text { color: var(--primary-text); }
    .status-text.muted { color: var(--secondary-text); }

    .split-view {
      display: grid; grid-template-columns: 1fr 2fr; gap: 8px;
      flex: 1; min-height: 0; overflow: hidden;
    }
    .table-panel, .chart-panel {
      display: flex; flex-direction: column; min-height: 0;
      background: var(--card-background); border: 1px solid var(--border-color); border-radius: 6px;
      padding: 8px;
    }
    .table-panel h4, .chart-panel h4 {
      margin: 0 0 6px; font-size: 13px; font-weight: 600; color: var(--secondary-text);
      text-transform: uppercase;
    }
    .table-panel { overflow: auto; }
    .chart-panel { overflow: hidden; }
    .chart-panel app-trend-chart { flex: 1; min-height: 0; }

    .live-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .live-table th {
      text-align: left; padding: 6px 8px; background: var(--hover-background);
      color: var(--secondary-text); font-weight: 600; border-bottom: 1px solid var(--border-color);
      position: sticky; top: 0;
    }
    .live-table td { padding: 6px 8px; border-bottom: 1px solid var(--border-color); }
    .live-table tr.stale td { color: var(--secondary-text); font-style: italic; }
    .point-id { font-weight: 600; font-family: monospace; }
    .value { text-align: right; font-family: monospace; font-size: 14px; font-weight: 600; }
    .unit { color: var(--secondary-text); }
    .time { color: var(--secondary-text); font-size: 11px; }
    .empty { padding: 16px; text-align: center; color: var(--secondary-text); font-size: 12px; }
  `]
})
export class EtaProLiveComponent implements OnInit, OnDestroy {
  stateService = inject(EtaProStateService);
  private apiService = inject(EtaProApiService);
  private destroyRef = inject(DestroyRef);

  points = this.stateService.allPoints;
  status = this.stateService.liveStatus;
  liveReadings = this.stateService.liveReadings;

  selectedPointIds: string[] = [];

  private trendHistory = signal<Map<string, EtaProReadingDto[]>>(new Map());
  private readonly TREND_WINDOW_SECONDS = 60;

  isActive = computed(() => this.status().active);

  statusLabel = computed(() => {
    const s = this.status();
    if (s.active) return `LIVE — ${(s.pointIds?.length ?? 0)} points`;
    return 'Stopped';
  });

  latestByPoint = computed(() => {
    const map = new Map<string, EtaProReadingDto>();
    for (const r of this.liveReadings()) {
      if (!r.pointId) continue;
      const existing = map.get(r.pointId);
      if (!existing || (r.readingTime && existing.readingTime && r.readingTime > existing.readingTime)) {
        map.set(r.pointId, r);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.pointId || '').localeCompare(b.pointId || ''));
  });

  trendSeries = computed((): TrendSeries[] => {
    const history = this.trendHistory();
    const pointsMap = new Map<string, EtaProPointDto>();
    for (const p of this.points()) {
      if (p.pointId) pointsMap.set(p.pointId, p);
    }
    const series: TrendSeries[] = [];
    for (const [pointId, readings] of history) {
      const meta = pointsMap.get(pointId);
      series.push({
        id: pointId,
        label: meta?.description ? `${pointId} — ${meta.description}` : pointId,
        unit: meta?.unit || undefined,
        points: readings
          .filter(r => r.readingValue != null && r.readingTime != null)
          .map(r => ({ timestamp: r.readingTime!, value: r.readingValue!, quality: r.quality || undefined }))
      });
    }
    return series;
  });

  ngOnInit(): void {
    this.stateService.loadPoints();
    this.stateService.refreshLiveStatus();
    if (this.isActive()) {
      this.stateService.startLivePolling(3000);
    }
  }

  ngOnDestroy(): void {}

  onPointsSelected(items: EtaProPointDto[]): void {
    this.selectedPointIds = items
      .map(p => p.pointId)
      .filter((id): id is string => !!id);
  }

  onStart(): void {
    if (this.selectedPointIds.length === 0) return;
    this.trendHistory.set(new Map());
    this.stateService.startLive(this.selectedPointIds);

    interval(3000).pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(() => this.isActive()),
      switchMap(() => this.apiService.getLatestReadings())
    ).subscribe(res => {
      const readings = (res.responseData || []).map((r: any) => EtaProReadingDto.fromJson(r));
      const subscribed = new Set(this.status().pointIds || []);
      const relevant = readings.filter(r => r.pointId && subscribed.has(r.pointId));
      this.stateService.liveReadings.set(relevant);
      this.appendToTrendHistory(relevant);
    });
  }

  onStop(): void {
    this.stateService.stopLive();
    this.trendHistory.set(new Map());
  }

  getUnit(pointId: string): string {
    return this.points().find(p => p.pointId === pointId)?.unit || '';
  }

  formatTime(ts: string | null | undefined): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString();
  }

  isStale(r: EtaProReadingDto): boolean {
    if (!r.readingTime) return true;
    return Date.now() - new Date(r.readingTime).getTime() > 10_000;
  }

  private appendToTrendHistory(readings: EtaProReadingDto[]): void {
    const history = new Map(this.trendHistory());
    const cutoff = Date.now() - this.TREND_WINDOW_SECONDS * 1000;
    for (const r of readings) {
      if (!r.pointId || !r.readingTime) continue;
      const arr = history.get(r.pointId) || [];
      const last = arr[arr.length - 1];
      if (!last || (last.readingTime && r.readingTime > last.readingTime)) arr.push(r);
      history.set(r.pointId, arr.filter(x => x.readingTime && new Date(x.readingTime).getTime() >= cutoff));
    }
    this.trendHistory.set(history);
  }
}
