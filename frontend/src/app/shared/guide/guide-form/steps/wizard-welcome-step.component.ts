import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WizardStep } from '../wizard-stack.types';

@Component({
  selector: 'app-wizard-welcome-step',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="welcome-container">
      <div class="welcome-icon">
        <mat-icon>{{ step().hints?.[0]?.icon || 'auto_awesome' }}</mat-icon>
      </div>
      <div class="welcome-content">
        <p class="welcome-message">
          Click "Get Started" to begin the guided process. Each step will focus on one thing at a time.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .welcome-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 20px;
    }

    .welcome-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--accent-color-shadow, rgba(0, 123, 255, 0.15));
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .welcome-icon mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--accent-color, #1976d2);
    }

    .welcome-content {
      max-width: 400px;
    }

    .welcome-message {
      color: var(--secondary-text, #666);
      line-height: 1.6;
      margin: 0;
    }
  `],
})
export class WizardWelcomeStepComponent {
  step = input.required<WizardStep>();
}
