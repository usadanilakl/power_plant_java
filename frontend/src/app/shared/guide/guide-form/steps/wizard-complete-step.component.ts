import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WizardStep } from '../wizard-stack.types';

@Component({
  selector: 'app-wizard-complete-step',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="complete-container">
      <div class="success-icon">
        <mat-icon>check_circle</mat-icon>
      </div>
      <p class="success-message">
        Click "Done" to close this wizard.
      </p>
    </div>
  `,
  styles: [`
    .complete-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
    }

    .success-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      animation: scaleIn 0.3s ease-out;
    }

    .success-icon mat-icon {
      font-size: 60px;
      width: 60px;
      height: 60px;
      color: #2e7d32;
    }

    .success-message {
      color: #666;
      font-size: 14px;
      margin: 0;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0.5);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `],
})
export class WizardCompleteStepComponent {
  step = input.required<WizardStep>();
}
