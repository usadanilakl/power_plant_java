import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WizardStep, StepDataPayload, ValueCategory } from '../wizard-stack.types';
import { RfValueSelectComponent } from '../../../../features/values/refactored/components/rf-value-select/rf-value-select.component';
import { RfValueDto } from '../../../../features/values/refactored/models/rf-value.model';

@Component({
  selector: 'app-wizard-value-select-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    RfValueSelectComponent,
  ],
  template: `
    <div class="value-select-step">
      <div class="select-container">
        <app-rf-value-select
          [categoryAlias]="categoryAlias()"
          [label]="label()"
          [canManageValues]="canManageValues()"
          [(ngModel)]="selectedValueId"
          (ngModelChange)="onValueIdChange($event)"
          (valueSelected)="onValueSelected($event)"
        />
      </div>

      @if (selectedValue()) {
        <div class="selection-preview">
          <mat-icon class="preview-icon">check_circle</mat-icon>
          <div class="preview-content">
            <span class="preview-label">Selected:</span>
            <span class="preview-name">{{ selectedValue()?.name }}</span>
            @if (selectedValue()?.alias) {
              <span class="preview-alias">({{ selectedValue()?.alias }})</span>
            }
          </div>
        </div>
      }

      @if (!selectedValueId && step().valueSelectConfig?.required) {
        <div class="required-hint">
          <mat-icon>info</mat-icon>
          <span>This field is required. Please select or create a value.</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .value-select-step {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .select-container {
      width: 100%;
    }

    .selection-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #e8f5e9;
      border-radius: 8px;
      border: 1px solid #c8e6c9;
    }

    .preview-icon {
      color: #4caf50;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .preview-content {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 8px;
    }

    .preview-label {
      font-size: 12px;
      color: #666;
    }

    .preview-name {
      font-weight: 600;
      font-size: 14px;
      color: #2e7d32;
    }

    .preview-alias {
      font-size: 12px;
      color: #666;
    }

    .required-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fff3e0;
      border-radius: 6px;
      font-size: 13px;
      color: #e65100;
    }

    .required-hint mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
})
export class WizardValueSelectStepComponent {
  step = input.required<WizardStep>();
  currentValue = input<number | null>(null);

  valueChange = output<StepDataPayload>();

  selectedValueId: number | null = null;
  selectedValue = signal<RfValueDto | null>(null);

  categoryAlias = computed((): string => {
    return this.step().valueSelectConfig?.categoryAlias || 'eqType';
  });

  label = computed((): string => {
    return this.step().valueSelectConfig?.label || this.step().title || 'Select Value';
  });

  canManageValues = computed((): boolean => {
    return this.step().valueSelectConfig?.canManageValues !== false;
  });

  constructor() {
    // Initialize from current value if provided
    effect(() => {
      const initial = this.currentValue();
      if (initial && !this.selectedValueId) {
        this.selectedValueId = initial;
      }
    });
  }

  onValueIdChange(valueId: number | null): void {
    // Only emit value ID, wait for valueSelected for full object
    if (valueId !== this.selectedValueId) {
      this.emitValue(valueId);
    }
  }

  onValueSelected(value: RfValueDto | null): void {
    this.selectedValue.set(value);

    // Emit full value object for entity data
    const fieldName = this.step().valueSelectConfig?.fieldName || 'value';
    this.valueChange.emit({
      field: fieldName,
      value: value ? { id: value.id, name: value.name, alias: value.alias } : null,
      entityType: 'lotoPoint',
    });
  }

  private emitValue(valueId: number | null): void {
    const fieldName = this.step().valueSelectConfig?.fieldName || 'value';
    // Emit just the ID initially
    this.valueChange.emit({
      field: `${fieldName}Id`,
      value: valueId,
      entityType: 'lotoPoint',
    });
  }
}
