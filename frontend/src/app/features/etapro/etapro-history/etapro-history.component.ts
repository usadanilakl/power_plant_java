import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrendChartComponent } from '../../../shared/trend-chart/trend-chart.component';
import { EtaProStateService } from '../services/etapro-state.service';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';
import { EtaProReadingDto } from '../../../models/etapro/etapro-reading.model';
import { EtaProScrapeJobDto } from '../../../models/etapro/etapro-scrape-job.model';
import { TrendSeries } from '../../../models/trend/trend-series.model';

/**
 * History mode tab: pick points + date range → submit job → watch progress →
 * load completed job → view results in table + trend.
 */
@Component({
  selector: 'app-etapro-history',
  standalone: true,
  imports: [CommonModule, FormsModule, TrendChartComponent],
  template: `
    <div class="history-container">
      <!-- Submit form -->
      <div class="submit-form">
        <h4>Submit New Job</h4>
        <div class="form-row">
          <label>Points:</label>
          <select multiple [(ngModel)]="selectedPointIds" size="5">
            @for (p of availablePoints(); track p.id) {
              <option [value]="p.pointId">{{ p.pointId }} — {{ p.description || '' }}</option>
            }
          </select>
        </div>
        <div class="form-row dates">
          <label>From:</label>
          <input type="datetime-local" [(ngModel)]="rangeStart">
          <label>To:</label>
          <input type="datetime-local" [(ngModel)]="rangeEnd">
        </div>
        <div class="form-row">
          <button class="btn btn-submit"
                  [disabled]="!canSubmit()"
                  (click)="onSubmit()">
            Submit Job
          </button>
          <span class="hint">{{ hint() }}</span>
        </div>
      </div>

      <!-- Jobs list -->
      <div class="jobs-section">
        <h4>Jobs</h4>
        @if (jobs().length === 0) {
          <div class="empty">No jobs yet.</div>
        } @else {
          <table class="jobs-table">
            <thead>
              <tr>
                <th>Range</th>
                <th>Points</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Imported</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (job of jobs(); track job.id) {
                <tr [class.loaded]="loadedJob()?.id === job.id">
                  <td class="range">
                    {{ formatDate(job.rangeStart) }} → {{ formatDate(job.rangeEnd) }}
                  </td>
                  <td class="points">{{ job.pointIds.length }}</td>
                  <td class="progress-cell">
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="job.progressPercent"></div>
                    </div>
                    <span class="progress-text">{{ job.batchesCompleted }}/{{ job.batchesTotal }}</span>
                  </td>
                  <td class="status">
                    <span class="status-badge" [class]="'status-' + (job.status?.toLowerCase() || '')">
                      {{ job.status }}
                    </span>
                  </td>
                  <td class="imported">{{ job.readingsImported }}</td>
                  <td class="actions">
                    @if (job.status === 'COMPLETE') {
                      <button class="btn-small" (click)="onLoad(job)">Load</button>
                    }
                    @if (job.status === 'PENDING' || job.status === 'RUNNING') {
                      <button class="btn-small btn-cancel" (click)="onCancel(job)">Cancel</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Loaded job viewer -->
      @if (loadedJob()) {
        <div class="viewer-section">
          <div class="viewer-header">
            <h4>Loaded: {{ formatDate(loadedJob()!.rangeStart) }} → {{ formatDate(loadedJob()!.rangeEnd) }}</h4>
            <button class="btn-small" (click)="closeViewer()">Close</button>
          </div>
          <div class="viewer-split">
            <div class="viewer-table">
              <h5>Readings ({{ loadedReadings().length }})</h5>
              @if (loadedReadings().length === 0) {
                <div class="empty">Loading...</div>
              } @else {
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Point</th>
                      <th>Time</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of pagedReadings(); track $index) {
                      <tr>
                        <td>{{ r.pointId }}</td>
                        <td>{{ formatTime(r.readingTime) }}</td>
                        <td class="num">{{ r.readingValue?.toFixed(2) ?? 'N/A' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if (loadedReadings().length > pageSize) {
                  <div class="page-info">Showing first {{ pageSize }} of {{ loadedReadings().length }}</div>
                }
              }
            </div>
            <div class="viewer-chart">
              <h5>Trend</h5>
              <app-trend-chart
                [series]="loadedTrendSeries()"
                [showLegend]="true"
                [showZoom]="true">
              </app-trend-chart>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .history-container {
      display: flex; flex-direction: column; flex: 1; min-height: 0;
      gap: 8px; padding: 8px; overflow: auto;
    }
    h4 { margin: 0 0 6px; font-size: 13px; color: var(--secondary-text); text-transform: uppercase; }
    h5 { margin: 0 0 6px; font-size: 12px; color: var(--secondary-text); text-transform: uppercase; }

    .submit-form {
      padding: 10px; background: var(--card-background);
      border: 1px solid var(--border-color); border-radius: 6px; flex-shrink: 0;
    }
    .form-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .form-row label { font-size: 12px; font-weight: 600; min-width: 60px; color: var(--secondary-text); }
    .form-row select, .form-row input {
      padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); font-size: 12px;
    }
    .form-row select { flex: 1; min-height: 100px; }
    .form-row.dates input { font-family: monospace; }
    .btn { padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-submit { background: var(--accent-color); color: var(--header-text); }
    .btn-submit:hover:not(:disabled) { opacity: 0.9; }
    .hint { font-size: 11px; color: var(--secondary-text); }

    .jobs-section {
      padding: 10px; background: var(--card-background);
      border: 1px solid var(--border-color); border-radius: 6px; flex-shrink: 0;
    }
    .empty { padding: 12px; text-align: center; color: var(--secondary-text); font-size: 12px; }

    .jobs-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .jobs-table th {
      text-align: left; padding: 6px 8px; background: var(--hover-background);
      color: var(--secondary-text); font-weight: 600; border-bottom: 1px solid var(--border-color);
    }
    .jobs-table td { padding: 6px 8px; border-bottom: 1px solid var(--border-color); }
    .jobs-table tr.loaded { background: var(--hover-background); }
    .range { font-family: monospace; font-size: 11px; }
    .points, .imported { text-align: right; font-family: monospace; }
    .progress-cell { display: flex; align-items: center; gap: 6px; min-width: 140px; }
    .progress-bar { flex: 1; height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; background: #4caf50; transition: width 0.3s; }
    .progress-text { font-family: monospace; font-size: 11px; color: var(--secondary-text); }

    .status-badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .status-pending { background: #e0e0e0; color: #555; }
    .status-running { background: #fff3cd; color: #856404; animation: pulse 2s infinite; }
    .status-complete { background: #d4edda; color: #155724; }
    .status-failed { background: #f8d7da; color: #721c24; }
    .status-cancelled { background: #d1ecf1; color: #0c5460; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

    .actions { display: flex; gap: 4px; }
    .btn-small {
      padding: 4px 10px; border: 1px solid var(--border-color); border-radius: 3px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 11px;
    }
    .btn-small:hover { background: var(--hover-background); }
    .btn-cancel { background: #f44336; color: white; border-color: #f44336; }
    .btn-cancel:hover { background: #e53935; }

    .viewer-section {
      padding: 10px; background: var(--card-background);
      border: 1px solid var(--border-color); border-radius: 6px;
      display: flex; flex-direction: column; flex: 1; min-height: 400px;
    }
    .viewer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .viewer-split {
      display: grid; grid-template-columns: 1fr 2fr; gap: 8px;
      flex: 1; min-height: 0;
    }
    .viewer-table, .viewer-chart {
      display: flex; flex-direction: column; min-height: 0;
      border: 1px solid var(--border-color); border-radius: 4px; padding: 6px;
    }
    .viewer-table { overflow: auto; }
    .viewer-chart { overflow: hidden; }
    .viewer-chart app-trend-chart { flex: 1; min-height: 0; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .data-table th { padding: 4px 6px; background: var(--hover-background); text-align: left; }
    .data-table td { padding: 3px 6px; border-bottom: 1px solid var(--border-color); }
    .data-table .num { text-align: right; font-family: monospace; }
    .page-info { padding: 4px; text-align: center; font-size: 11px; color: var(--secondary-text); }
  `]
})
export class EtaProHistoryComponent implements OnInit, OnDestroy {
  stateService = inject(EtaProStateService);
  private destroyRef = inject(DestroyRef);

  availablePoints = this.stateService.allPoints;
  jobs = this.stateService.recentJobs;
  loadedJob = this.stateService.loadedJob;
  loadedReadings = this.stateService.loadedJobReadings;

  selectedPointIds: string[] = [];
  rangeStart = '';
  rangeEnd = '';
  pageSize = 200;

  canSubmit = computed(() =>
    this.selectedPointIds.length > 0 && !!this.rangeStart && !!this.rangeEnd);

  hint = computed(() => {
    if (this.selectedPointIds.length === 0) return 'Select at least one point';
    const groups = Math.ceil(this.selectedPointIds.length / 20);
    let dayCount = 1;
    if (this.rangeStart && this.rangeEnd) {
      const start = new Date(this.rangeStart).getTime();
      const end = new Date(this.rangeEnd).getTime();
      if (end > start) {
        dayCount = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
      }
    }
    return `${this.selectedPointIds.length} points × ${dayCount} day(s) = ${groups * dayCount} batches`;
  });

  pagedReadings = computed(() => this.loadedReadings().slice(0, this.pageSize));

  loadedTrendSeries = computed((): TrendSeries[] => {
    const job = this.loadedJob();
    if (!job) return [];

    const pointsMap = new Map<string, EtaProPointDto>();
    for (const p of this.availablePoints()) {
      if (p.pointId) pointsMap.set(p.pointId, p);
    }

    const grouped = new Map<string, EtaProReadingDto[]>();
    for (const r of this.loadedReadings()) {
      if (!r.pointId) continue;
      const arr = grouped.get(r.pointId) || [];
      arr.push(r);
      grouped.set(r.pointId, arr);
    }

    const series: TrendSeries[] = [];
    for (const [pointId, readings] of grouped) {
      const meta = pointsMap.get(pointId);
      series.push({
        id: pointId,
        label: meta?.description ? `${pointId} — ${meta.description}` : pointId,
        unit: meta?.unit || undefined,
        points: readings
          .filter(r => r.readingValue != null && r.readingTime != null)
          .map(r => ({
            timestamp: r.readingTime!,
            value: r.readingValue!,
            quality: r.quality || undefined,
          }))
      });
    }
    return series;
  });

  ngOnInit(): void {
    this.stateService.loadPoints();
    this.stateService.loadRecentJobs();
    this.stateService.startActiveJobPolling(2000);

    // Default range: last 24h
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.rangeEnd = this.toLocalDateTimeString(now);
    this.rangeStart = this.toLocalDateTimeString(yesterday);
  }

  ngOnDestroy(): void {
    this.stateService.stopActiveJobPolling();
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;
    const start = this.rangeStart + ':00';
    const end = this.rangeEnd + ':00';
    this.stateService.submitHistoryJob(this.selectedPointIds, start, end);
    // Restart polling so the new job's progress shows up promptly
    this.stateService.startActiveJobPolling(2000);
  }

  onCancel(job: EtaProScrapeJobDto): void {
    if (job.id && confirm(`Cancel job for ${job.pointIds.length} points?`)) {
      this.stateService.cancelJob(job.id);
    }
  }

  onLoad(job: EtaProScrapeJobDto): void {
    this.stateService.loadJobReadings(job);
  }

  closeViewer(): void {
    this.stateService.loadedJob.set(null);
    this.stateService.loadedJobReadings.set([]);
  }

  formatDate(s: string | null): string {
    if (!s) return '';
    return new Date(s).toLocaleString();
  }

  formatTime(s: string | null | undefined): string {
    if (!s) return '';
    return new Date(s).toLocaleString();
  }

  private toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
