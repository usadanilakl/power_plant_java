import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface LotoUsageRow {
  id: number;
  boxNumber: number | null;
  permitNumber: string;
  name: string;
  workScope: string;
  equipmentSystem: string;
  status: string;
  pointCount: number;
  lockCount: number;
  associatedJobs: { jobId: number; permitNumber: string; foreman: string; company: string; workScope: string }[];
  foremen: string[];
  jobCount: number;
  hasNoJobs: boolean;
}

@Component({
  selector: 'app-loto-usage-monitor',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
        <div class="monitor-container">
          <div class="monitor-toolbar">
            <span class="count">{{ rows().length }} active LOTO(s)</span>
            <span class="orphan-count" *ngIf="orphanCount() > 0">
              <mat-icon class="warn-icon">warning</mat-icon>
              {{ orphanCount() }} with no associated jobs
            </span>
            <button mat-stroked-button (click)="loadData()">
              <mat-icon>refresh</mat-icon> Refresh
            </button>
          </div>

          @if (loading()) {
            <div class="loading">Loading LOTO usage data...</div>
          } @else if (rows().length === 0) {
            <div class="empty">No active LOTOs at this time.</div>
          } @else {
            <table class="usage-table">
              <thead>
                <tr>
                  <th class="col-box">Box #</th>
                  <th class="col-loto">LOTO (Scope)</th>
                  <th class="col-status">Status</th>
                  <th class="col-points">Pts</th>
                  <th class="col-jobs">Associated Jobs</th>
                  <th class="col-foremen">Foremen</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.id) {
                  <tr [class.orphan]="row.hasNoJobs" (click)="navigateToLoto(row.id)">
                    <td class="col-box">
                      <span class="box-badge" [style.background-color]="getStatusColor(row.status)">
                        {{ row.boxNumber ?? '-' }}
                      </span>
                    </td>
                    <td class="col-loto">
                      <div class="loto-name">{{ row.name || row.permitNumber || 'LOTO #' + row.id }}</div>
                      <div class="loto-scope">{{ row.workScope || row.equipmentSystem || '' }}</div>
                    </td>
                    <td class="col-status">
                      <span class="status-chip" [class]="'status-' + (row.status?.toLowerCase() || 'building')">
                        {{ row.status }}
                      </span>
                    </td>
                    <td class="col-points center">{{ row.pointCount }}</td>
                    <td class="col-jobs">
                      @if (row.associatedJobs.length === 0) {
                        <span class="no-jobs">No jobs</span>
                      } @else {
                        @for (job of row.associatedJobs; track job.jobId) {
                          <div class="job-row">
                            <span class="job-num">{{ job.permitNumber || '#' + job.jobId }}</span>
                            <span class="job-scope">{{ job.workScope || '' }}</span>
                          </div>
                        }
                      }
                    </td>
                    <td class="col-foremen">
                      @if (row.foremen.length === 0) {
                        <span class="no-foreman">-</span>
                      } @else {
                        @for (f of row.foremen; track f) {
                          <div class="foreman-name">{{ f }}</div>
                        }
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
  `,
  styles: [`
    .monitor-container { padding: 16px; }
    .monitor-toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .count { font-size: 1rem; font-weight: 600; color: #ddd; }
    .orphan-count { display: flex; align-items: center; gap: 4px; color: #ff9800; font-size: 0.85rem; }
    .warn-icon { font-size: 18px; width: 18px; height: 18px; }
    .loading, .empty { text-align: center; padding: 3rem; color: #888; font-style: italic; }

    .usage-table { width: 100%; border-collapse: collapse; background: var(--surface-color, #16213e); border-radius: 8px; overflow: hidden; }
    .usage-table th { background: var(--header-background, #0f3460); color: #aaa; padding: 10px 12px; text-align: left; font-size: 0.8rem; font-weight: 500; text-transform: uppercase; }
    .usage-table td { padding: 10px 12px; color: #ddd; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; vertical-align: top; }
    .usage-table tr { cursor: pointer; }
    .usage-table tr:hover td { background: rgba(255,255,255,0.03); }
    .usage-table tr.orphan td { background: rgba(255,152,0,0.05); }

    .col-box { width: 60px; text-align: center; }
    .col-status { width: 80px; }
    .col-points { width: 40px; }
    .col-foremen { width: 150px; }
    .center { text-align: center; }

    .box-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 700; color: white; min-width: 30px; text-align: center; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
    .status-chip { padding: 3px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .status-building { background: #2e7d32; color: white; }
    .status-active { background: #c62828; color: white; }
    .status-test { background: #f9a825; color: black; }

    .loto-name { font-weight: 600; color: #82b1ff; }
    .loto-scope { font-size: 0.75rem; color: #888; margin-top: 2px; }

    .job-row { margin-bottom: 4px; }
    .job-num { font-weight: 500; color: #a5d6a7; margin-right: 6px; }
    .job-scope { font-size: 0.75rem; color: #888; }
    .no-jobs { color: #ff9800; font-style: italic; }
    .no-foreman { color: #666; }
    .foreman-name { font-weight: 500; }
  `]
})
export class LotoUsageMonitorComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);

  rows = signal<LotoUsageRow[]>([]);
  loading = signal(true);
  orphanCount = computed(() => this.rows().filter(r => r.hasNoJobs).length);
  private refreshInterval: any;

  ngOnInit(): void {
    this.loadData();
    this.refreshInterval = setInterval(() => this.loadData(), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadData(): void {
    this.http.get<any>('/ng/lotos/usage-monitor').subscribe({
      next: (res) => {
        this.rows.set(res.responseData ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  navigateToLoto(id: number): void {
    this.router.navigate(['/loto/loto'], { queryParams: { id } });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active': return '#c62828';
      case 'Building': return '#2e7d32';
      case 'Test': return '#f9a825';
      default: return '#424242';
    }
  }
}
