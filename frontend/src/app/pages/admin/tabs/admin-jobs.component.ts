import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpirySweepResult, JobLogService, StaleSweepResult, StrandedPermitReport } from '../../../services/permits/job-log.service';

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

      <!-- Automatic expiry ----------------------------------------------------- -->
      <div class="admin-section">
        <h3>Expired packages</h3>
        <p class="description">
          A permit authorises <strong>12 hours</strong>; past <strong>{{ expiryHours() }}</strong>
          the paperwork has lapsed, and the package is marked <strong>Expired</strong> &mdash; not
          Closed. Closing would assert the work finished and the crew came off the job; a timer
          knows neither. Personnel stay signed on, <code>workCompleted</code> is untouched, LOTOs are
          never touched, and an expired package can be re-activated in one click.
          <br />
          This runs hourly on the hub. The buttons below just run it now.
        </p>

        <div class="button-group">
          <button class="action-btn secondary" [disabled]="expiryBusy()" (click)="previewExpiry()">
            {{ expiryBusy() ? 'Working...' : 'Preview' }}
          </button>
          <button class="action-btn danger"
                  [disabled]="expiryBusy() || !expiryResult()?.dueCount"
                  (click)="applyExpiry()">
            Expire {{ expiryResult()?.dueCount || 0 }} package(s) now
          </button>
        </div>

        <div class="error" *ngIf="expiryError()">{{ expiryError() }}</div>
        <div class="success-msg" *ngIf="expiryMessage()">{{ expiryMessage() }}</div>

        <ng-container *ngIf="expiryResult() as ex">
          <p class="description" *ngIf="ex.skippedUndated">
            <strong>{{ ex.skippedUndated }}</strong> package(s) skipped &mdash; their work window
            could not be read. "We can't read the date" is not evidence the window closed, so the
            automatic sweep leaves them and the stale sweep below picks them up with a human
            looking.
          </p>
          <p class="error" *ngIf="ex.expiredWithPersonnelOn">
            <strong>{{ ex.expiredWithPersonnelOn }}</strong> of these still have personnel signed
            on. Their sign-on record is deliberately preserved &mdash; check whether anyone is
            still in the field.
          </p>
          <p class="error" *ngIf="ex.cappedAt">
            Capped at {{ ex.cappedAt }} this run; the rest follow on the next pass.
          </p>

          <table class="forms-table" *ngIf="ex.due.length">
            <thead>
              <tr>
                <th>Package #</th><th>Company</th><th>Status</th>
                <th>Window start</th><th>Hours open</th><th>Personnel on</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of ex.due">
                <td>{{ row.permitNumber || ('#' + row.packageId) }}</td>
                <td>{{ row.companyName }}</td>
                <td>{{ row.status }}</td>
                <td>{{ row.windowStart }}</td>
                <td>{{ row.hoursOpen }}</td>
                <td>{{ row.personnelStillSignedOn ? 'yes' : '' }}</td>
              </tr>
            </tbody>
          </table>

          <p class="no-data" *ngIf="!ex.due.length">Nothing is past its validity window.</p>
          <ul class="failures" *ngIf="ex.failures?.length">
            <li *ngFor="let f of ex.failures">{{ f }}</li>
          </ul>
        </ng-container>
      </div>

      <!-- Permits whose owner is gone ---------------------------------------- -->
      <div class="admin-section">
        <h3>Permits that outlived their package</h3>
        <p class="description">
          Closing a package already closes its permits. These never went through that: the package
          is <strong>Closed</strong> (something wrote it outside the cascade), the permit is
          <strong>soft-deleted</strong> but still open, or it has <strong>no package at all</strong>
          so nothing will ever close it. All three show on the permits map as live work.
        </p>

        <div class="button-group">
          <button class="action-btn secondary" [disabled]="permitBusy()" (click)="scanPermits()">
            {{ permitBusy() ? 'Working...' : 'Scan permits' }}
          </button>
          <button class="action-btn danger"
                  [disabled]="permitBusy() || !permitReport()?.rows?.length"
                  (click)="applyPermits()">
            Close {{ permitReport()?.rows?.length || 0 }} permit(s)
          </button>
        </div>

        <div class="error" *ngIf="permitError()">{{ permitError() }}</div>
        <div class="success-msg" *ngIf="permitMessage()">{{ permitMessage() }}</div>

        <ng-container *ngIf="permitReport() as pr">
          <div class="chip-row" *ngIf="pr.rows.length">
            <span class="pkg-chip" *ngFor="let r of reasonEntries(pr)">
              {{ reasonLabel(r[0]) }} <em>{{ r[1] }}</em>
            </span>
            <span class="pkg-chip" *ngFor="let l of layerEntries(pr)">
              {{ l[0] }} <em>{{ l[1] }}</em>
            </span>
          </div>

          <table class="forms-table" *ngIf="pr.rows.length">
            <thead>
              <tr>
                <th>Type</th><th>Permit #</th><th>Status</th><th>Date</th>
                <th>Location</th><th>Package</th><th>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of pr.rows">
                <td>{{ row.layer }}</td>
                <td>{{ row.permitNumber || ('#' + row.id) }}</td>
                <td>{{ row.status }}</td>
                <td>{{ row.date }}</td>
                <td>{{ row.location }}</td>
                <td>
                  <ng-container *ngIf="row.packageId; else noPkg">
                    {{ row.packageNumber || ('#' + row.packageId) }}
                    <em class="muted">{{ row.packageStatus }}</em>
                  </ng-container>
                  <ng-template #noPkg><em class="muted">none</em></ng-template>
                </td>
                <td>{{ reasonLabel(row.reason) }}</td>
              </tr>
            </tbody>
          </table>

          <p class="no-data" *ngIf="!pr.rows.length">
            Every open permit still has an open package. Nothing to clean up.
          </p>
        </ng-container>
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
    .chip-row { display: flex; flex-wrap: wrap; gap: 4px; margin: 8px 0; }
    .muted { color: var(--secondary-text); font-style: normal; margin-left: 4px; }
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

  // ---- Automatic expiry ----------------------------------------------------

  expiryBusy = signal(false);
  expiryError = signal('');
  expiryMessage = signal('');
  expiryResult = signal<ExpirySweepResult | null>(null);

  expiryHours(): string {
    const h = this.expiryResult()?.expiryHours;
    return h ? `${h} hours` : '16 hours';
  }

  previewExpiry(): void {
    this.runExpiry(true);
  }

  applyExpiry(): void {
    const count = this.expiryResult()?.dueCount ?? 0;
    if (!count) return;
    if (!confirm(`Expire ${count} package(s) now? They can be re-activated individually.`)) return;
    this.runExpiry(false);
  }

  private runExpiry(dryRun: boolean): void {
    this.expiryBusy.set(true);
    this.expiryError.set('');
    this.expiryMessage.set('');
    const call = dryRun
      ? this.jobLogService.expiryPreview()
      : this.jobLogService.expirePackages(false);
    call.subscribe({
      next: res => {
        this.expiryResult.set(res.responseData ?? null);
        this.expiryMessage.set(res.message ?? '');
        this.expiryBusy.set(false);
      },
      error: err => {
        this.expiryError.set(err?.error?.message || err?.message || 'Request failed');
        this.expiryBusy.set(false);
      },
    });
  }

  // ---- Stranded permits ----------------------------------------------------

  permitBusy = signal(false);
  permitError = signal('');
  permitMessage = signal('');
  permitReport = signal<StrandedPermitReport | null>(null);

  /** Explains the reason code in the operator's terms, not the enum's. */
  reasonLabel(reason: string): string {
    switch (reason) {
      case 'STRANDED': return 'package closed';
      case 'ORPHANED': return 'no package';
      case 'DELETED': return 'deleted but open';
      default: return reason;
    }
  }

  reasonEntries(report: StrandedPermitReport): [string, number][] {
    return Object.entries(report.countsByReason ?? {});
  }

  layerEntries(report: StrandedPermitReport): [string, number][] {
    return Object.entries(report.countsByLayer ?? {});
  }

  scanPermits(): void {
    this.runPermits(true);
  }

  applyPermits(): void {
    const count = this.permitReport()?.rows?.length ?? 0;
    if (!count) return;
    if (!confirm(`Close ${count} permit(s)? This cannot be undone from here.`)) return;
    this.runPermits(false);
  }

  private runPermits(dryRun: boolean): void {
    this.permitBusy.set(true);
    this.permitError.set('');
    this.permitMessage.set('');
    const call = dryRun
      ? this.jobLogService.strandedPermitScan()
      : this.jobLogService.closeStrandedPermits(false);
    call.subscribe({
      next: res => {
        this.permitReport.set(res.responseData ?? null);
        this.permitMessage.set(res.message ?? '');
        this.permitBusy.set(false);
      },
      error: err => {
        this.permitError.set(err?.error?.message || err?.message || 'Request failed');
        this.permitBusy.set(false);
      },
    });
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
