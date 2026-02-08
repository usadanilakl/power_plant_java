import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-close-impairment-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-overlay" (click)="cancel()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <h2>Close Fire Impairment</h2>
        <p class="subtitle">{{ impairment?.areaProtected || impairment?.protectionType || 'Impairment' }}</p>

        <div class="steps">
          <div class="step">
            <span class="step-number">1</span>
            <div class="step-body">
              <p>Copy the FM Global email address:</p>
              <div class="copy-box">
                <code>CustomerServiceDesk&#64;fmglobal.com</code>
                <button class="btn btn-secondary btn-xs" (click)="copyEmail()">
                  {{ copiedEmail ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>
          </div>

          <div class="step">
            <span class="step-number">2</span>
            <div class="step-body">
              <p>Open Outlook and search for this email address</p>
            </div>
          </div>

          <div class="step">
            <span class="step-number">3</span>
            <div class="step-body">
              <p>Find the related email and click <strong>Reply All</strong></p>
            </div>
          </div>

          <div class="step">
            <span class="step-number">4</span>
            <div class="step-body">
              <p>Type the following message and send:</p>
              <div class="copy-box">
                <code>"Isolation is restored and Fire Impairment can be cleared"</code>
                <button class="btn btn-secondary btn-xs" (click)="copyMessage()">
                  {{ copiedMsg ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancel</button>
          <button class="btn btn-danger" (click)="confirm()">Confirm Closed</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
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
      width: 520px;
      max-height: 80vh;
      overflow-y: auto;
    }

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 4px;
    }

    .subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0 0 20px;
    }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .step {
      display: flex;
      gap: 12px;
    }

    .step-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--accent-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .step-body {
      flex: 1;
    }

    .step-body p {
      font-size: 13px;
      color: var(--text-primary);
      margin: 4px 0 0;
    }

    .copy-box {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding: 8px 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }

    .copy-box code {
      flex: 1;
      font-size: 12px;
      color: var(--accent-primary);
      word-break: break-all;
    }

    .btn-xs {
      padding: 4px 10px;
      font-size: 11px;
      flex-shrink: 0;
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
export class CloseImpairmentDialogComponent {
  @Input() impairment: any;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  copiedEmail = false;
  copiedMsg = false;

  async copyEmail(): Promise<void> {
    await navigator.clipboard.writeText('CustomerServiceDesk@fmglobal.com');
    this.copiedEmail = true;
    setTimeout(() => this.copiedEmail = false, 2000);
  }

  async copyMessage(): Promise<void> {
    await navigator.clipboard.writeText('Isolation is restored and Fire Impairment can be cleared');
    this.copiedMsg = true;
    setTimeout(() => this.copiedMsg = false, 2000);
  }

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
