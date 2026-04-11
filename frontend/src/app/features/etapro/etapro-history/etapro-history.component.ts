import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrendChartComponent } from '../../../shared/trend-chart/trend-chart.component';
import { EtaProPointPickerComponent } from '../etapro-point-picker/etapro-point-picker.component';
import { EtaProStateService } from '../services/etapro-state.service';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';
// EtaProMapperService removed — picker component handles its own columns
import { EtaProReadingDto } from '../../../models/etapro/etapro-reading.model';
import { EtaProScrapeJobDto } from '../../../models/etapro/etapro-scrape-job.model';
import { TrendSeries } from '../../../models/trend/trend-series.model';

@Component({
  selector: 'app-etapro-history',
  standalone: true,
  imports: [CommonModule, FormsModule, EtaProPointPickerComponent, TrendChartComponent],
  template: `
    <div class="history-container">
      <!-- Top: point picker table + submit controls -->
      <div class="picker-section" [class.collapsed]="!!loadedJob()">
        <div class="submit-bar">
          <span class="count">{{ selectedPointIds().length }} points selected</span>
          <div class="date-range">
            <label>From:</label>
            <input type="datetime-local" [(ngModel)]="rangeStart">
            <label>To:</label>
            <input type="datetime-local" [(ngModel)]="rangeEnd">
          </div>
          <button class="btn btn-submit" [disabled]="!canSubmit()" (click)="onSubmit()">
            Submit Job ({{ hint() }})
          </button>
        </div>
        @if (!loadedJob()) {
          <div class="picker-table">
            <app-etapro-point-picker
              (selectedItemsEvent)="onPointsSelected($event)">
            </app-etapro-point-picker>
          </div>
        }
      </div>

      <!-- Jobs list -->
      <div class="jobs-section">
        <h4>Jobs</h4>
        @if (jobs().length === 0) {
          <div class="empty">No jobs yet.</div>
        } @else {
          <div class="jobs-list">
            @for (job of jobs(); track job.id) {
              <div class="job-row" [class.loaded]="loadedJob()?.id === job.id">
                <div class="job-info">
                  <span class="job-range">{{ formatDate(job.rangeStart) }} → {{ formatDate(job.rangeEnd) }}</span>
                  <span class="job-meta">{{ job.pointIds.length }} pts · {{ job.readingsImported }} readings</span>
                </div>
                <div class="job-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="job.progressPercent"></div>
                  </div>
                  <span class="progress-text">{{ job.batchesCompleted }}/{{ job.batchesTotal }}</span>
                </div>
                <span class="status-badge" [class]="'status-' + (job.status?.toLowerCase() || '')">{{ job.status }}</span>
                <div class="job-actions">
                  @if (job.status === 'COMPLETE') {
                    <button class="btn-small" (click)="onLoad(job)">Load</button>
                  }
                  @if (job.status === 'PENDING' || job.status === 'RUNNING') {
                    <button class="btn-small btn-cancel" (click)="onCancel(job)">Cancel</button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Loaded job viewer -->
      @if (loadedJob()) {
        <div class="viewer-section">
          <div class="viewer-header">
            <h4>{{ formatDate(loadedJob()!.rangeStart) }} → {{ formatDate(loadedJob()!.rangeEnd) }}
                · {{ loadedReadings().length }} readings</h4>
            <button class="btn-small" (click)="closeViewer()">Close</button>
          </div>
          <div class="viewer-split">
            <div class="viewer-table">
              @if (loadedReadings().length === 0) {
                <div class="empty">Loading...</div>
              } @else {
                <table class="data-table">
                  <thead><tr><th>Point</th><th>Time</th><th>Value</th></tr></thead>
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
    .history-container { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 8px; overflow: hidden; }
    h4 { margin: 0 0 6px; font-size: 13px; color: var(--secondary-text); text-transform: uppercase; }

    .picker-section { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .picker-section.collapsed { flex: 0; }
    .submit-bar {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      padding: 8px; background: var(--card-background);
      border: 1px solid var(--border-color); border-radius: 6px; flex-shrink: 0;
    }
    .count { font-size: 13px; color: var(--secondary-text); white-space: nowrap; }
    .date-range { display: flex; align-items: center; gap: 6px; }
    .date-range label { font-size: 12px; color: var(--secondary-text); }
    .date-range input {
      padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); font-size: 12px;
      font-family: monospace;
    }
    .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-submit { background: var(--accent-color); color: var(--header-text); white-space: nowrap; }
    .btn-submit:hover:not(:disabled) { opacity: 0.9; }

    .picker-table { flex: 1; min-height: 200px; overflow: hidden; display: flex; flex-direction: column; }
    .picker-table app-table { flex: 1; min-height: 0; }

    .jobs-section {
      padding: 8px; background: var(--card-background);
      border: 1px solid var(--border-color); border-radius: 6px; flex-shrink: 0;
    }
    .empty { padding: 12px; text-align: center; color: var(--secondary-text); font-size: 12px; }
    .jobs-list { display: flex; flex-direction: column; gap: 4px; }
    .job-row {
      display: flex; align-items: center; gap: 10px; padding: 6px 8px;
      border: 1px solid var(--border-color); border-radius: 4px; font-size: 12px;
    }
    .job-row.loaded { background: var(--hover-background); border-color: var(--accent-color); }
    .job-info { display: flex; flex-direction: column; gap: 2px; min-width: 200px; }
    .job-range { font-family: monospace; font-size: 11px; }
    .job-meta { font-size: 11px; color: var(--secondary-text); }
    .job-progress { display: flex; align-items: center; gap: 6px; min-width: 120px; }
    .progress-bar { flex: 1; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: #4caf50; transition: width 0.3s; }
    .progress-text { font-family: monospace; font-size: 11px; color: var(--secondary-text); }
    .status-badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .status-pending { background: #e0e0e0; color: #555; }
    .status-running { background: #fff3cd; color: #856404; }
    .status-complete { background: #d4edda; color: #155724; }
    .status-failed { background: #f8d7da; color: #721c24; }
    .status-cancelled { background: #d1ecf1; color: #0c5460; }
    .job-actions { display: flex; gap: 4px; margin-left: auto; }
    .btn-small {
      padding: 4px 10px; border: 1px solid var(--border-color); border-radius: 3px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 11px;
    }
    .btn-small:hover { background: var(--hover-background); }
    .btn-cancel { background: #f44336; color: white; border-color: #f44336; }

    .viewer-section {
      padding: 8px; background: var(--card-background);
      border: 1px solid var(--border-color); border-radius: 6px;
      display: flex; flex-direction: column; flex: 1; min-height: 400px;
    }
    .viewer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .viewer-split { display: grid; grid-template-columns: 1fr 2fr; gap: 8px; flex: 1; min-height: 0; }
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

  points = this.stateService.allPoints;
  jobs = this.stateService.recentJobs;
  loadedJob = this.stateService.loadedJob;
  loadedReadings = this.stateService.loadedJobReadings;

  selectedPointIds = signal<string[]>([]);
  rangeStart = '';
  rangeEnd = '';
  pageSize = 200;

  canSubmit = computed(() =>
    this.selectedPointIds().length > 0 && !!this.rangeStart && !!this.rangeEnd);

  hint = computed(() => {
    if (this.selectedPointIds().length === 0) return 'select points';
    const groups = Math.ceil(this.selectedPointIds().length / 20);
    let dayCount = 1;
    if (this.rangeStart && this.rangeEnd) {
      const ms = new Date(this.rangeEnd).getTime() - new Date(this.rangeStart).getTime();
      if (ms > 0) dayCount = Math.ceil(ms / (24 * 60 * 60 * 1000));
    }
    return `${groups * dayCount} batches`;
  });

  pagedReadings = computed(() => this.loadedReadings().slice(0, this.pageSize));

  loadedTrendSeries = computed((): TrendSeries[] => {
    const job = this.loadedJob();
    if (!job) return [];
    const pointsMap = new Map<string, EtaProPointDto>();
    for (const p of this.points()) { if (p.pointId) pointsMap.set(p.pointId, p); }
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
          .map(r => ({ timestamp: r.readingTime!, value: r.readingValue!, quality: r.quality || undefined }))
      });
    }
    return series;
  });

  ngOnInit(): void {
    this.stateService.loadPoints();
    this.stateService.loadRecentJobs();
    this.stateService.startActiveJobPolling(2000);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.rangeEnd = this.toLocalDateTimeString(now);
    this.rangeStart = this.toLocalDateTimeString(yesterday);
  }

  ngOnDestroy(): void {
    this.stateService.stopActiveJobPolling();
  }

  onPointsSelected(items: EtaProPointDto[]): void {
    this.selectedPointIds.set(
      items.map(p => p.pointId)
           .filter((id): id is string => !!id)
    );
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;
    const start = this.rangeStart.includes(':') && this.rangeStart.length === 16 ? this.rangeStart + ':00' : this.rangeStart;
    const end = this.rangeEnd.includes(':') && this.rangeEnd.length === 16 ? this.rangeEnd + ':00' : this.rangeEnd;
    this.stateService.submitHistoryJob(this.selectedPointIds(), start, end);
    this.stateService.startActiveJobPolling(2000);
  }

  onCancel(job: EtaProScrapeJobDto): void {
    if (job.id) this.stateService.cancelJob(job.id);
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
