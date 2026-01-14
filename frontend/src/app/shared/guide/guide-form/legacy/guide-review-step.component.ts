import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { GuideFormStep, GuideFormState } from './guide-form.types';
import { GuideHintsPanelComponent } from './guide-hints-panel.component';

@Component({
  selector: 'app-guide-review-step',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, GuideHintsPanelComponent],
  template: `
    <div class="review-step">
      <h3 class="step-title">{{ step().title }}</h3>
      <p class="step-description">{{ step().description }}</p>

      <div class="review-card">
        <div class="review-header">
          <mat-icon>description</mat-icon>
          <span>File Details</span>
        </div>

        <div class="review-content">
          @if (state().selectedFile) {
            <div class="review-item">
              <span class="item-label">File to Upload</span>
              <span class="item-value file-value">
                <mat-icon>attach_file</mat-icon>
                {{ state().selectedFile?.name }}
              </span>
            </div>
          }

          @for (item of getReviewItems(); track item.label) {
            <div class="review-item">
              <span class="item-label">{{ item.label }}</span>
              <span class="item-value">{{ item.value }}</span>
            </div>
          }
        </div>
      </div>

      @if (step().hints && step().hints!.length > 0) {
        <app-guide-hints-panel [hints]="step().hints!" [compact]="true" />
      }

      @if (isSubmitting()) {
        <div class="submitting-indicator">
          <div class="spinner"></div>
          <span>Uploading file...</span>
        </div>
      }

      @if (error()) {
        <div class="error-message">
          <mat-icon>error</mat-icon>
          {{ error() }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      .review-step {
        padding: 16px;
      }

      .step-title {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary, #333);
      }

      .step-description {
        margin: 0 0 16px 0;
        font-size: 14px;
        color: var(--text-secondary, #666);
      }

      .review-card {
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 16px;
      }

      .review-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: var(--surface-alt, #f5f5f5);
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        font-weight: 500;
        font-size: 14px;
        color: var(--text-primary, #333);
      }

      .review-header mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--primary-color, #1976d2);
      }

      .review-content {
        padding: 12px 16px;
      }

      .review-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 8px 0;
        border-bottom: 1px solid var(--border-light, #f0f0f0);
      }

      .review-item:last-child {
        border-bottom: none;
      }

      .item-label {
        font-size: 13px;
        color: var(--text-secondary, #666);
        flex-shrink: 0;
        margin-right: 16px;
      }

      .item-value {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary, #333);
        text-align: right;
        word-break: break-word;
      }

      .file-value {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .file-value mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--text-tertiary, #999);
      }

      .submitting-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 16px;
        background: var(--primary-light, #e3f2fd);
        border-radius: 8px;
        margin-top: 16px;
      }

      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid var(--primary-light, #bbdefb);
        border-top-color: var(--primary-color, #1976d2);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .submitting-indicator span {
        font-size: 14px;
        color: var(--primary-color, #1976d2);
        font-weight: 500;
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding: 10px 12px;
        background: var(--error-bg, #ffebee);
        color: var(--error-color, #c62828);
        border-radius: 8px;
        font-size: 13px;
      }

      .error-message mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class GuideReviewStepComponent {
  step = input.required<GuideFormStep>();
  state = input.required<GuideFormState>();
  isSubmitting = input<boolean>(false);
  error = input<string | null>(null);

  getReviewItems(): { label: string; value: string }[] {
    const data = this.state().collectedData;
    const items: { label: string; value: string }[] = [];

    if (data['name']) {
      items.push({ label: 'Name', value: data['name'] });
    }

    if (data['fileType']) {
      const fileType = data['fileType'];
      items.push({
        label: 'File Type',
        value: typeof fileType === 'object' ? fileType.name : fileType,
      });
    }

    if (data['fileNumber']) {
      const fileNumbers = data['fileNumber'];
      items.push({
        label: 'File Numbers',
        value: Array.isArray(fileNumbers) ? fileNumbers.join(', ') : fileNumbers,
      });
    }

    if (data['vendor']) {
      const vendor = data['vendor'];
      items.push({
        label: 'Vendor',
        value: typeof vendor === 'object' ? vendor.name : vendor || 'Not specified',
      });
    }

    if (data['isVerified'] !== undefined) {
      items.push({
        label: 'Verified',
        value: data['isVerified'] === 'true' || data['isVerified'] === true ? 'Yes' : 'No',
      });
    }

    return items;
  }
}
