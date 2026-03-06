import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ProcessWrDialogService } from './process-wr-dialog.service';
import { CurrentJobLogService } from '../../services/current-items-services/current-job-log.service';
import { JobLogDto } from '../../models/permits/job-log.model';
import { RfPopupProjectionComponent } from '../popup-projection/rf-popup-projection.component';

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
                <p>Select an existing job to attach a new package to</p>
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
  `]
})
export class ProcessWrDialogComponent {
  dialogService = inject(ProcessWrDialogService);
  private currentJobLogService = inject(CurrentJobLogService);
  private router = inject(Router);

  step = signal<'choose' | 'selectJob'>('choose');
  loading = signal(false);
  errorMessage = signal('');

  private openSub = this.dialogService.onOpen$.subscribe(() => {
    this.step.set('choose');
    this.loading.set(false);
    this.errorMessage.set('');
  });

  allJobs = toSignal(this.currentJobLogService.allJobLogs$, { initialValue: [] as JobLogDto[] });
  openJobs = computed(() =>
    this.allJobs().filter(j => {
      const status = j.jobStatus?.name ?? 'Open';
      return status !== 'Closed';
    })
  );

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
            next: () => {
              this.loading.set(false);
              this.dialogService.close();
              this.dialogService.notifyComplete();
              this.step.set('choose');
              this.router.navigate(['/permit-builder/jobs']);
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

  processForExistingJob(job: JobLogDto): void {
    const wrId = this.dialogService.workRequestId();
    if (!wrId) return;
    this.loading.set(true);
    this.errorMessage.set('');

    this.currentJobLogService.processWorkRequest(job.id.toString(), wrId.toString()).subscribe({
      next: () => {
        this.loading.set(false);
        this.dialogService.close();
        this.dialogService.notifyComplete();
        this.step.set('choose');
        this.router.navigate(['/permit-builder/jobs']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to process work request');
      }
    });
  }
}
