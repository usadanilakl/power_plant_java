import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobLogService, StaleSweepResult } from '../../../services/permits/job-log.service';

/**
 * Admin sweep for jobs and packages left open.
 *
 * <p>Dry run first, always. The two thresholds are separate because the lifetimes are: a package
 * authorises one twelve-hour shift, so it goes stale on elapsed time; a job can legitimately run
 * for weeks, so only inactivity marks it.
 */
@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <div class="admin-section">
        <h3>Stale Jobs &amp; Packages</h3>
        <p class="description">
          Work requests already expire on their own; jobs and packages never have, so they
          accumulate. Nothing here runs on a schedule &mdash; review the <strong>dry run</strong>,
          then apply.
        </p>

        <div class="form-row">
          <label for="inactiveDays">Job idle for at least (days):</label>
          <input id="inactiveDays" type="number" min="1" [(ngModel)]="inactiveDays" />
          <span class="hint">No edit to the job or any of its packages.</span>
        </div>

        <div class="form-row">
          <label for="packageHours">Package open for more than (hours):</label>
          <input id="packageHours" type="number" min="1" [(ngModel)]="packageHours" />
          <span class="hint">Measured from the start of its own work window. Permits authorise 12h.</span>
        </div>

        <div class="form-row">
          <label for="reason">Reason (recorded on every row):</label>
          <input id="reason" type="text" [(ngModel)]="reason"
                 placeholder="e.g. Monthly cleanup of abandoned permits" />
        </div>

        <div class="button-group">
          <button class="action-btn secondary" [disabled]="busy()" (click)="scan()">
            {{ busy() ? 'Working...' : 'Dry run' }}
          </button>
          <button class="action-btn danger"
                  [disabled]="busy() || !hasCandidates()"
                  (click)="apply()">
            Close {{ totalToClose() }} item(s)
          </button>
        </div>

        <div class="error" *ngIf="error()">{{ error() }}</div>
        <div class="success-msg" *ngIf="message()">{{ message() }}</div>
      </div>

      <ng-container *ngIf="result() as r">
        <div class="admin-section">
          <h3>Summary</h3>
          <table class="forms-table">
            <tbody>
              <tr><th>Open jobs scanned</th><td>{{ r.openJobs }}</td></tr>
              <tr><th>Stale jobs</th><td>{{ r.staleJobCount }}</td></tr>
              <tr><th>Packages closed with those jobs (cascade)</th><td>{{ r.cascadedPackageCount }}</td></tr>
              <tr><th>Stale packages on otherwise-active jobs</th><td>{{ r.stalePackageCount }}</td></tr>
            </tbody>
          </table>
          <p class="description" *ngIf="r.cascadedPackageCount">
            Closing a job closes its open packages first &mdash; <code>closeJob</code> refuses while
            any remain open. The cascade reaches packages that are not individually stale, so they
            are listed under their job below.
          </p>
        </div>

        <div class="admin-section" *ngIf="r.staleJobs.length">
          <h3>Stale jobs ({{ r.staleJobs.length }})</h3>
          <table class="forms-table">
            <thead>
              <tr>
                <th>Job #</th><th>Company</th><th>Foreman</th><th>Location</th>
                <th>Status</th><th>Idle (days)</th><th>Packages to close</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let job of r.staleJobs">
                <tr>
                  <td>{{ job.permitNumber || job.jobId }}</td>
                  <td>{{ job.company }}</td>
                  <td>{{ job.foreman }}</td>
                  <td>{{ job.location }}</td>
                  <td>{{ job.status }}</td>
                  <td>{{ job.idleDays }}</td>
                  <td>{{ job.packagesToClose.length }}</td>
                </tr>
                <tr *ngIf="job.packagesToClose.length" class="sub-row">
                  <td colspan="7">
                    <span *ngFor="let p of job.packagesToClose" class="pkg-chip">
                      {{ p.permitNumber || ('#' + p.packageId) }}
                      <em>{{ p.status }}</em>
                    </span>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <div class="admin-section" *ngIf="r.stalePackages.length">
          <h3>Stale packages ({{ r.stalePackages.length }})</h3>
          <table class="forms-table">
            <thead>
              <tr>
                <th>Package #</th><th>Company</th><th>Person</th>
                <th>Date</th><th>Time</th><th>Status</th><th>Hours open</th><th>Overdue by</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of r.stalePackages">
                <td>{{ p.permitNumber || p.packageId }}</td>
                <td>{{ p.companyName }}</td>
                <td>{{ p.personName }}</td>
                <td>{{ p.date }}</td>
                <td>{{ p.time }}</td>
                <td>{{ p.status }}</td>
                <td>{{ p.hoursOpen }}</td>
                <td>{{ p.overdueBy }}h</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="admin-section" *ngIf="r.failures && r.failures.length">
          <h3>Not closed ({{ r.failures?.length }})</h3>
          <ul class="failures">
            <li *ngFor="let f of r.failures">{{ f }}</li>
          </ul>
        </div>

        <p class="no-data" *ngIf="!r.staleJobCount && !r.stalePackageCount">
          Nothing is stale at these thresholds.
        </p>
      </ng-container>
    </div>
  `,
  styles: [`
    /* Uses the app's theme tokens (theme-styles.css) rather than fixed colours, so the tab follows
       the dark theme instead of staying a white card on a dark page. */
    .admin-container { padding: 16px; color: var(--primary-text); }
    .admin-section { background: var(--card-background); border: 1px solid var(--border-color);
                     border-radius: 4px; padding: 16px; margin-bottom: 16px;
                     box-shadow: var(--card-shadow); }
    h3 { margin: 0 0 8px; font-size: 16px; color: var(--primary-text); }
    .description { color: var(--secondary-text); font-size: 13px; margin: 0 0 12px; }
    .form-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .form-row label { min-width: 250px; font-size: 13px; color: var(--primary-text); }
    .form-row input { background: var(--primary-background); color: var(--primary-text);
                      border: 1px solid var(--border-color); border-radius: 3px; padding: 4px 6px; }
    .form-row input[type=number] { width: 90px; }
    .form-row input[type=text] { flex: 1; min-width: 240px; }
    .hint { color: var(--secondary-text); font-size: 12px; }
    .button-group { display: flex; gap: 8px; margin-top: 12px; }
    .action-btn { padding: 6px 14px; border: 1px solid var(--accent-color);
                  background: var(--accent-color); color: #fff; border-radius: 3px;
                  cursor: pointer; font-size: 13px; }
    .action-btn:hover:not(:disabled) { background: var(--accent-color-hover); }
    .action-btn.secondary { background: transparent; color: var(--accent-color); }
    .action-btn.danger { background: #c62828; border-color: #c62828; color: #fff; }
    .action-btn:disabled { opacity: .45; cursor: not-allowed; }
    .forms-table { width: 100%; border-collapse: collapse; font-size: 13px;
                   color: var(--primary-text); }
    .forms-table th, .forms-table td { border: 1px solid var(--border-color);
                                       padding: 6px 8px; text-align: left; }
    .forms-table thead th { background: var(--secondary-background); }
    .sub-row td { background: var(--secondary-background); }
    .pkg-chip { display: inline-block; background: var(--secondary-background);
                border: 1px solid var(--border-color); border-radius: 10px; padding: 1px 8px;
                margin: 2px 4px 2px 0; font-size: 12px; }
    .pkg-chip em { color: var(--secondary-text); font-style: normal; margin-left: 4px; }
    .error { color: #ef5350; margin-top: 8px; font-size: 13px; }
    .success-msg { color: #66bb6a; margin-top: 8px; font-size: 13px; }
    .no-data { color: var(--secondary-text); font-size: 13px; }
    .failures { color: #ef5350; font-size: 13px; margin: 0; padding-left: 18px; }
  `],
})
export class AdminJobsComponent {
  private jobLogService = inject(JobLogService);

  inactiveDays = 30;
  packageHours = 14;
  reason = '';

  busy = signal(false);
  error = signal('');
  message = signal('');
  result = signal<StaleSweepResult | null>(null);

  hasCandidates(): boolean {
    const r = this.result();
    return !!r && (r.staleJobCount > 0 || r.stalePackageCount > 0);
  }

  totalToClose(): number {
    const r = this.result();
    if (!r) return 0;
    return r.staleJobCount + r.stalePackageCount + r.cascadedPackageCount;
  }

  scan(): void {
    this.run(true);
  }

  apply(): void {
    const r = this.result();
    if (!r) return;
    const summary = `${r.staleJobCount} job(s), `
      + `${r.stalePackageCount + r.cascadedPackageCount} package(s)`;
    if (!confirm(`Close ${summary}? This cannot be undone from here.`)) return;
    this.run(false);
  }

  private run(dryRun: boolean): void {
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    this.jobLogService
      .closeStale(this.inactiveDays, this.packageHours, dryRun, this.reason)
      .subscribe({
        next: res => {
          this.result.set(res.responseData ?? null);
          this.message.set(res.message ?? '');
          this.busy.set(false);
        },
        error: err => {
          this.error.set(err?.error?.message || err?.message || 'Request failed');
          this.busy.set(false);
        },
      });
  }
}
