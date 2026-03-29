import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProcessWrDialogService } from './process-wr-dialog.service';
import { CurrentJobLogService } from '../../services/current-items-services/current-job-log.service';
import { JobLogService } from '../../services/permits/job-log.service';
import { JobLogDto } from '../../models/permits/job-log.model';
import { RfPopupProjectionComponent } from '../popup-projection/rf-popup-projection.component';
import { PopupWindowService } from '../popup-window/popup-window.service';

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
      } @else {
        @if(step() === 'choose') {
          @if(matchingJobs().length > 0) {
            <div class="matching-section">
              <div class="matching-header">Matching Open Jobs Found</div>
              <div class="job-list">
                @for(match of matchingJobs(); track match.jobId) {
                  <div class="job-item matching" (click)="processForExistingJobById(match.jobId)">
                    <div class="job-main">
                      <span class="job-name">{{ match.permitNumber || 'Job #' + match.jobId }}</span>
                      <span class="match-score">{{ match.score }}%</span>
                    </div>
                    <div class="job-detail">{{ match.company || '' }} {{ match.location ? '@ ' + match.location : '' }}</div>
                    @if(match.workScope) {
                      <div class="job-detail scope">{{ match.workScope.length > 80 ? match.workScope.substring(0, 80) + '...' : match.workScope }}</div>
                    }
                    <div class="match-reasons">
                      @for(reason of match.matchReasons; track reason) {
                        <span class="reason-chip">{{ reason }}</span>
                      }
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
                <strong>Create New Job</strong>
                <p>Create a new job from this work request and generate a package</p>
              </div>
            </div>
            <div class="option-card" (click)="step.set('selectJob')">
              <span class="option-icon">&#8594;</span>
              <div>
                <strong>Add to Existing Job</strong>
                <p>Browse all open jobs to attach a new package to</p>
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
                    <span class="job-name">{{ job.permitNumber || job.name || 'Job #' + job.id }}</span>
                    <span class="job-status" [attr.data-status]="job.jobStatus?.name || 'Open'">
                      {{ job.jobStatus?.name || 'Open' }}
                    </span>
                  </div>
                  <div class="job-detail">{{ job.company || '' }} {{ job.foreman ? '- ' + job.foreman : '' }}</div>
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
    .job-status { padding: 2px 6px; border-radius: 8px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .job-status[data-status="Open"] { background: rgba(33, 150, 243, 0.15); color: #64b5f6; border: 1px solid rgba(33, 150, 243, 0.3); }
    .job-status[data-status="Active"] { background: rgba(76, 175, 80, 0.15); color: #81c784; border: 1px solid rgba(76, 175, 80, 0.3); }
    .empty-msg { color: #888; font-style: italic; font-size: 13px; text-align: center; }

    .matching-section { margin-bottom: 12px; }
    .matching-header { font-size: 13px; font-weight: 600; color: #ffb74d; margin-bottom: 8px; }
    .job-item.matching { border-color: rgba(255, 152, 0, 0.3); }
    .job-item.matching:hover { border-color: #FF9800; }
    .match-score { padding: 2px 6px; border-radius: 8px; font-size: 10px; font-weight: 600; background: rgba(255, 152, 0, 0.15); color: #ffb74d; border: 1px solid rgba(255, 152, 0, 0.3); }
    .match-reasons { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
    .reason-chip { padding: 1px 6px; border-radius: 6px; font-size: 10px; background: rgba(100, 181, 246, 0.1); color: #64b5f6; border: 1px solid rgba(100, 181, 246, 0.2); }
    .job-detail.scope { color: #999; font-style: italic; }
    .matching-loading { text-align: center; padding: 8px; color: #888; font-size: 12px; font-style: italic; }
  `]
})
export class ProcessWrDialogComponent {
  dialogService = inject(ProcessWrDialogService);
  private currentJobLogService = inject(CurrentJobLogService);
  private jobLogService = inject(JobLogService);
  private popupWindowService = inject(PopupWindowService);

  step = signal<'choose' | 'selectJob'>('choose');
  loading = signal(false);
  errorMessage = signal('');
  matchingJobs = signal<any[]>([]);

  private openSub = this.dialogService.onOpen$.subscribe(() => {
    this.step.set('choose');
    this.loading.set(false);
    this.errorMessage.set('');
    this.matchingJobs.set([]);
    this.loadMatchingJobs();
  });

  allJobs = toSignal(this.currentJobLogService.allJobLogs$, { initialValue: [] as JobLogDto[] });
  openJobs = computed(() =>
    this.allJobs().filter(j => {
      const status = j.jobStatus?.name ?? 'Open';
      return status !== 'Closed';
    })
  );

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

  createNewJob(): void {
    const wrId = this.dialogService.workRequestId();
    if (!wrId) return;
    this.loading.set(true);
    this.errorMessage.set('');

    this.currentJobLogService.createJobFromWorkRequest(wrId.toString()).subscribe({
      next: (response) => {
        if (response?.responseData) {
          const newJob = JobLogDto.fromJson(response.responseData);
          this.currentJobLogService.processWorkRequest(newJob.id.toString(), wrId.toString()).subscribe({
            next: (processResponse) => {
              this.loading.set(false);
              this.dialogService.close();
              this.dialogService.notifyComplete();
              this.step.set('choose');
              this.openPackagePopup(processResponse?.responseData);
            },
            error: (err) => {
              this.loading.set(false);
              this.errorMessage.set(err.error?.message || 'Failed to process work request');
            }
          });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to create job');
      }
    });
  }

  processForExistingJobById(jobId: number): void {
    const wrId = this.dialogService.workRequestId();
    if (!wrId) return;
    this.loading.set(true);
    this.errorMessage.set('');

    this.currentJobLogService.processWorkRequest(jobId.toString(), wrId.toString()).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.dialogService.close();
        this.dialogService.notifyComplete();
        this.step.set('choose');
        this.openPackagePopup(response?.responseData);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to process work request');
      }
    });
  }

  processForExistingJob(job: JobLogDto): void {
    const wrId = this.dialogService.workRequestId();
    if (!wrId) return;
    this.loading.set(true);
    this.errorMessage.set('');

    this.currentJobLogService.processWorkRequest(job.id.toString(), wrId.toString()).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.dialogService.close();
        this.dialogService.notifyComplete();
        this.step.set('choose');
        this.openPackagePopup(response?.responseData);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to process work request');
      }
    });
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
