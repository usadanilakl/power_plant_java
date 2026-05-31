import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface SeedReport {
  matchedSlots: number;
  bookOnlyCount: number;
  created: number;
  updated: number;
}

interface SyncReport {
  chemicalsCreated: number;
  chemicalsUpdated: number;
  chemicalsDeleted: number;
  attachmentsAdded: number;
  attachmentsRemoved: number;
  errors: string[];
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
            <span class="badge info" *ngIf="report.bookOnlyCount > 0">
              {{ report.bookOnlyCount }} book-only (no eBinder match)
            </span>
          </div>
          <p class="hint" *ngIf="report.bookOnlyCount > 0" style="margin-top:8px;">
            Book-only entries have synthetic <code>BOOK-{{ '{' }}book{{ '}' }}-{{ '{' }}section{{ '}' }}</code>
            source ids; pair each one with a real eBinder Document ID in
            <code>Electron → SDS Import → Missing on eBinder, present in app</code>.
          </p>
        </div>
      </div>

      <div class="admin-section">
        <h3>Recovery helpers</h3>
        <p class="description">
          Use these when local and SharePoint drift apart (after a server migration, a manual SP edit,
          a botched scrape, etc.). They operate on every SDS chemical + every attachment.
        </p>

        <div class="button-group">
          <button class="action-btn push-btn" (click)="runPush()" [disabled]="busy"
                  title="For every local chemical: create-or-update its SharePoint row, then delete-and-re-add its attachments. Use when SharePoint is the stale side.">
            {{ busy === 'push' ? 'Pushing…' : 'Push all to SharePoint' }}
          </button>
          <button class="action-btn pull-btn" (click)="runPull()" [disabled]="busy"
                  title="For every chemical on SharePoint: upsert it locally by SP id, then replace local attachments with what SP holds. Goes through the sync layer — the hub propagates the result to every other client (just like seeding).">
            {{ busy === 'pull' ? 'Pulling…' : 'Pull all from SharePoint' }}
          </button>
          <button class="action-btn danger-btn" (click)="runClear()" [disabled]="busy"
                  title="Soft-delete every SDS chemical via the sync layer. The hub broadcasts the deletes to every other client AND removes the matching rows from SharePoint. Mirrors how seeding propagates, just in reverse.">
            {{ busy === 'clear' ? 'Clearing…' : 'Clear all (sync to clients + SP)' }}
          </button>
        </div>

        <div class="progress-bar" *ngIf="busy"><div class="progress-fill"></div></div>
        <div class="error" *ngIf="syncError">{{ syncError }}</div>

        <div *ngIf="syncResult">
          <div class="result-summary">
            <span class="badge success" *ngIf="syncResult.chemicalsCreated">{{ syncResult.chemicalsCreated }} created</span>
            <span class="badge info"    *ngIf="syncResult.chemicalsUpdated">{{ syncResult.chemicalsUpdated }} updated</span>
            <span class="badge warning" *ngIf="syncResult.chemicalsDeleted">{{ syncResult.chemicalsDeleted }} deleted</span>
            <span class="badge info"    *ngIf="syncResult.attachmentsAdded">+{{ syncResult.attachmentsAdded }} attachments</span>
            <span class="badge warning" *ngIf="syncResult.attachmentsRemoved">−{{ syncResult.attachmentsRemoved }} attachments</span>
            <span class="badge warning" *ngIf="syncResult.errors.length">{{ syncResult.errors.length }} errors</span>
          </div>
          <details class="unmatched" *ngIf="syncResult.errors.length">
            <summary>Errors ({{ syncResult.errors.length }})</summary>
            <ul><li *ngFor="let e of syncResult.errors">{{ e }}</li></ul>
          </details>
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
    .push-btn { background: #28a745; }
    .push-btn:hover:not(:disabled) { background: #218838; }
    .pull-btn { background: #17a2b8; }
    .pull-btn:hover:not(:disabled) { background: #138496; }
    .danger-btn { background: #dc3545; }
    .danger-btn:hover:not(:disabled) { background: #c82333; }
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

  syncResult: SyncReport | null = null;
  syncError = '';
  busy: '' | 'push' | 'pull' | 'clear' = '';

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

  runPush(): void {
    if (!confirm('Push every local SDS chemical and its attachments to SharePoint?\n\n' +
      'Existing SP rows are updated; missing ones are created. Each chemical\'s SP attachments ' +
      'are deleted and re-uploaded from the local copy. SharePoint becomes a mirror of local.')) return;
    this.runHelper('push', '/ng/sds-chemicals/push-all-to-sp');
  }

  runPull(): void {
    if (!confirm('Pull every SDS chemical and its attachments from SharePoint?\n\n' +
      'Local rows are upserted by SP id. Each chemical\'s local attachments are replaced with what ' +
      'SharePoint holds. The save fires sync events — the hub broadcasts the result to every other ' +
      'client, just like seeding does.')) return;
    this.runHelper('pull', '/ng/sds-chemicals/pull-all-from-sp');
  }

  runClear(): void {
    if (!confirm('Delete every SDS chemical EVERYWHERE?\n\n' +
      'Soft-deletes every chemical locally and fires sync events — the hub then propagates the ' +
      'deletes to every other client AND removes the matching rows from SharePoint. This is the ' +
      'mirror of seeding: one client triggers it, the hub fans it out.')) return;
    this.runHelper('clear', '/ng/sds-chemicals/clear-all');
  }

  private runHelper(which: 'push' | 'pull' | 'clear', url: string): void {
    this.busy = which;
    this.syncError = '';
    this.syncResult = null;
    this.http.post<ApiResponse<SyncReport>>(url, {}).subscribe({
      next: (res) => { this.syncResult = res.responseData; this.busy = ''; },
      error: (err) => { this.syncError = err.error?.message || (which + ' failed'); this.busy = ''; }
    });
  }
}
