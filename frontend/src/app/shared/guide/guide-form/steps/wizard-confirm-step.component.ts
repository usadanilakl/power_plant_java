import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WizardStep } from '../wizard-stack.types';

@Component({
  selector: 'app-wizard-confirm-step',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-container">
      <div class="options">
        <!-- Yes Option -->
        <div class="option-card" (click)="onSelect(true)">
          <div class="option-header">
            <mat-icon class="yes-icon">check_circle</mat-icon>
            <span class="option-label">{{ step().confirmConfig?.yesLabel || 'Yes' }}</span>
          </div>
          @if (step().confirmConfig?.yesDescription) {
            <p class="option-description">{{ step().confirmConfig?.yesDescription }}</p>
          }
        </div>

        <!-- No Option -->
        <div class="option-card" (click)="onSelect(false)">
          <div class="option-header">
            <mat-icon class="no-icon">cancel</mat-icon>
            <span class="option-label">{{ step().confirmConfig?.noLabel || 'No' }}</span>
          </div>
          @if (step().confirmConfig?.noDescription) {
            <p class="option-description">{{ step().confirmConfig?.noDescription }}</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-container {
      padding: 20px 0;
    }

    .options {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .option-card {
      padding: 20px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .option-card:hover {
      border-color: #1976d2;
      background: #f5f9ff;
    }

    .option-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .yes-icon {
      color: #4caf50;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .no-icon {
      color: #9e9e9e;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .option-label {
      font-size: 18px;
      font-weight: 500;
    }

    .option-description {
      margin: 12px 0 0 40px;
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }
  `],
})
export class WizardConfirmStepComponent {
  step = input.required<WizardStep>();

  confirmed = output<{ field: string; value: boolean; nextStep?: string }>();

  onSelect(value: boolean): void {
    const config = this.step().confirmConfig;
    this.confirmed.emit({
      field: config?.resultField || 'confirmed',
      value,
      nextStep: value ? config?.yesNextStep : config?.noNextStep,
    });
  }
}
