import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { WizardStep, StepDataPayload } from '../wizard-stack.types';

@Component({
  selector: 'app-wizard-text-input-step',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="text-input-container">
      <mat-form-field appearance="outline" class="full-width">
        @if (multiline()) {
          <textarea
            matInput
            [placeholder]="step().inputConfig?.placeholder || 'Enter value...'"
            [(ngModel)]="inputValue"
            (ngModelChange)="onInputChange($event)"
            [maxlength]="step().inputConfig?.maxLength || 500"
            rows="4"
          ></textarea>
        } @else {
          <input
            matInput
            [placeholder]="step().inputConfig?.placeholder || 'Enter value...'"
            [(ngModel)]="inputValue"
            (ngModelChange)="onInputChange($event)"
            [maxlength]="step().inputConfig?.maxLength || 200"
          />
        }
        @if (step().inputConfig?.maxLength) {
          <mat-hint align="end">
            {{ inputValue.length }} / {{ step().inputConfig?.maxLength }}
          </mat-hint>
        }
      </mat-form-field>
    </div>
  `,
  styles: [`
    .text-input-container {
      padding: 10px 0;
    }

    .full-width {
      width: 100%;
    }

    textarea {
      resize: vertical;
      min-height: 100px;
    }
  `],
})
export class WizardTextInputStepComponent {
  step = input.required<WizardStep>();
  currentValue = input<string>('');
  multiline = input<boolean>(false);

  valueChange = output<StepDataPayload>();

  inputValue = '';

  constructor() {
    effect(() => {
      const current = this.currentValue();
      if (current !== undefined && current !== null) {
        this.inputValue = current;
      }
    });
  }

  onInputChange(value: string): void {
    const fieldName = this.step().inputConfig?.fieldName;
    if (fieldName) {
      this.valueChange.emit({
        field: fieldName,
        value: value,
      });
    }
  }
}
