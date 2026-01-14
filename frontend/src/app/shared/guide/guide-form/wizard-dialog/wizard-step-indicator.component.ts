import {
  Component,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WizardStep } from '../wizard-stack.types';

export interface StepIndicatorItem {
  id: string;
  title: string;
  index: number;
  status: 'completed' | 'current' | 'upcoming';
  isClickable: boolean;
}

@Component({
  selector: 'app-wizard-step-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="step-indicator-container">
      <div class="step-chain">
        @for (step of stepItems(); track step.id; let i = $index) {
          <div
            class="step-item"
            [class.completed]="step.status === 'completed'"
            [class.current]="step.status === 'current'"
            [class.upcoming]="step.status === 'upcoming'"
            [class.clickable]="step.isClickable"
            (click)="onStepClick(step)"
            [matTooltip]="step.title"
            matTooltipPosition="above"
          >
            <div class="step-circle">
              @if (step.status === 'completed') {
                <mat-icon class="check-icon">check</mat-icon>
              } @else {
                <span class="step-number">{{ step.index + 1 }}</span>
              }
            </div>
            @if (i < stepItems().length - 1) {
              <div class="step-connector" [class.completed]="step.status === 'completed'"></div>
            }
          </div>
        }
      </div>
      <div class="step-label">
        {{ currentStepTitle() }}
      </div>
    </div>
  `,
  styles: [`
    .step-indicator-container {
      padding: 8px 16px;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .step-chain {
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-x: auto;
      padding: 4px 0;
    }

    .step-item {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .step-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
      border: 2px solid #e0e0e0;
      background: white;
      color: #9e9e9e;
    }

    .step-item.completed .step-circle {
      background: #4caf50;
      border-color: #4caf50;
      color: white;
    }

    .step-item.current .step-circle {
      background: #1976d2;
      border-color: #1976d2;
      color: white;
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.2);
    }

    .step-item.upcoming .step-circle {
      background: white;
      border-color: #e0e0e0;
      color: #9e9e9e;
    }

    .step-item.clickable {
      cursor: pointer;
    }

    .step-item.clickable:hover .step-circle {
      transform: scale(1.1);
    }

    .step-item.clickable.completed:hover .step-circle {
      background: #43a047;
    }

    .step-item.clickable.current:hover .step-circle {
      background: #1565c0;
    }

    .check-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .step-number {
      font-size: 12px;
    }

    .step-connector {
      width: 24px;
      height: 2px;
      background: #e0e0e0;
      margin: 0 2px;
      transition: background 0.2s ease;
    }

    .step-connector.completed {
      background: #4caf50;
    }

    .step-label {
      text-align: center;
      font-size: 13px;
      color: #424242;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Responsive: compress for many steps */
    @media (max-width: 600px) {
      .step-circle {
        width: 24px;
        height: 24px;
        font-size: 11px;
      }

      .step-connector {
        width: 16px;
      }

      .check-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
  `],
})
export class WizardStepIndicatorComponent {
  steps = input.required<WizardStep[]>();
  currentStepIndex = input.required<number>();
  visitedSteps = input<number[]>([]);

  stepClick = output<string>();

  stepItems = computed<StepIndicatorItem[]>(() => {
    const allSteps = this.steps();
    const current = this.currentStepIndex();
    const visited = new Set(this.visitedSteps());

    return allSteps.map((step, index) => {
      let status: 'completed' | 'current' | 'upcoming';
      if (index < current) {
        status = 'completed';
      } else if (index === current) {
        status = 'current';
      } else {
        status = 'upcoming';
      }

      // Allow clicking on completed steps and current step
      // Also allow clicking on steps that have been visited (in case of back navigation)
      const isClickable = status === 'completed' || visited.has(index);

      return {
        id: step.id,
        title: step.title,
        index,
        status,
        isClickable,
      };
    });
  });

  currentStepTitle = computed(() => {
    const items = this.stepItems();
    const current = items.find(s => s.status === 'current');
    return current?.title ?? '';
  });

  onStepClick(step: StepIndicatorItem): void {
    if (step.isClickable && step.status !== 'current') {
      this.stepClick.emit(step.id);
    }
  }
}
