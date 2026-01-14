import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { WizardStep, StepDataPayload } from '../wizard-stack.types';
import { NamingConventionComponent } from '../../../../features/tag-number/naming-convention/naming-convention.component';

@Component({
  selector: 'app-wizard-description-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    NamingConventionComponent,
  ],
  template: `
    <div class="description-step">
      <!-- Main Description Input -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea
          matInput
          [(ngModel)]="description"
          (ngModelChange)="onDescriptionChange($event)"
          [placeholder]="'Enter description'"
          [maxlength]="maxLength()"
          [required]="step().descriptionConfig?.required ?? false"
          rows="4"
        ></textarea>
        @if (maxLength()) {
          <mat-hint align="end">{{ description().length }} / {{ maxLength() }}</mat-hint>
        }
      </mat-form-field>

      <!-- Quick Keywords Chips -->
      <div class="quick-keywords">
        <span class="quick-label">Quick add:</span>
        <mat-chip-listbox class="keyword-chips" aria-label="Quick keywords">
          @for (keyword of quickKeywords; track keyword) {
            <mat-chip-option
              (click)="appendKeyword(keyword)"
              [selectable]="false"
            >
              {{ keyword }}
            </mat-chip-option>
          }
        </mat-chip-listbox>
      </div>

      <!-- Naming Convention Panel -->
      @if (showNamingConvention()) {
        <mat-expansion-panel class="naming-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="panel-icon">build</mat-icon>
              Build from Naming Convention
            </mat-panel-title>
            <mat-panel-description>
              Use predefined keywords to build description
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="naming-content">
            <app-naming-convention />

            <div class="naming-actions">
              <button mat-stroked-button (click)="clearDescription()">
                <mat-icon>clear</mat-icon>
                Clear
              </button>
            </div>
          </div>
        </mat-expansion-panel>
      }

      <!-- Preview Section -->
      @if (description()) {
        <div class="preview-section">
          <span class="preview-label">Preview:</span>
          <span class="preview-value">{{ description() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .description-step {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .quick-keywords {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .quick-label {
      font-size: 13px;
      color: #666;
    }

    .keyword-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .naming-panel {
      margin-top: 8px;
    }

    .panel-icon {
      margin-right: 8px;
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #1976d2;
    }

    .naming-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .naming-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid #eee;
    }

    .preview-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      border-left: 3px solid #1976d2;
    }

    .preview-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .preview-value {
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      word-wrap: break-word;
    }
  `],
})
export class WizardDescriptionStepComponent {
  step = input.required<WizardStep>();
  currentValue = input<string | null>(null);

  valueChange = output<StepDataPayload>();

  description = signal<string>('');

  // Common keywords for quick addition
  quickKeywords = [
    'ISO', 'DRAIN', 'VENT', 'ROOT', 'BLOCK',
    'INLET', 'OUTLET', 'BYPASS', 'UPSTREAM', 'DOWNSTREAM'
  ];

  showNamingConvention = computed(() => {
    const config = this.step().descriptionConfig;
    return config?.showNamingConvention !== false;
  });

  maxLength = computed(() => {
    return this.step().descriptionConfig?.maxLength || 500;
  });

  constructor() {
    // React to currentValue changes (including initial value after input binding)
    effect(() => {
      const initial = this.currentValue();
      // Set the value (including empty string) - only skip if truly not provided
      const newValue = initial ?? '';
      if (this.description() !== newValue) {
        this.description.set(newValue);
      }
    });
  }

  onDescriptionChange(value: string): void {
    this.emitValue(value);
  }

  appendKeyword(keyword: string): void {
    const current = this.description().trim();
    const newValue = current ? `${current} ${keyword}` : keyword;
    this.description.set(newValue);
    this.emitValue(newValue);
  }

  clearDescription(): void {
    this.description.set('');
    this.emitValue('');
  }

  private emitValue(value: string): void {
    const fieldName = this.step().descriptionConfig?.fieldName || 'description';
    this.valueChange.emit({
      field: fieldName,
      value: value,
      entityType: 'lotoPoint',
    });
  }
}
