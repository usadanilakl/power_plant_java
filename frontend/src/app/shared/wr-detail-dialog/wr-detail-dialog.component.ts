import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../popup-projection/rf-popup-projection.component';
import { WrDetailDialogService } from './wr-detail-dialog.service';
import { RfWorkRequestApiService } from '../../features/permit-builder/work-request/refactored/services/rf-work-request-api.service';
import { CorrespondenceDialogService } from '../correspondence-dialog/correspondence-dialog.service';
import { AttachmentDialogService } from '../attachment-dialog/attachment-dialog.service';
import { WorkRequestDto } from '../../models/permits/work-request.model';

@Component({
  selector: 'app-wr-detail-dialog',
  standalone: true,
  imports: [CommonModule, RfPopupProjectionComponent],
  template: `
    @if (dialogService.isVisible()) {
      <app-rf-popup-projection
        [isOpen]="true"
        [title]="'Work Request Details'"
        [size]="'medium'"
        [zIndex]="20000"
        (close)="close()">

        <div class="wr-detail-content">
          @if (isLoading()) {
            <div class="loading-state">
              <span class="material-icons spinning">refresh</span>
              Loading work request details...
            </div>
          } @else if (workRequest()) {
            <!-- Status header -->
            <div class="detail-status-row">
              <span class="status-chip" [ngClass]="'status-' + (workRequest()!.status || '').toLowerCase()">
                {{ workRequest()!.status || 'Unknown' }}
              </span>
              @if (workRequest()!.hasJha) {
                <span class="jha-badge">JHA</span>
              }
              @if ((workRequest()!.attachmentCount ?? 0) > 0) {
                <span class="attachment-badge">{{ workRequest()!.attachmentCount }} attachment(s)</span>
              }
            </div>

            <!-- Detail grid -->
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">{{ workRequest()!.getDate() || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">{{ workRequest()!.timeOfWorkToBePerformed || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Requested By</span>
                <span class="detail-value">{{ workRequest()!.requestedBy || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Company</span>
                <span class="detail-value">{{ workRequest()!.company || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location</span>
                <span class="detail-value">{{ workRequest()!.location || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Affected Equipment</span>
                <span class="detail-value">{{ workRequest()!.affectedEquipment || '---' }}</span>
              </div>
              <div class="detail-row full-width">
                <span class="detail-label">Work Scope</span>
                <span class="detail-value">{{ workRequest()!.workScope || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Foreman</span>
                <span class="detail-value">{{ workRequest()!.foreman || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Fire Watch</span>
                <span class="detail-value">{{ workRequest()!.fireWatch || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">LOTO Required</span>
                <span class="detail-value" [class.flag-yes]="workRequest()!.isLotoRequired">
                  {{ workRequest()!.isLotoRequired ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Hot Work Required</span>
                <span class="detail-value" [class.flag-yes]="workRequest()!.isHotWorkRequired">
                  {{ workRequest()!.isHotWorkRequired ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Confined Space Required</span>
                <span class="detail-value" [class.flag-yes]="workRequest()!.isConfinedSpaceEntryRequired">
                  {{ workRequest()!.isConfinedSpaceEntryRequired ? 'Yes' : 'No' }}
                </span>
              </div>
              @if (workRequest()!.isConfinedSpaceEntryRequired) {
                <div class="detail-row">
                  <span class="detail-label">Space</span>
                  <span class="detail-value">{{ workRequest()!.space || '---' }}</span>
                </div>
              }
              <div class="detail-row">
                <span class="detail-label">SharePoint ID</span>
                <span class="detail-value">{{ workRequest()!.sharepointId || '---' }}</span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="action-bar">
              <button class="action-btn btn-processed"
                      (click)="markAsProcessed()"
                      [disabled]="actionInProgress()">
                <span class="material-icons">check_circle</span> Mark as Processed
              </button>
              <button class="action-btn btn-cancel"
                      (click)="cancelPermit()"
                      [disabled]="actionInProgress()">
                <span class="material-icons">cancel</span> Cancel Permit
              </button>
              <button class="action-btn btn-details"
                      (click)="requestMoreDetails()"
                      [disabled]="actionInProgress()">
                <span class="material-icons">email</span> Request Details
              </button>
              <button class="action-btn btn-correspondence"
                      (click)="viewCorrespondence()">
                <span class="material-icons">mail_outline</span> Correspondence
              </button>
              @if ((workRequest()!.attachmentCount ?? 0) > 0) {
                <button class="action-btn btn-attachments"
                        (click)="viewAttachments()">
                  <span class="material-icons">attach_file</span> Attachments
                </button>
              }
              <button class="action-btn btn-close" (click)="close()">Close</button>
            </div>
          } @else {
            <div class="empty-state">Work request not found.</div>
          }
        </div>

      </app-rf-popup-projection>
    }
  `,
  styles: [`
    .wr-detail-content {
      padding: 16px;
      min-width: 480px;
      max-width: 620px;
      background: var(--primary-background, #fff);
      color: var(--primary-text, #212529);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .detail-status-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .status-chip {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 4px;
    }
    .status-new { background-color: #fef3c7; color: #92400e; }
    .status-active { background-color: var(--status-complete, #d4edda); color: #166534; }
    .status-processed { background-color: #dbeafe; color: #1e40af; }
    .status-cancelled { background-color: var(--status-not-processed, #e0e0e0); color: #546e7a; }
    .status-revoked { background-color: #fce4ec; color: #b71c1c; }

    .jha-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--status-complete, #d4edda);
      color: #166534;
      font-weight: 600;
    }

    .attachment-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--secondary-background, #f0f2f5);
      border: 1px solid var(--border-color, #dee2e6);
      color: var(--secondary-text, #6c757d);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color, #dee2e6);
    }

    .detail-row.full-width { grid-column: 1 / -1; }

    .detail-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-text, #6c757d);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 2px;
    }

    .detail-value {
      font-size: 14px;
      color: var(--primary-text, #212529);
    }

    .flag-yes {
      color: #b71c1c;
      font-weight: 600;
    }

    .action-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--border-color, #dee2e6);
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 7px 14px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      background: var(--card-background, #fff);
      color: var(--primary-text, #212529);
      transition: all 150ms ease;
    }

    .action-btn:hover { background: var(--hover-color, #f0f2f5); }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .action-btn .material-icons { font-size: 16px; }

    .btn-processed { border-color: #4caf50; color: #2e7d32; }
    .btn-processed:hover { background: #e8f5e9; }
    .btn-cancel { border-color: #ef5350; color: #c62828; }
    .btn-cancel:hover { background: #ffebee; }
    .btn-close { margin-left: auto; }

    .loading-state, .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--secondary-text, #6c757d);
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class WrDetailDialogComponent {
  dialogService = inject(WrDetailDialogService);
  private wrApiService = inject(RfWorkRequestApiService);
  private correspondenceDialogService = inject(CorrespondenceDialogService);
  private attachmentDialogService = inject(AttachmentDialogService);

  workRequest = signal<WorkRequestDto | null>(null);
  isLoading = signal(false);
  actionInProgress = signal(false);

  private openSub = this.dialogService.onOpen$.subscribe(() => this.loadWorkRequest());

  loadWorkRequest(): void {
    const id = this.dialogService.workRequestId();
    if (!id) return;

    this.isLoading.set(true);
    this.wrApiService.getWorkRequestById(id).subscribe({
      next: (response) => {
        this.workRequest.set(
          response.responseData ? WorkRequestDto.fromJson(response.responseData) : null
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.workRequest.set(null);
        this.isLoading.set(false);
      }
    });
  }

  refreshIfOpen(wrId: number): void {
    if (this.dialogService.isVisible() && this.dialogService.workRequestId() === wrId) {
      this.loadWorkRequest();
    }
  }

  markAsProcessed(): void {
    const wr = this.workRequest();
    if (!wr?.id) return;
    this.actionInProgress.set(true);
    this.wrApiService.changeStatus(wr.id, 'Processed').subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.close();
      },
      error: () => this.actionInProgress.set(false)
    });
  }

  cancelPermit(): void {
    const wr = this.workRequest();
    if (!wr?.id) return;
    const confirmed = confirm(
      `Are you sure you want to cancel this work request?\n\n` +
      `Work Scope: ${wr.workScope}\nLocation: ${wr.location}`
    );
    if (!confirmed) return;
    this.actionInProgress.set(true);
    this.wrApiService.cancelWorkRequest(wr.id).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.close();
      },
      error: () => this.actionInProgress.set(false)
    });
  }

  requestMoreDetails(): void {
    const wr = this.workRequest();
    if (!wr?.id) return;
    const message = prompt('Optional: Add details about what information is needed');
    if (message === null) return;
    this.actionInProgress.set(true);
    this.wrApiService.requestMoreDetails(wr.id, message || undefined).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.loadWorkRequest();
      },
      error: () => this.actionInProgress.set(false)
    });
  }

  viewCorrespondence(): void {
    const wr = this.workRequest();
    if (!wr?.id) return;
    this.correspondenceDialogService.open('WorkRequest', wr.id);
  }

  viewAttachments(): void {
    const wr = this.workRequest();
    if (!wr?.id || !wr.attachmentCount) return;
    this.attachmentDialogService.open('WorkRequest', wr.id);
  }

  close(): void {
    this.dialogService.close();
  }
}
