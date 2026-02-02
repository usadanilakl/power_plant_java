import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
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
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    NamingConventionComponent,
  ],
  template: `
    <div class="description-step">
      <mat-tab-group
        [(selectedIndex)]="activeTab"
        class="description-tabs"
        animationDuration="200ms"
      >
        <!-- Manual Entry Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">edit</mat-icon>
            Manual Entry
          </ng-template>
          <div class="tab-content">
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
              <mat-hint>Enter the description directly or use the generator tab</mat-hint>
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
          </div>
        </mat-tab>

        <!-- Generator Tab -->
        @if (showGenerator()) {
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">auto_fix_high</mat-icon>
              Generate
            </ng-template>
            <div class="tab-content generator-tab">
              <app-naming-convention
                (nameGenerated)="onNameGenerated($event)"
              />
            </div>
          </mat-tab>
        }
      </mat-tab-group>

      @if (generatedDescription()) {
        <div class="generated-result">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <div class="result-info">
            <span class="result-label">Generated Description:</span>
            <span class="result-value">{{ generatedDescription() }}</span>
          </div>
          <button mat-icon-button (click)="clearGenerated()" matTooltip="Clear">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }

      <!-- Preview Section -->
      @if (description() && !generatedDescription()) {
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

    .description-tabs {
      min-height: 200px;
    }

    .tab-icon {
      margin-right: 8px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .tab-content {
      padding: 20px 0;
    }

    .generator-tab {
      padding: 16px;
      background: var(--secondary-background, #fafafa);
      border-radius: 8px;
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
      color: var(--secondary-text, #666);
    }

    .keyword-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .generated-result {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--success-background, #e8f5e9);
      border-radius: 8px;
      border: 1px solid var(--border-color, #c8e6c9);
    }

    .success-icon {
      color: #4caf50;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .result-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .result-label {
      font-size: 12px;
      color: var(--secondary-text, #666);
    }

    .result-value {
      font-weight: 600;
      font-size: 14px;
      color: var(--primary-text, #2e7d32);
    }

    .preview-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: var(--secondary-background, #f5f5f5);
      border-radius: 8px;
      border-left: 3px solid var(--accent-color, #1976d2);
    }

    .preview-label {
      font-size: 12px;
      color: var(--secondary-text, #666);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .preview-value {
      font-size: 14px;
      line-height: 1.5;
      color: var(--primary-text, #333);
      word-wrap: break-word;
    }
  `],
})
export class WizardDescriptionStepComponent {
  step = input.required<WizardStep>();
  currentValue = input<string | null>(null);

  valueChange = output<StepDataPayload>();

  activeTab = 0;
  description = signal<string>('');
  generatedDescription = signal<string | null>(null);

  // Common keywords for quick addition
  quickKeywords = [
    'ISO', 'DRAIN', 'VENT', 'ROOT', 'BLOCK',
    'INLET', 'OUTLET', 'BYPASS', 'UPSTREAM', 'DOWNSTREAM'
  ];

  showGenerator = computed(() => {
    const config = this.step().descriptionConfig;
    return config?.showGenerator !== false;
  });

  maxLength = computed(() => {
    return this.step().descriptionConfig?.maxLength || 500;
  });

  constructor() {
    effect(() => {
      const initial = this.currentValue();
      const newValue = initial ?? '';
      if (this.description() !== newValue) {
        this.description.set(newValue);
      }
    });
  }

  onDescriptionChange(value: string): void {
    this.generatedDescription.set(null);
    this.emitValue(value);
  }

  appendKeyword(keyword: string): void {
    const current = this.description().trim();
    const newValue = current ? `${current} ${keyword}` : keyword;
    this.description.set(newValue);
    this.generatedDescription.set(null);
    this.emitValue(newValue);
  }

  onNameGenerated(name: string): void {
    this.generatedDescription.set(name);
    this.description.set(name);
    this.emitValue(name);

    // Switch to manual tab to show the generated value
    this.activeTab = 0;
  }

  clearGenerated(): void {
    this.generatedDescription.set(null);
    this.description.set('');
    this.emitValue('');
  }

  clearDescription(): void {
    this.description.set('');
    this.generatedDescription.set(null);
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
