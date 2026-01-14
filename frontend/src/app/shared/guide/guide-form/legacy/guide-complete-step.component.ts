import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { GuideFormStep, GuideAction, GUIDE_ACTIONS } from './guide-form.types';
import { GuideHintsPanelComponent } from './guide-hints-panel.component';

@Component({
  selector: 'app-guide-complete-step',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, GuideHintsPanelComponent],
  template: `
    <div class="complete-step">
      <div class="success-icon">
        <mat-icon>{{ step().icon || 'check_circle' }}</mat-icon>
      </div>

      <h2 class="complete-title">{{ step().title }}</h2>

      <p class="complete-description">{{ step().description }}</p>

      @if (step().hints && step().hints!.length > 0) {
        <app-guide-hints-panel [hints]="step().hints!" />
      }

      <div class="action-buttons">
        <button
          mat-flat-button
          color="primary"
          class="done-button"
          (click)="onDone.emit()"
        >
          {{ step().actionLabel || 'Done' }}
        </button>

        @if (showNextAction()) {
          <button
            mat-stroked-button
            color="primary"
            class="next-action-button"
            (click)="onNextAction.emit(nextAction())"
          >
            <mat-icon>{{ getNextActionIcon() }}</mat-icon>
            {{ getNextActionLabel() }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .complete-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 24px 16px;
      }

      .success-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--success-bg, #e8f5e9);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        animation: scaleIn 0.3s ease;
      }

      @keyframes scaleIn {
        from {
          transform: scale(0);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      .success-icon mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--success-color, #4caf50);
      }

      .complete-title {
        margin: 0 0 12px 0;
        font-size: 22px;
        font-weight: 600;
        color: var(--text-primary, #333);
      }

      .complete-description {
        margin: 0 0 20px 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-secondary, #666);
        max-width: 320px;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        max-width: 280px;
        margin-top: 8px;
      }

      .done-button {
        padding: 10px 24px;
        font-size: 14px;
      }

      .next-action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 24px;
        font-size: 14px;
      }

      .next-action-button mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class GuideCompleteStepComponent {
  step = input.required<GuideFormStep>();
  currentAction = input.required<GuideAction>();

  onDone = output<void>();
  onNextAction = output<GuideAction>();

  showNextAction(): boolean {
    // After uploading a file, suggest adding a LOTO point
    return this.currentAction() === 'upload-file';
  }

  nextAction(): GuideAction {
    if (this.currentAction() === 'upload-file') {
      return 'add-loto-point';
    }
    return this.currentAction();
  }

  getNextActionIcon(): string {
    const action = GUIDE_ACTIONS.find((a) => a.action === this.nextAction());
    return action?.icon || 'arrow_forward';
  }

  getNextActionLabel(): string {
    const action = GUIDE_ACTIONS.find((a) => a.action === this.nextAction());
    return action?.title || 'Continue';
  }
}
