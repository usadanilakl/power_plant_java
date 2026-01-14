import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { GuideFormStep, GuideFormState } from './guide-form.types';
import { GuideHintsPanelComponent } from './guide-hints-panel.component';

@Component({
  selector: 'app-guide-loto-review-step',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, GuideHintsPanelComponent],
  template: `
    <div class="review-step">
      <h3 class="step-title">{{ step().title }}</h3>
      <p class="step-description">{{ step().description }}</p>

      <!-- LOTO Point Summary -->
      @if (state().lotoPointData) {
        <div class="summary-card">
          <div class="summary-header">
            <mat-icon>summarize</mat-icon>
            <span>LOTO Point Summary</span>
          </div>

          <div class="summary-fields">
            <!-- Tag Number -->
            @if (state().lotoPointData?.tagNumber) {
              <div class="summary-field">
                <span class="field-label">Tag Number</span>
                <span class="field-value tag-number">{{ state().lotoPointData?.tagNumber }}</span>
              </div>
            } @else {
              <div class="summary-field missing">
                <span class="field-label">Tag Number</span>
                <span class="field-value">Not set</span>
              </div>
            }

            <!-- Description -->
            @if (state().lotoPointData?.description) {
              <div class="summary-field">
                <span class="field-label">Description</span>
                <span class="field-value">{{ state().lotoPointData?.description }}</span>
              </div>
            } @else {
              <div class="summary-field missing">
                <span class="field-label">Description</span>
                <span class="field-value">Not set</span>
              </div>
            }

            <!-- Positions -->
            @if (state().lotoPointData?.normPos && state().lotoPointData?.isoPos) {
              <div class="summary-field">
                <span class="field-label">Positions</span>
                <span class="field-value">
                  Normal: {{ state().lotoPointData?.normPos?.name }} /
                  Isolated: {{ state().lotoPointData?.isoPos?.name }}
                </span>
              </div>
            } @else {
              <div class="summary-field missing">
                <span class="field-label">Positions</span>
                <span class="field-value">Not set</span>
              </div>
            }

            <!-- Zero Energy -->
            @if (state().lotoPointData?.zeroEnergy) {
              <div class="summary-field">
                <span class="field-label">Zero Energy</span>
                <span class="field-value">Configured</span>
              </div>
            } @else {
              <div class="summary-field optional">
                <span class="field-label">Zero Energy</span>
                <span class="field-value">Not configured (optional)</span>
              </div>
            }

            <!-- Counterpart -->
            @if (state().lotoPointData?.counterpartId) {
              <div class="summary-field">
                <span class="field-label">Counterpart</span>
                <span class="field-value">Linked to #{{ state().lotoPointData?.counterpartId }}</span>
              </div>
            } @else {
              <div class="summary-field optional">
                <span class="field-label">Counterpart</span>
                <span class="field-value">None (optional)</span>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <mat-icon>warning</mat-icon>
          <p>No LOTO point data collected. Please go back and complete the required fields.</p>
        </div>
      }

      <!-- Validation Messages -->
      @if (!isValid()) {
        <div class="validation-warning">
          <mat-icon>error_outline</mat-icon>
          <span>Please complete the required fields (Tag Number, Description, Positions) before saving.</span>
        </div>
      }

      @if (step().hints && step().hints!.length > 0) {
        <app-guide-hints-panel [hints]="step().hints!" [compact]="true" />
      }
    </div>
  `,
  styles: [
    `
      .review-step {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .step-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary, #333);
      }

      .step-description {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary, #666);
      }

      .summary-card {
        background: var(--surface-alt, #f5f5f5);
        border-radius: 8px;
        overflow: hidden;
      }

      .summary-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: var(--primary-color, #1976d2);
        color: white;
        font-size: 14px;
        font-weight: 500;
      }

      .summary-header mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .summary-fields {
        padding: 8px 0;
      }

      .summary-field {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 10px 16px;
        border-bottom: 1px solid var(--border-light, #e8e8e8);
      }

      .summary-field:last-child {
        border-bottom: none;
      }

      .field-label {
        font-size: 12px;
        color: var(--text-tertiary, #999);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex-shrink: 0;
      }

      .field-value {
        font-size: 14px;
        color: var(--text-primary, #333);
        text-align: right;
        word-break: break-word;
        max-width: 60%;
      }

      .field-value.tag-number {
        font-family: monospace;
        font-weight: 600;
        color: var(--primary-color, #1976d2);
      }

      .summary-field.missing .field-value {
        color: var(--error-color, #f44336);
        font-style: italic;
      }

      .summary-field.optional .field-value {
        color: var(--text-tertiary, #999);
        font-style: italic;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 32px 16px;
        text-align: center;
        color: var(--text-secondary, #666);
      }

      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--warning-color, #ff9800);
      }

      .validation-warning {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: var(--warning-bg, #fff3e0);
        border-radius: 8px;
        border-left: 4px solid var(--warning-color, #ff9800);
        font-size: 13px;
        color: var(--text-secondary, #666);
      }

      .validation-warning mat-icon {
        color: var(--warning-color, #ff9800);
        flex-shrink: 0;
      }
    `,
  ],
})
export class GuideLotoReviewStepComponent {
  step = input.required<GuideFormStep>();
  state = input.required<GuideFormState>();

  onSave = output<void>();

  isValid(): boolean {
    const data = this.state().lotoPointData;
    if (!data) return false;

    return !!(data.tagNumber && data.description && data.normPos && data.isoPos);
  }
}
