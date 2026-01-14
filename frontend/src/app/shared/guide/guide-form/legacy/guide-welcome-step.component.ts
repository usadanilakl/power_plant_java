import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { GuideFormStep } from './guide-form.types';
import { GuideHintsPanelComponent } from './guide-hints-panel.component';

@Component({
  selector: 'app-guide-welcome-step',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, GuideHintsPanelComponent],
  template: `
    <div class="welcome-step">
      <div class="welcome-icon">
        <mat-icon>{{ step().icon || 'info' }}</mat-icon>
      </div>

      <h2 class="welcome-title">{{ step().title }}</h2>

      <p class="welcome-description">{{ step().description }}</p>

      @if (step().hints && step().hints!.length > 0) {
        <app-guide-hints-panel [hints]="step().hints!" />
      }

      <button
        mat-flat-button
        color="primary"
        class="start-button"
        (click)="onStart.emit()"
      >
        {{ step().actionLabel || 'Get Started' }}
        <mat-icon>arrow_forward</mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .welcome-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 24px 16px;
      }

      .welcome-icon {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: var(--primary-light, #e3f2fd);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
      }

      .welcome-icon mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: var(--primary-color, #1976d2);
      }

      .welcome-title {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary, #333);
      }

      .welcome-description {
        margin: 0 0 20px 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-secondary, #666);
        max-width: 320px;
      }

      .start-button {
        margin-top: 8px;
        padding: 8px 24px;
        font-size: 14px;
      }

      .start-button mat-icon {
        margin-left: 8px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class GuideWelcomeStepComponent {
  step = input.required<GuideFormStep>();
  onStart = output<void>();
}
