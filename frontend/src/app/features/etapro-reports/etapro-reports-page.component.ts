import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap, filter } from 'rxjs';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { TrendChartComponent } from '../../shared/trend-chart/trend-chart.component';
import { EtaProReportApiService, ReportDto, ReportExecutionDto, EventInstance } from './services/etapro-report-api.service';
import { TrendSeries } from '../../models/trend/trend-series.model';

/**
 * Vertical slice: minimal report builder + viewer.
 *
 * Builder: pick anchor point, set threshold, direction, max instances, time range.
 * Viewer: summary cards + event instances table + trend chart per selected instance.
 */
@Component({
  selector: 'app-etapro-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, TrendChartComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="reports-page">
          <div class="tab-bar">
            <button [class.active]="activeTab() === 'builder'" (click)="activeTab.set('builder')">Builder</button>
            <button [class.active]="activeTab() === 'executions'" (click)="activeTab.set('executions')">Executions</button>
          </div>

          @switch (activeTab()) {
            @case ('builder') {
              <div class="builder-section">
                <h3>Threshold Crossing Report</h3>
                <div class="form-grid">
                  <label>Report Name:</label>
                  <input [(ngModel)]="reportName" placeholder="e.g., GT1 Cool-down Time">

                  <label>Anchor Point ID:</label>
                  <input [(ngModel)]="anchorPointId" placeholder="e.g., GT1.SPEED">

                  <label>Threshold:</label>
                  <input type="number" [(ngModel)]="threshold" placeholder="3600">

                  <label>Direction:</label>
                  <select [(ngModel)]="direction">
                    <option value="FALLING_BELOW">Falling Below</option>
                    <option value="RISING_ABOVE">Rising Above</option>
                  </select>

                  <label>End Condition Point:</label>
                  <input [(ngModel)]="endPointAlias" placeholder="same as anchor (leave blank)">

                  <label>End Condition (value <=):</label>
                  <input type="number" [(ngModel)]="endValue" placeholder="0">

                  <label>Max Instances:</label>
                  <input type="number" [(ngModel)]="maxInstances">

                  <label>Search From:</label>
                  <input type="datetime-local" [(ngModel)]="searchFrom">

                  <label>Search To:</label>
                  <input type="datetime-local" [(ngModel)]="searchTo">

                  <label>Max Window (sec):</label>
                  <input type="number" [(ngModel)]="maxWindowSeconds" placeholder="3600">
                </div>
                <div class="builder-actions">
                  <button class="btn btn-preview" (click)="onPreview()">Preview (max 5)</button>
                  <button class="btn btn-save" (click)="onSave()">Save Report</button>
                  <button class="btn btn-run" (click)="onSaveAndRun()" [disabled]="!reportName">Save & Run</button>
                </div>

                <!-- Preview results -->
                @if (previewResult()) {
                  <div class="preview-results">
                    <h4>Preview: {{ previewResult()!.summary.instancesFound }} events found</h4>
                    @for (agg of previewAggregations(); track agg.key) {
                      <span class="agg-badge">{{ agg.key }}: {{ agg.value | number:'1.1-1' }}s</span>
                    }
                  </div>
                }
              </div>
            }

            @case ('executions') {
              <div class="executions-section">
                <!-- Active executions -->
                @if (executions().length === 0) {
                  <div class="empty">No executions yet. Build and run a report first.</div>
                } @else {
                  <div class="exec-list">
                    @for (exec of executions(); track exec.id) {
                      <div class="exec-row" [class.selected]="selectedExecId() === exec.id"
                           (click)="onSelectExecution(exec)">
                        <div class="exec-info">
                          <span class="exec-name">{{ exec.reportName || 'Report #' + exec.reportId }}</span>
                          <span class="exec-meta">{{ exec.instancesFound }} events · {{ exec.durationMs }}ms</span>
                        </div>
                        <span class="status-badge" [class]="'status-' + (exec.status?.toLowerCase() || '')">
                          {{ exec.status }}
                        </span>
                      </div>
                    }
                  </div>
                }

                <!-- Loaded execution viewer -->
                @if (loadedExec()) {
                  <div class="viewer-section">
                    <!-- Summary -->
                    @if (summary()) {
                      <div class="summary-bar">
                        <span class="summary-stat">Events: <strong>{{ summary()!.instancesFound }}</strong></span>
                        @for (agg of summaryAggregations(); track agg.key) {
                          <span class="summary-stat">{{ agg.key }}: <strong>{{ agg.value | number:'1.1-1' }}s</strong></span>
                        }
                      </div>
                    }

                    <!-- Event instances table -->
                    <div class="instances-table-wrapper">
                      <table class="instances-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Trigger Time</th>
                            <th>End Time</th>
                            @for (m of measurementLabels(); track m) {
                              <th>{{ m }}</th>
                            }
                          </tr>
                        </thead>
                        <tbody>
                          @for (inst of instances(); track inst.index) {
                            <tr [class.selected]="selectedInstanceIdx() === inst.index"
                                (click)="onSelectInstance(inst)">
                              <td>{{ inst.index + 1 }}</td>
                              <td class="mono">{{ formatTime(inst.triggerTime) }}</td>
                              <td class="mono">{{ formatTime(inst.endTime) }}</td>
                              @for (m of measurementLabels(); track m) {
                                <td class="num">{{ formatMeasurement(inst.measurements[m]) }}</td>
                              }
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>

                    <!-- Chart for selected instance -->
                    @if (selectedInstanceChart().length > 0) {
                      <div class="chart-area">
                        <h4>Event #{{ (selectedInstanceIdx() ?? 0) + 1 }}</h4>
                        <app-trend-chart
                          [series]="selectedInstanceChart()"
                          [showLegend]="true"
                          [showZoom]="true">
                        </app-trend-chart>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .reports-page { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 8px; overflow: auto; }
    .tab-bar { display: flex; gap: 4px; flex-shrink: 0; }
    .tab-bar button {
      padding: 8px 20px; border: 1px solid var(--border-color); border-radius: 4px 4px 0 0;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px;
      border-bottom: 2px solid transparent;
    }
    .tab-bar button.active { background: var(--accent-color); color: var(--header-text); border-color: var(--accent-color); }
    h3, h4 { margin: 0 0 8px; font-size: 14px; color: var(--secondary-text); }

    .builder-section, .executions-section { padding: 12px; }
    .form-grid { display: grid; grid-template-columns: 180px 1fr; gap: 8px; align-items: center; max-width: 600px; }
    .form-grid label { font-size: 12px; font-weight: 600; color: var(--secondary-text); }
    .form-grid input, .form-grid select {
      padding: 6px 8px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); font-size: 12px;
    }
    .builder-actions { display: flex; gap: 8px; margin-top: 12px; }
    .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-preview { background: var(--card-background); border: 1px solid var(--border-color); color: var(--primary-text); }
    .btn-save { background: var(--accent-color); color: var(--header-text); }
    .btn-run { background: #4caf50; color: white; }
    .preview-results { margin-top: 12px; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; }
    .agg-badge { margin-right: 12px; font-size: 12px; font-weight: 600; }

    .empty { padding: 40px; text-align: center; color: var(--secondary-text); }
    .exec-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
    .exec-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px;
      cursor: pointer; font-size: 12px;
    }
    .exec-row:hover { background: var(--hover-background); }
    .exec-row.selected { border-color: var(--accent-color); background: var(--hover-background); }
    .exec-name { font-weight: 600; }
    .exec-meta { color: var(--secondary-text); margin-left: 8px; }
    .status-badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .status-complete { background: #d4edda; color: #155724; }
    .status-running { background: #fff3cd; color: #856404; }
    .status-failed { background: #f8d7da; color: #721c24; }
    .status-pending { background: #e0e0e0; color: #555; }

    .viewer-section { display: flex; flex-direction: column; gap: 8px; }
    .summary-bar {
      display: flex; gap: 16px; padding: 8px 12px;
      background: var(--card-background); border: 1px solid var(--border-color); border-radius: 4px;
      font-size: 13px;
    }
    .summary-stat strong { font-size: 16px; }

    .instances-table-wrapper { overflow: auto; max-height: 300px; }
    .instances-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .instances-table th {
      text-align: left; padding: 6px 8px; background: var(--hover-background);
      color: var(--secondary-text); font-weight: 600; border-bottom: 1px solid var(--border-color);
      position: sticky; top: 0;
    }
    .instances-table td { padding: 6px 8px; border-bottom: 1px solid var(--border-color); }
    .instances-table tr { cursor: pointer; }
    .instances-table tr:hover { background: var(--hover-background); }
    .instances-table tr.selected { background: var(--hover-background); border-left: 3px solid var(--accent-color); }
    .mono { font-family: monospace; font-size: 11px; }
    .num { text-align: right; font-family: monospace; }

    .chart-area {
      min-height: 350px; padding: 8px;
      border: 1px solid var(--border-color); border-radius: 4px;
      display: flex; flex-direction: column;
    }
    .chart-area app-trend-chart { flex: 1; min-height: 300px; }
  `]
})
export class EtaProReportsPageComponent implements OnInit {
  private api = inject(EtaProReportApiService);
  private destroyRef = inject(DestroyRef);

  activeTab = signal<'builder' | 'executions'>('builder');

  // ── Builder state ─────────────────────────────────────────
  reportName = '';
  anchorPointId = '';
  threshold = 3600;
  direction = 'FALLING_BELOW';
  endPointAlias = '';
  endValue = 0;
  maxInstances = 20;
  searchFrom = '';
  searchTo = '';
  maxWindowSeconds = 3600;

  previewResult = signal<any>(null);
  previewAggregations = computed(() => {
    const r = this.previewResult();
    if (!r?.summary?.aggregations) return [];
    return Object.entries(r.summary.aggregations as Record<string, number>).map(([key, value]) => ({ key, value }));
  });

  // ── Executions state ──────────────────────────────────────
  executions = signal<ReportExecutionDto[]>([]);
  selectedExecId = signal<number | null>(null);
  loadedExec = signal<ReportExecutionDto | null>(null);
  summary = signal<any>(null);
  instances = signal<EventInstance[]>([]);
  selectedInstanceIdx = signal<number | null>(null);

  measurementLabels = computed(() => {
    const inst = this.instances();
    if (inst.length === 0) return [];
    return Object.keys(inst[0].measurements || {});
  });

  summaryAggregations = computed(() => {
    const s = this.summary();
    if (!s?.aggregations) return [];
    return Object.entries(s.aggregations as Record<string, number>).map(([key, value]) => ({ key, value }));
  });

  selectedInstanceChart = computed((): TrendSeries[] => {
    const idx = this.selectedInstanceIdx();
    if (idx === null) return [];
    const inst = this.instances().find(i => i.index === idx);
    if (!inst?.chartData) return [];

    return Object.entries(inst.chartData).map(([alias, points]) => ({
      id: alias,
      label: alias,
      points: points.map(p => ({ timestamp: p.time, value: p.value }))
    }));
  });

  ngOnInit(): void {
    this.loadExecutions();
  }

  // ── Builder actions ─────────────────────────────────────

  private buildDefinitionJson(): string {
    const endAlias = this.endPointAlias || 'anchor';
    return JSON.stringify({
      points: [{ alias: 'anchor', pointId: this.anchorPointId, unit: '' }],
      trigger: {
        type: 'THRESHOLD_CROSSING',
        anchorAlias: 'anchor',
        thresholdCrossing: {
          threshold: this.threshold,
          direction: this.direction,
          minGapBetweenEventsSeconds: 300
        }
      },
      measurements: [{
        label: 'Duration (sec)',
        type: 'DURATION',
        startPointAlias: 'anchor',
        startComparator: this.direction === 'FALLING_BELOW' ? 'LT' : 'GT',
        startValue: this.threshold,
        endPointAlias: endAlias === 'anchor' ? 'anchor' : endAlias,
        endComparator: 'LTE',
        endValue: this.endValue,
        maxWindowSeconds: this.maxWindowSeconds
      }],
      aggregations: [
        { label: 'Average', type: 'AVG', measurementLabel: 'Duration (sec)' },
        { label: 'Min', type: 'MIN', measurementLabel: 'Duration (sec)' },
        { label: 'Max', type: 'MAX', measurementLabel: 'Duration (sec)' }
      ]
    });
  }

  private buildParamsJson(): string {
    return JSON.stringify({
      maxInstances: this.maxInstances,
      searchBackwards: true,
      searchFrom: this.searchFrom || null,
      searchTo: this.searchTo || null,
      contextBeforeSeconds: 300,
      contextAfterSeconds: 300
    });
  }

  onPreview(): void {
    this.api.previewReport(this.buildDefinitionJson(), this.buildParamsJson()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => this.previewResult.set(res.responseData),
      error: err => alert('Preview failed: ' + (err?.error?.message || err.message))
    });
  }

  onSave(): void {
    const dto: any = {
      name: this.reportName,
      description: 'Threshold crossing report',
      category: 'General',
      definitionVersion: 1,
      definitionJson: this.buildDefinitionJson(),
      defaultParamsJson: this.buildParamsJson()
    };
    this.api.createReport(dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => alert('Report saved'),
      error: err => alert('Save failed: ' + (err?.error?.message || err.message))
    });
  }

  onSaveAndRun(): void {
    const dto: any = {
      name: this.reportName,
      description: 'Threshold crossing report',
      category: 'General',
      definitionVersion: 1,
      definitionJson: this.buildDefinitionJson(),
      defaultParamsJson: this.buildParamsJson()
    };
    this.api.createReport(dto).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(res => {
        const id = res.responseData?.id;
        if (!id) throw new Error('No report ID returned');
        return this.api.executeReport(id, this.buildParamsJson());
      })
    ).subscribe({
      next: () => {
        this.activeTab.set('executions');
        this.startPolling();
      },
      error: err => alert('Failed: ' + (err?.error?.message || err.message))
    });
  }

  // ── Executions ──────────────────────────────────────────

  loadExecutions(): void {
    this.api.listExecutions(1, 50).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.executions.set(res.responseData?.content || []);
    });
  }

  startPolling(): void {
    this.loadExecutions();
    interval(2000).pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(() => this.activeTab() === 'executions'),
      switchMap(() => this.api.listExecutions(1, 50))
    ).subscribe(res => {
      const execs = res.responseData?.content || [];
      this.executions.set(execs);
      const hasActive = execs.some(e => e.status === 'PENDING' || e.status === 'RUNNING');
      if (!hasActive) {
        // stop polling — no more active executions
      }
    });
  }

  onSelectExecution(exec: ReportExecutionDto): void {
    this.selectedExecId.set(exec.id);
    if (exec.status !== 'COMPLETE') {
      this.loadedExec.set(null);
      return;
    }

    this.api.getExecution(exec.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      const data = res.responseData;
      if (!data) return;
      this.loadedExec.set(data);

      try {
        this.summary.set(data.summaryJson ? JSON.parse(data.summaryJson) : null);
        const payload = data.resultPayloadJson ? JSON.parse(data.resultPayloadJson) : { instances: [] };
        this.instances.set(payload.instances || []);
        if (payload.instances?.length > 0) {
          this.selectedInstanceIdx.set(0);
        }
      } catch (e) {
        console.error('Failed to parse execution results', e);
      }
    });
  }

  onSelectInstance(inst: EventInstance): void {
    this.selectedInstanceIdx.set(inst.index);
  }

  formatTime(ts: string | null): string {
    if (!ts) return '';
    return new Date(ts).toLocaleString();
  }

  formatMeasurement(v: number | null | undefined): string {
    if (v == null) return 'N/A';
    return v.toFixed(1);
  }
}
