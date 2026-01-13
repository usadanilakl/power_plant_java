import { Component, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { GuideFormStep, GuideFormState } from '../guide-form.types';
import { GuideHintsPanelComponent } from './guide-hints-panel.component';
import { RfLotoPointStateService } from '../../../../features/loto-points/refactored/services/rf-loto-point-state.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';

@Component({
  selector: 'app-guide-loto-form-step',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, GuideHintsPanelComponent],
  template: `
    <div class="loto-form-step">
      <h3 class="step-title">{{ step().title }}</h3>
      <p class="step-description">{{ step().description }}</p>

      <!-- Current File Context -->
      @if (state().selectedFileDto) {
        <div class="context-card">
          <mat-icon>description</mat-icon>
          <span>Creating LOTO point on: <strong>{{ state().selectedFileDto?.name }}</strong></span>
        </div>
      }

      <!-- Action -->
      <div class="action-section">
        <p class="action-description">
          Click the button below to open the LOTO Point form. The dual form allows you to create
          the primary point and its counterpart (for the other unit) at the same time.
        </p>
        <p class="action-description">
          The guide will minimize while you fill out the form. After saving, come back to complete the guide.
        </p>

        <button
          mat-flat-button
          color="primary"
          class="open-form-btn"
          (click)="openLotoForm()"
        >
          <mat-icon>add_location</mat-icon>
          Open LOTO Point Form
        </button>
      </div>

      @if (step().hints && step().hints!.length > 0) {
        <app-guide-hints-panel [hints]="step().hints!" [compact]="true" />
      }
    </div>
  `,
  styles: [
    `
      .loto-form-step {
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

      .context-card {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: var(--surface-alt, #f5f5f5);
        border-radius: 8px;
        font-size: 13px;
        color: var(--text-secondary, #666);
      }

      .context-card mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--primary-color, #1976d2);
      }

      .context-card strong {
        color: var(--text-primary, #333);
      }

      .action-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background: var(--info-bg, #e3f2fd);
        border-radius: 8px;
      }

      .action-description {
        margin: 0;
        font-size: 13px;
        color: var(--text-secondary, #666);
        line-height: 1.5;
      }

      .open-form-btn {
        align-self: flex-start;
        margin-top: 4px;
      }

      .open-form-btn mat-icon {
        margin-right: 8px;
      }
    `,
  ],
})
export class GuideLotoFormStepComponent {
  private lotoPointStateService = inject(RfLotoPointStateService);

  step = input.required<GuideFormStep>();
  state = input.required<GuideFormState>();

  onOpenForm = output<void>();

  openLotoForm(): void {
    // Open a new LOTO point form with file context
    const fileDto = this.state().selectedFileDto;

    // Create a new LOTO point with the selected file context
    const newLotoPoint = new LotoPointDto();
    if (fileDto) {
      // fileIds is stored as a comma-separated string
      newLotoPoint.fileIds = fileDto.id.toString();
    }

    // Set the new LOTO point as selected and open the form
    this.lotoPointStateService.setSelectedItem(newLotoPoint);
    this.lotoPointStateService.openForm();

    this.onOpenForm.emit();
  }
}
