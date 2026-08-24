import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProcessWrDialogService } from './process-wr-dialog.service';
import { CurrentJobLogService } from '../../services/current-items-services/current-job-log.service';
import { JobLogService } from '../../services/permits/job-log.service';
import { JobLogDto } from '../../models/permits/job-log.model';
import { WorkRequestDto } from '../../models/permits/work-request.model';
import { RfWorkRequestApiService } from '../../features/permit-builder/work-request/refactored/services/rf-work-request-api.service';
import { RfPopupProjectionComponent } from '../popup-projection/rf-popup-projection.component';
import { PopupWindowService } from '../popup-window/popup-window.service';

/**
 * Turns a work request into a daily permit package, on a job.
 *
 * The dialog's whole job is to answer one question unambiguously: does this request join a job
 * that already exists, or start a new one? That used to be genuinely unclear. Requests submitted
 * through the hub arrived already processed onto a job nobody had chosen, and pressing "Create New
 * Job" on one of those persisted a fresh job, silently bound the request back to its old one, and
 * opened the old job's package — so the operator was shown a different job from the one they asked
 * for, with no indication anything had gone sideways.
 *
 * Now the backend only ever *suggests* a job, and this dialog states the outcome of each choice
 * before it is made: which job, how many requests are already on it, and what its dates are.
 */
@Component({
  selector: 'app-process-wr-dialog',
  standalone: true,
  imports: [RfPopupProjectionComponent],
  template: `
    @if(dialogService.isVisible()) {
    <app-rf-popup-projection
      [isOpen]="true"
      [title]="'Process Work Request'"
      size="small"
      [zIndex]="20000"
      (close)="dialogService.close()">

      @if(errorMessage()) {
        <div class="error-banner" (click)="errorMessage.set('')">
          {{ errorMessage() }} <span class="dismiss">(click to dismiss)</span>
        </div>
      }

      @if(loading()) {
        <div class="loading">Processing...</div>
      } @else if (alreadyProcessed()) {
        <!-- Nothing to choose: this request is already on a job. Say which one, and offer to open
             it, rather than presenting choices that cannot be honoured. -->
        <div class="already-processed">
          <div class="ap-title">Already processed</div>
          <p class="ap-body">
            This work request is already part of a package
            @if(existingJob()) { on job <strong>{{ jobLabel(existingJob()!) }}</strong> }.
            To move it somewhere else, remove it from that package first.
          </p>
          @if(existingJob()) {
            <button class="primary-btn" (click)="openExistingJob()">Open that job</button>
          }
        </div>
      } @else {
        @if(step() === 'choose') {

          @if(suggestedJob(); as suggestion) {
            <!-- The grouping-key match, surfaced as the pre-selected answer rather than acted on
                 behind the operator's back. -->
            <div class="suggestion-section">
              <div class="suggestion-header">Suggested — same company, area and work category</div>
              <div class="job-item suggested" (click)="processForExistingJob(suggestion)">
                <div class="job-main">
                  <span class="job-name">{{ jobLabel(suggestion) }}</span>
                  <span class="suggested-chip">Suggested</span>
                </div>
                <div class="job-detail">{{ jobSummary(suggestion) }}</div>
                <div class="job-outcome">This request joins that job as a new package.</div>
              </div>
            </div>
          }

          @if(otherMatches().length > 0) {
            <div class="matching-section">
              <div class="matching-header">Other open jobs that look related</div>
              <div class="job-list">
                @for(match of otherMatches(); track match.jobId) {
                  <div class="job-item matching" (click)="processForExistingJobById(match.jobId)">
                    <div class="job-main">
                      <span class="job-name">{{ match.permitNumber || 'Job #' + match.jobId }}</span>
                      <span class="match-score">{{ match.score }}% match</span>
                    </div>
                    <div class="job-detail">{{ match.company || '' }} {{ match.location ? '@ ' + match.location : '' }}</div>
                    @if(match.workScope) {
                      <div class="job-detail scope">{{ match.workScope.length > 80 ? match.workScope.substring(0, 80) + '...' : match.workScope }}</div>
                    }
                    <div class="match-reasons">
                      @for(reason of match.matchReasons; track reason) {
                        <span class="reason-chip">{{ reason }}</span>
                      }
                      <span class="reason-chip count">{{ match.packageCount }} package(s)</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <div class="options">
            <div class="option-card" (click)="createNewJob()">
              <span class="option-icon">+</span>
              <div>
                <strong>Start a new job</strong>
                <p>A new job is created for this request, with its own permit number and a first package.</p>
              </div>
            </div>
            <div class="option-card" (click)="step.set('selectJob')">
              <span class="option-icon">&#8594;</span>
              <div>
                <strong>Add to a different job</strong>
                <p>Browse every open job and attach this request to one of them as a new package.</p>
              </div>
            </div>
          </div>
        }

        @if(step() === 'selectJob') {
          <div class="job-list-header">
            <button class="back-btn" (click)="step.set('choose')">&larr; Back</button>
            <span>Select a job:</span>
          </div>
          @if(openJobs().length > 0) {
            <div class="job-list">
              @for(job of openJobs(); track job.id) {
                <div class="job-item" (click)="processForExistingJob(job)">
                  <div class="job-main">
                    <span class="job-name">{{ jobLabel(job) }}</span>
                    <span class="job-status" [attr.data-status]="job.jobStatus?.name || 'Open'">
                      {{ job.jobStatus?.name || 'Open' }}
                    </span>
                  </div>
                  <div class="job-detail">{{ jobSummary(job) }}</div>
                </div>
              }
            </div>
          } @else {
            <p class="empty-msg">No open or active jobs available.</p>
          }
        }
      }
    </app-rf-popup-projection>
    }
  `,
  styles: [`
    .error-banner { padding: 8px 12px; background: #f44336; color: white; border-radius: 4px; cursor: pointer; font-size: 13px; margin-bottom: 12px; }
    .error-banner .dismiss { opacity: 0.7; font-size: 11px; }
    .loading { text-align: center; padding: 24px; color: #888; font-style: italic; }

    .already-processed { padding: 8px 4px; }
    .ap-title { font-size: 14px; font-weight: 600; color: #ffb74d; margin-bottom: 6px; }
    .ap-body { font-size: 13px; color: #bbb; line-height: 1.5; margin: 0 0 12px; }
    .primary-btn { padding: 8px 14px; background: #2196F3; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
    .primary-btn:hover { background: #1e88e5; }

    .options { display: flex; flex-direction: column; gap: 8px; }
    .option-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: #2a2a2a; border: 1px solid #444; border-radius: 6px; cursor: pointer; }
    .option-card:hover { background: #333; border-color: #4CAF50; }
    .option-card strong { font-size: 13px; color: #ddd; display: block; }
    .option-card p { margin: 2px 0 0; font-size: 11px; color: #888; }
    .option-icon { font-size: 18px; width: 28px; text-align: center; color: #64b5f6; flex-shrink: 0; }

    .job-list-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; color: #ccc; }
    .back-btn { padding: 4px 8px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .back-btn:hover { background: #666; }

    .job-list { max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .job-item { padding: 8px 12px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; cursor: pointer; }
    .job-item:hover { background: #333; border-color: #64b5f6; }
    .job-main { display: flex; align-items: center; gap: 8px; }
    .job-name { font-size: 13px; font-weight: 500; color: #ddd; }
    .job-detail { font-size: 11px; color: #777; margin-top: 2px; }
    .job-outcome { font-size: 11px; color: #81c784; margin-top: 4px; }
    .job-status { padding: 2px 6px; border-radius: 8px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .job-status[data-status="Open"] { background: rgba(33, 150, 243, 0.15); color: #64b5f6; border: 1px solid rgba(33, 150, 243, 0.3); }
    .job-status[data-status="Active"] { background: rgba(76, 175, 80, 0.15); color: #81c784; border: 1px solid rgba(76, 175, 80, 0.3); }
    .empty-msg { color: #888; font-style: italic; font-size: 13px; text-align: center; }

    .suggestion-section { margin-bottom: 12px; }
    .suggestion-header { font-size: 13px; font-weight: 600; color: #81c784; margin-bottom: 8px; }
    .job-item.suggested { border-color: rgba(76, 175, 80, 0.45); background: rgba(76, 175, 80, 0.07); }
    .job-item.suggested:hover { border-color: #4CAF50; }
    .suggested-chip { padding: 2px 6px; border-radius: 8px; font-size: 10px; font-weight: 600; background: rgba(76, 175, 80, 0.18); color: #81c784; border: 1px solid rgba(76, 175, 80, 0.35); }

    .matching-section { margin-bottom: 12px; }
    .matching-header { font-size: 13px; font-weight: 600; color: #ffb74d; margin-bottom: 8px; }
    .job-item.matching { border-color: rgba(255, 152, 0, 0.3); }
    .job-item.matching:hover { border-color: #FF9800; }
    .match-score { padding: 2px 6px; border-radius: 8px; font-size: 10px; font-weight: 600; background: rgba(255, 152, 0, 0.15); color: #ffb74d; border: 1px solid rgba(255, 152, 0, 0.3); }
    .match-reasons { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
    .reason-chip { padding: 1px 6px; border-radius: 6px; font-size: 10px; background: rgba(100, 181, 246, 0.1); color: #64b5f6; border: 1px solid rgba(100, 181, 246, 0.2); }
    .reason-chip.count { background: rgba(255,255,255,0.06); color: #999; border-color: rgba(255,255,255,0.12); }
    .job-detail.scope { color: #999; font-style: italic; }
  `]
})
export class ProcessWrDialogComponent {
  dialogService = inject(ProcessWrDialogService);
  private currentJobLogService = inject(CurrentJobLogService);
  private jobLogService = inject(JobLogService);
  private wrApiService = inject(RfWorkRequestApiService);
  private popupWindowService = inject(PopupWindowService);

  step = signal<'choose' | 'selectJob'>('choose');
  loading = signal(false);
  errorMessage = signal('');
  matchingJobs = signal<any[]>([]);
  workRequest = signal<WorkRequestDto | null>(null);
  existingJob = signal<JobLogDto | null>(null);

  private openSub = this.dialogService.onOpen$.subscribe(() => {
    this.step.set('choose');
    this.loading.set(false);
    this.errorMessage.set('');
    this.matchingJobs.set([]);
    this.workRequest.set(null);
    this.existingJob.set(null);
    this.loadWorkRequest();
    this.loadMatchingJobs();
  });

  allJobs = toSignal(this.currentJobLogService.allJobLogs$, { initialValue: [] as JobLogDto[] });
  openJobs = computed(() =>
    this.allJobs().filter(j => {
      const status = j.jobStatus?.name ?? 'Open';
      return status !== 'Closed';
    })
  );

  /** Already on a package — every "which job?" choice below is moot. */
  alreadyProcessed = computed(() => !!this.workRequest()?.dailyPermitPackageId);

  /** The job the backend's grouping-key match suggests, resolved against the loaded job list. */
  suggestedJob = computed(() => {
    const id = this.workRequest()?.suggestedJobLogId;
    if (!id) return null;
    return this.openJobs().find(j => j.id === id) ?? null;
  });

  /**
   * Scored matches minus the suggestion, so the same job is never offered twice under two
   * different headings — which read as two different jobs at a glance.
   */
  otherMatches = computed(() => {
    const suggestedId = this.suggestedJob()?.id;
    return this.matchingJobs().filter(m => m.jobId !== suggestedId);
  });

  jobLabel(job: JobLogDto): string {
    return job.permitNumber || job.name || `Job #${job.id}`;
  }

  jobSummary(job: JobLogDto): string {
    const parts: string[] = [];
    if (job.company) parts.push(job.company);
    if (job.workArea?.name) parts.push(job.workArea.name);
    const count = job.packages?.length ?? 0;
    parts.push(`${count} package(s)`);
    if (job.startDate) parts.push(job.endDate ? `${job.startDate} – ${job.endDate}` : `from ${job.startDate}`);
    return parts.join(' · ');
  }

  private loadWorkRequest(): void {
    const wrId = this.dialogService.workRequestId();
    if (!wrId) return;
    this.wrApiService.getWorkRequestById(wrId).subscribe({
      next: (response) => {
        if (!response?.responseData) return;
        const wr = WorkRequestDto.fromJson(response.responseData);
        this.workRequest.set(wr);
        if (wr.dailyPermitPackageId) {
          this.loadExistingJob(wr.dailyPermitPackageId);
        }
      },
      // The choose step still works without it; only the suggestion and the already-processed
      // notice depend on this call.
      error: () => {}
    });
  }

  private loadExistingJob(packageId: number): void {
    this.jobLogService.getByPackageId(packageId.toString()).subscribe({
      next: (response) => {
        if (response?.responseData) {
          this.existingJob.set(JobLogDto.fromJson(response.responseData));
        }
      },
      error: () => {}
    });
  }

  private loadMatchingJobs(): void {
    const wrId = this.dialogService.workRequestId();
    if (!wrId) return;
    this.jobLogService.findMatchingJobs(wrId.toString()).subscribe({
      next: (response) => {
        if (response?.responseData) {
          this.matchingJobs.set(response.responseData);
        }
      },
      error: () => {} // Silently fail — matching is a suggestion, not critical
    });
  }

  openExistingJob(): void {
    const job = this.existingJob();
    const pkgId = this.workRequest()?.dailyPermitPackageId;
    if (!job || !pkgId) return;
    this.dialogService.close();
    this.popupWindowService.openOrFocus(
      `${window.location.origin}/app/permit-builder/daily-packages?packageId=${pkgId}&mode=popup`
    );
  }

  createNewJob(): void {
    const wrId = this.dialogService.workRequestId();
    if (!wrId) return;
    this.loading.set(true);
    this.errorMessage.set('');

    this.currentJobLogService.createJobFromWorkRequest(wrId.toString()).subscribe({
      next: (response) => {
        if (!response?.responseData) {
          this.loading.set(false);
          this.errorMessage.set('Failed to create job');
          return;
        }
        const newJob = JobLogDto.fromJson(response.responseData);
        this.currentJobLogService.processWorkRequest(newJob.id.toString(), wrId.toString()).subscribe({
          next: (processResponse) => this.finish(processResponse?.responseData),
          error: (err) => this.fail(err, 'Failed to process work request')
        });
      },
      error: (err) => this.fail(err, 'Failed to create job')
    });
  }

  processForExistingJobById(jobId: number): void {
    this.processIntoJob(jobId);
  }

  processForExistingJob(job: JobLogDto): void {
    this.processIntoJob(job.id);
  }

  private processIntoJob(jobId: number): void {
    const wrId = this.dialogService.workRequestId();
    if (!wrId) return;
    this.loading.set(true);
    this.errorMessage.set('');

    this.currentJobLogService.processWorkRequest(jobId.toString(), wrId.toString()).subscribe({
      next: (response) => this.finish(response?.responseData),
      error: (err) => this.fail(err, 'Failed to process work request')
    });
  }

  private finish(jobLogData: any): void {
    this.loading.set(false);
    this.dialogService.close();
    this.dialogService.notifyComplete();
    this.step.set('choose');
    this.openPackagePopup(jobLogData);
  }

  /**
   * Surface the backend's own message. It now explains exactly what blocked the action — "already
   * in package X on job Y" — and that is far more use than a generic failure line.
   */
  private fail(err: any, fallback: string): void {
    this.loading.set(false);
    this.errorMessage.set(err?.error?.message || err?.message || fallback);
    this.loadWorkRequest();
  }

  private openPackagePopup(jobLogData: any): void {
    if (!jobLogData) return;
    const jobLog = JobLogDto.fromJson(jobLogData);
    const packages = jobLog.packages;
    if (packages.length === 0) return;
    const sorted = [...packages].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    const newPkg = sorted[0];
    this.popupWindowService.openOrFocus(
      `${window.location.origin}/app/permit-builder/daily-packages?packageId=${newPkg.id}&mode=popup`
    );
  }
}
