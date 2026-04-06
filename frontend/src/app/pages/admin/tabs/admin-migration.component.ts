import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface MigrationStatus {
  h2FileExists: boolean;
  h2FilePath: string;
  h2FileSizeMb: number;
  currentDatabase: string;
  runningOnPostgres: boolean;
  targetRecordCount: number;
}

interface TableComparison {
  table: string;
  h2Count: number;
  pgCount: number;
  match: boolean;
}

interface MigrationReport {
  tables: TableComparison[];
  error: string;
  totalDeviations: number;
  totalH2Records: number;
  totalPgRecords: number;
}

interface MigrationResult {
  success: boolean;
  error: string;
  totalRecords: number;
  tableCounts: { [table: string]: number };
  elapsedMs: number;
}

interface ApiResponse<T> {
  responseData: T;
  message: string;
}

@Component({
  selector: 'app-admin-migration',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container">
      <div class="admin-section">
        <h3>H2 to PostgreSQL Migration</h3>
        <p class="description">
          Migrate data from the local H2 database file into PostgreSQL.
          The app must be running with the <code>postgres</code> profile and the H2 file must exist on disk.
        </p>

        <div class="button-group">
          <button class="action-btn" (click)="checkStatus()" [disabled]="loading">
            {{ loading ? 'Checking...' : 'Check Status' }}
          </button>
        </div>

        <div class="error" *ngIf="error">{{ error }}</div>

        <div class="status-card" *ngIf="status">
          <div class="status-row">
            <span class="label">Current Database:</span>
            <span class="badge" [class.success]="status.runningOnPostgres" [class.warning]="!status.runningOnPostgres">
              {{ status.currentDatabase }}
            </span>
          </div>
          <div class="status-row">
            <span class="label">H2 File:</span>
            <span class="badge" [class.success]="status.h2FileExists" [class.warning]="!status.h2FileExists">
              {{ status.h2FileExists ? status.h2FilePath + ' (' + status.h2FileSizeMb.toFixed(1) + ' MB)' : 'Not found' }}
            </span>
          </div>
          <div class="status-row">
            <span class="label">PostgreSQL Records:</span>
            <span class="badge" [class.info]="status.targetRecordCount === 0" [class.warning]="status.targetRecordCount > 0">
              {{ status.targetRecordCount }}
            </span>
          </div>

          <div class="ready-status" *ngIf="status.runningOnPostgres && status.h2FileExists">
            <span class="badge success">Ready to migrate</span>
            <span class="badge info" *ngIf="status.targetRecordCount > 0">
              Existing PG data ({{ status.targetRecordCount }} records) will be cleared first
            </span>
          </div>
          <div class="ready-status" *ngIf="!status.runningOnPostgres">
            <span class="badge warning">Not running on PostgreSQL - add 'postgres' to active profiles</span>
          </div>
          <div class="ready-status" *ngIf="!status.h2FileExists">
            <span class="badge warning">H2 database file not found</span>
          </div>
        </div>
      </div>

      <div class="admin-section" *ngIf="status?.runningOnPostgres && status?.h2FileExists">
        <h3>Run Migration</h3>
        <p class="description">
          Reads all data from the H2 file and inserts it into PostgreSQL.
          The H2 file is opened read-only and is not modified.
        </p>

        <div class="button-group">
          <button class="action-btn migrate-btn"
                  (click)="runMigration()"
                  [disabled]="migrating">
            {{ migrating ? 'Migrating...' : 'Start Migration' }}
          </button>
        </div>

        <div class="progress-bar" *ngIf="migrating">
          <div class="progress-fill"></div>
        </div>
      </div>

      <div class="admin-section">
        <h3>Verification Report</h3>
        <p class="description">
          Compare record counts between H2 source and PostgreSQL target. Flags tables where counts don't match.
        </p>

        <div class="button-group">
          <button class="action-btn" (click)="compareData()" [disabled]="comparing">
            {{ comparing ? 'Comparing...' : 'Compare H2 vs PostgreSQL' }}
          </button>
        </div>

        <div class="error" *ngIf="compareError">{{ compareError }}</div>

        <div *ngIf="report">
          <div class="result-summary">
            <span class="badge" [class.success]="report.totalDeviations === 0" [class.warning]="report.totalDeviations > 0">
              {{ report.totalDeviations === 0 ? 'All tables match' : report.totalDeviations + ' deviation(s)' }}
            </span>
            <span class="badge info">H2: {{ report.totalH2Records }} records</span>
            <span class="badge info">PG: {{ report.totalPgRecords }} records</span>
          </div>

          <table class="result-table">
            <thead>
              <tr><th>Table</th><th>H2</th><th>PG</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of report.tables"
                  [class.mismatch-row]="!row.match">
                <td>{{ row.table }}</td>
                <td>{{ row.h2Count === -1 ? 'N/A' : row.h2Count }}</td>
                <td>{{ row.pgCount === -1 ? 'N/A' : row.pgCount }}</td>
                <td>
                  <span class="badge" [class.success]="row.match" [class.warning]="!row.match">
                    {{ row.match ? 'OK' : (row.pgCount - row.h2Count > 0 ? '+' : '') + (row.pgCount - row.h2Count) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="admin-section" *ngIf="result">
        <h3>Migration Result</h3>
        <div class="result-summary">
          <span class="badge" [class.success]="result.success" [class.warning]="!result.success">
            {{ result.success ? 'Success' : 'Failed' }}
          </span>
          <span class="badge info" *ngIf="result.success">
            {{ result.totalRecords }} records in {{ result.elapsedMs }}ms
          </span>
        </div>

        <div class="error" *ngIf="result.error">{{ result.error }}</div>

        <table class="result-table" *ngIf="result.tableCounts">
          <thead>
            <tr><th>Table</th><th>Records</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let entry of tableCountEntries">
              <td>{{ entry[0] }}</td>
              <td [class.error-cell]="entry[1] === -1">
                {{ entry[1] === -1 ? 'Error' : entry[1] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .admin-section {
      background: white; border: 1px solid #e0e0e0; border-radius: 8px;
      padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h3 { margin: 0 0 10px; color: #333; }
    .description { color: #666; margin-bottom: 15px; font-size: 14px; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
    .button-group { display: flex; gap: 10px; margin-bottom: 15px; }
    .action-btn {
      padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer;
      font-size: 14px; background: #007bff; color: white;
    }
    .action-btn:hover:not(:disabled) { background: #0056b3; }
    .action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .migrate-btn { background: #28a745; }
    .migrate-btn:hover:not(:disabled) { background: #218838; }
    .error { background: #fff3f3; border: 1px solid #e74c3c; padding: 10px; border-radius: 4px; color: #c0392b; margin: 10px 0; }

    .status-card { background: #f8f9fa; border-radius: 6px; padding: 15px; }
    .status-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .label { font-weight: 500; min-width: 160px; color: #555; }
    .ready-status { margin-top: 12px; padding-top: 12px; border-top: 1px solid #dee2e6; }

    .badge {
      display: inline-block; padding: 4px 10px; border-radius: 12px;
      font-size: 13px; font-weight: 500;
    }
    .badge.success { background: #d4edda; color: #155724; }
    .badge.warning { background: #fff3cd; color: #856404; }
    .badge.info { background: #d1ecf1; color: #0c5460; }

    .result-summary { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }

    .progress-bar {
      height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden; margin: 10px 0;
    }
    .progress-fill {
      height: 100%; background: #28a745; border-radius: 2px;
      animation: progress-indeterminate 1.5s infinite;
    }
    @keyframes progress-indeterminate {
      0% { width: 0; margin-left: 0; }
      50% { width: 60%; margin-left: 20%; }
      100% { width: 0; margin-left: 100%; }
    }

    .result-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .result-table th {
      text-align: left; padding: 8px; background: #f1f1f1;
      border-bottom: 2px solid #dee2e6; font-weight: 600;
    }
    .result-table td { padding: 6px 8px; border-bottom: 1px solid #eee; }
    .result-table tr:hover { background: #f8f9fa; }
    .error-cell { color: #e74c3c; font-weight: 500; }
    .mismatch-row { background: #fff8e1 !important; }
    .mismatch-row:hover { background: #fff3cd !important; }
  `]
})
export class AdminMigrationComponent {
  status: MigrationStatus | null = null;
  result: MigrationResult | null = null;
  report: MigrationReport | null = null;
  loading = false;
  migrating = false;
  comparing = false;
  error = '';
  compareError = '';
  tableCountEntries: [string, number][] = [];

  constructor(private http: HttpClient) {}

  checkStatus() {
    this.loading = true;
    this.error = '';
    this.http.get<ApiResponse<MigrationStatus>>('/ng/admin/migration/status').subscribe({
      next: (res) => {
        this.status = res.responseData;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to check migration status';
        this.loading = false;
      }
    });
  }

  compareData() {
    this.comparing = true;
    this.compareError = '';
    this.report = null;
    this.http.get<ApiResponse<MigrationReport>>('/ng/admin/migration/compare').subscribe({
      next: (res) => {
        this.report = res.responseData;
        this.comparing = false;
      },
      error: (err) => {
        this.compareError = err.error?.message || 'Failed to compare data';
        this.comparing = false;
      }
    });
  }

  runMigration() {
    this.migrating = true;
    this.error = '';
    this.result = null;
    this.http.post<ApiResponse<MigrationResult>>('/ng/admin/migration/run', {}).subscribe({
      next: (res) => {
        this.result = res.responseData;
        this.tableCountEntries = this.result?.tableCounts
          ? Object.entries(this.result.tableCounts)
          : [];
        this.migrating = false;
        // Refresh status after migration
        this.checkStatus();
      },
      error: (err) => {
        this.error = err.error?.message || 'Migration failed';
        this.migrating = false;
      }
    });
  }
}
