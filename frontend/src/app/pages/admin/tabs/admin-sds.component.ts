import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface SeedReport {
  matchedSlots: number;
  created: number;
  updated: number;
  unmatchedCount: number;
  unmatchedBookEntries: string[];
}

interface ApiResponse<T> {
  responseData: T;
  message: string;
}

@Component({
  selector: 'app-admin-sds',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container">
      <div class="admin-section">
        <h3>Seed SDS Inventory from eBinder + Book Index</h3>
        <p class="description">
          Loads the curated match map (the physical SDS book index matched to the VelocityEHS eBinder
          export by Document ID) into the database and SharePoint. Metadata + Book/Section only —
          <strong>no PDFs</strong>. Run this once; it is idempotent (re-running upserts by source id).
          After seeding, open <code>Electron → SDS Import</code> to run the gap report and scrape the PDFs.
        </p>

        <div class="button-group">
          <button class="action-btn seed-btn" (click)="runSeed()" [disabled]="seeding">
            {{ seeding ? 'Seeding…' : 'Seed SDS Inventory' }}
          </button>
        </div>

        <div class="progress-bar" *ngIf="seeding"><div class="progress-fill"></div></div>
        <div class="error" *ngIf="error">{{ error }}</div>

        <div *ngIf="report">
          <div class="result-summary">
            <span class="badge success">{{ report.created }} created</span>
            <span class="badge info">{{ report.updated }} updated</span>
            <span class="badge info">{{ report.matchedSlots }} matched book slots</span>
            <span class="badge warning" *ngIf="report.unmatchedCount > 0">
              {{ report.unmatchedCount }} unmatched book entries
            </span>
          </div>

          <div class="unmatched" *ngIf="report.unmatchedBookEntries.length">
            <h4>Book entries with no row in the eBinder export</h4>
            <p class="hint">
              These are in the physical book but not in this eBinder export (paints, solvents, legacy
              items). They were <strong>not</strong> loaded — match them manually, or they'll appear once
              the eBinder is rescraped.
            </p>
            <ul>
              <li *ngFor="let e of report.unmatchedBookEntries">{{ e }}</li>
            </ul>
          </div>
        </div>
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
    h4 { margin: 16px 0 6px; color: #444; }
    .description { color: #666; margin-bottom: 15px; font-size: 14px; line-height: 1.5; }
    .hint { color: #856404; font-size: 13px; margin: 0 0 8px; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
    .button-group { display: flex; gap: 10px; margin-bottom: 15px; }
    .action-btn {
      padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer;
      font-size: 14px; background: #007bff; color: white;
    }
    .seed-btn { background: #8D6E63; }
    .seed-btn:hover:not(:disabled) { background: #6d544b; }
    .action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { background: #fff3f3; border: 1px solid #e74c3c; padding: 10px; border-radius: 4px; color: #c0392b; margin: 10px 0; }
    .result-summary { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 13px; font-weight: 500; }
    .badge.success { background: #d4edda; color: #155724; }
    .badge.warning { background: #fff3cd; color: #856404; }
    .badge.info { background: #d1ecf1; color: #0c5460; }
    .unmatched ul { columns: 2; margin: 0; padding-left: 18px; font-size: 13px; color: #555; }
    .unmatched li { break-inside: avoid; margin-bottom: 2px; }
    .progress-bar { height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden; margin: 10px 0; }
    .progress-fill { height: 100%; background: #8D6E63; border-radius: 2px; animation: progress-indeterminate 1.5s infinite; }
    @keyframes progress-indeterminate {
      0% { width: 0; margin-left: 0; }
      50% { width: 60%; margin-left: 20%; }
      100% { width: 0; margin-left: 100%; }
    }
  `]
})
export class AdminSdsComponent {
  report: SeedReport | null = null;
  seeding = false;
  error = '';

  constructor(private http: HttpClient) {}

  runSeed(): void {
    this.seeding = true;
    this.error = '';
    this.report = null;
    this.http.post<ApiResponse<SeedReport>>('/ng/sds-chemicals/seed', {}).subscribe({
      next: (res) => {
        this.report = res.responseData;
        this.seeding = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Seed failed';
        this.seeding = false;
      }
    });
  }
}
