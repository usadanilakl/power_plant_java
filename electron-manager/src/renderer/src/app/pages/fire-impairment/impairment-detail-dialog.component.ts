import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-impairment-detail-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-overlay" (click)="close()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h2>Impairment Details</h2>
          <button class="btn-close" (click)="close()">&times;</button>
        </div>

        <div class="detail-status">
          <span class="status-badge"
                [class.badge-active]="impairment?.isActive"
                [class.badge-closed]="!impairment?.isActive && !impairment?.canceledDate"
                [class.badge-canceled]="impairment?.canceledDate">
            {{ impairment?.isActive ? 'Active' : (impairment?.canceledDate ? 'Canceled' : 'Closed') }}
          </span>
          <span class="detail-id">#{{ impairment?.id }}</span>
        </div>

        <!-- Location & Protection -->
        <div class="detail-section">
          <h3>Location & Protection</h3>
          <div class="field-row">
            <div class="field">
              <label>Area Protected</label>
              <span>{{ impairment?.areaProtected || '--' }}</span>
            </div>
            <div class="field">
              <label>Protection Type</label>
              <span>{{ impairment?.protectionType || '--' }}</span>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Location</label>
              <span>{{ impairment?.location || '--' }}</span>
            </div>
            <div class="field">
              <label>Valve Number</label>
              <span>{{ impairment?.valveNumber || '--' }}</span>
            </div>
          </div>
          <div class="field full-width">
            <label>Reason</label>
            <span>{{ impairment?.reason || '--' }}</span>
          </div>
        </div>

        <!-- Dates -->
        <div class="detail-section">
          <h3>Dates</h3>
          <div class="field-row">
            <div class="field">
              <label>Submitted</label>
              <span>{{ impairment?.submissionDate || '--' }}</span>
            </div>
            <div class="field">
              <label>Est. Restoration</label>
              <span>{{ impairment?.predictedRestorationDate || '--' }}</span>
            </div>
          </div>
          <div class="field-row" *ngIf="impairment?.closedDate || impairment?.canceledDate">
            <div class="field" *ngIf="impairment?.closedDate">
              <label>Closed Date</label>
              <span>{{ impairment.closedDate }}</span>
            </div>
            <div class="field" *ngIf="impairment?.canceledDate">
              <label>Canceled Date</label>
              <span>{{ impairment.canceledDate }}</span>
            </div>
          </div>
        </div>

        <!-- Contact -->
        <div class="detail-section">
          <h3>Contact</h3>
          <div class="field-row">
            <div class="field">
              <label>Client Name</label>
              <span>{{ impairment?.clientName || '--' }}</span>
            </div>
            <div class="field">
              <label>Phone</label>
              <span>{{ impairment?.phone || '--' }}</span>
            </div>
          </div>
          <div class="field full-width">
            <label>Email</label>
            <span>{{ impairment?.email || '--' }}</span>
          </div>
          <div class="field full-width">
            <label>CC</label>
            <span class="email-list">{{ impairment?.emailCc || '--' }}</span>
          </div>
        </div>

        <!-- Address -->
        <div class="detail-section">
          <h3>Address</h3>
          <div class="field-row">
            <div class="field">
              <label>Street</label>
              <span>{{ impairment?.streetAddress || '--' }}</span>
            </div>
            <div class="field">
              <label>City</label>
              <span>{{ impairment?.city || '--' }}</span>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>State</label>
              <span>{{ impairment?.state || '--' }}</span>
            </div>
            <div class="field">
              <label>Country</label>
              <span>{{ impairment?.country || '--' }}</span>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Index Number</label>
              <span>{{ impairment?.indexNumber || '--' }}</span>
            </div>
            <div class="field">
              <label>Office</label>
              <span>{{ impairment?.office || '--' }}</span>
            </div>
          </div>
        </div>

        <!-- Precautions -->
        <div class="detail-section" *ngIf="impairment?.precautions">
          <h3>Precautions</h3>
          <div class="field full-width">
            <span class="precautions-text">{{ impairment.precautions }}</span>
          </div>
        </div>

        <!-- FM Global URL -->
        <div class="detail-section" *ngIf="impairment?.url">
          <h3>FM Global Reference</h3>
          <div class="field full-width">
            <span class="url-text">{{ impairment.url }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="dialog-actions" *ngIf="impairment?.isActive">
          <button class="btn btn-secondary" (click)="close()">Close Dialog</button>
          <button class="btn btn-secondary" (click)="onOpenFmGlobal()">Open FM Global</button>
          <button class="btn btn-warning" (click)="onCancel()">Cancel Impairment</button>
          <button class="btn btn-danger" (click)="onClose()">Close Impairment</button>
        </div>
        <div class="dialog-actions" *ngIf="!impairment?.isActive">
          <button class="btn btn-secondary" (click)="close()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog-content {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      width: 620px;
      max-height: 85vh;
      overflow-y: auto;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .dialog-header h2 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .btn-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 22px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    .btn-close:hover { color: var(--text-primary); }

    .detail-status {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    .detail-id {
      font-size: 12px;
      color: var(--text-muted);
    }

    .status-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-active {
      background-color: rgba(245, 158, 11, 0.15);
      color: var(--accent-warning);
    }

    .badge-closed {
      background-color: rgba(107, 114, 128, 0.15);
      color: var(--text-muted);
    }

    .badge-canceled {
      background-color: rgba(239, 68, 68, 0.15);
      color: var(--accent-error);
    }

    .detail-section {
      margin-bottom: 20px;
    }

    .detail-section h3 {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--border-color);
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 8px;
    }

    .field label {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 2px;
    }

    .field span {
      font-size: 13px;
      color: var(--text-primary);
    }

    .field.full-width {
      margin-bottom: 8px;
    }

    .email-list {
      word-break: break-all;
      font-size: 12px !important;
      color: var(--text-secondary) !important;
    }

    .precautions-text {
      white-space: pre-wrap;
      font-size: 12px !important;
      color: var(--text-secondary) !important;
    }

    .url-text {
      word-break: break-all;
      font-size: 12px !important;
      color: var(--accent-primary) !important;
    }

    .btn-warning {
      background-color: rgba(245, 158, 11, 0.15);
      color: var(--accent-warning);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .btn-warning:hover {
      background-color: rgba(245, 158, 11, 0.25);
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }
  `]
})
export class ImpairmentDetailDialogComponent {
  @Input() impairment: any;
  @Output() closed = new EventEmitter<void>();
  @Output() openFmGlobal = new EventEmitter<any>();
  @Output() closeImpairment = new EventEmitter<any>();
  @Output() cancelImpairment = new EventEmitter<any>();

  close(): void {
    this.closed.emit();
  }

  onOpenFmGlobal(): void {
    this.openFmGlobal.emit(this.impairment);
    this.close();
  }

  onClose(): void {
    this.closeImpairment.emit(this.impairment);
    this.close();
  }

  onCancel(): void {
    this.cancelImpairment.emit(this.impairment);
    this.close();
  }
}
