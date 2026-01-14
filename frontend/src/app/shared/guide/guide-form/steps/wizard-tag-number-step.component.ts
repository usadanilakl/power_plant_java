import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WizardStep, StepDataPayload } from '../wizard-stack.types';
import { TagNumberGeneratorComponent } from '../../../../features/tag-number/tag-number-generator/tag-number-generator.component';

@Component({
  selector: 'app-wizard-tag-number-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    TagNumberGeneratorComponent,
  ],
  template: `
    <div class="tag-number-step">
      <mat-tab-group
        [(selectedIndex)]="activeTab"
        class="tag-number-tabs"
        animationDuration="200ms"
      >
        <!-- Manual Entry Tab -->
        @if (showManualInput()) {
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">edit</mat-icon>
              Manual Entry
            </ng-template>
            <div class="tab-content">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tag Number</mat-label>
                <input
                  matInput
                  [(ngModel)]="manualTagNumber"
                  (ngModelChange)="onManualInput($event)"
                  [placeholder]="'Enter tag number manually'"
                  [required]="step().tagNumberConfig?.required ?? false"
                />
                <mat-hint>Enter the tag number directly or use the generator tab</mat-hint>
              </mat-form-field>

              @if (manualTagNumber()) {
                <div class="preview-section">
                  <span class="preview-label">Preview:</span>
                  <span class="preview-value">{{ manualTagNumber() }}</span>
                </div>
              }
            </div>
          </mat-tab>
        }

        <!-- Generator Tab -->
        @if (showGenerator()) {
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">auto_fix_high</mat-icon>
              Generate
            </ng-template>
            <div class="tab-content generator-tab">
              <app-tag-number-generator
                (tagGenerated)="onTagGenerated($event)"
                (cancelled)="onGeneratorCancelled()"
              />
            </div>
          </mat-tab>
        }
      </mat-tab-group>

      @if (generatedTagNumber()) {
        <div class="generated-result">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <div class="result-info">
            <span class="result-label">Generated Tag Number:</span>
            <span class="result-value">{{ generatedTagNumber() }}</span>
          </div>
          <button mat-icon-button (click)="clearGenerated()" matTooltip="Clear">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .tag-number-step {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tag-number-tabs {
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
      background: #fafafa;
      border-radius: 8px;
    }

    .full-width {
      width: 100%;
    }

    .preview-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 12px;
      background: #e3f2fd;
      border-radius: 6px;
    }

    .preview-label {
      color: #666;
      font-size: 13px;
    }

    .preview-value {
      font-weight: 600;
      font-family: monospace;
      font-size: 14px;
      color: #1976d2;
    }

    .generated-result {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #e8f5e9;
      border-radius: 8px;
      border: 1px solid #c8e6c9;
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
      color: #666;
    }

    .result-value {
      font-weight: 600;
      font-family: monospace;
      font-size: 16px;
      color: #2e7d32;
    }
  `],
})
export class WizardTagNumberStepComponent {
  step = input.required<WizardStep>();
  currentValue = input<string | null>(null);

  valueChange = output<StepDataPayload>();

  activeTab = 0;
  manualTagNumber = signal<string>('');
  generatedTagNumber = signal<string | null>(null);

  showManualInput = computed(() => {
    const config = this.step().tagNumberConfig;
    return config?.showManualInput !== false;
  });

  showGenerator = computed(() => {
    const config = this.step().tagNumberConfig;
    return config?.showGenerator !== false;
  });

  constructor() {
    // Initialize from current value if provided
    const initial = this.currentValue();
    if (initial) {
      this.manualTagNumber.set(initial);
    }
  }

  onManualInput(value: string): void {
    this.generatedTagNumber.set(null);
    this.emitValue(value);
  }

  onTagGenerated(tagNumber: string): void {
    this.generatedTagNumber.set(tagNumber);
    this.manualTagNumber.set(tagNumber);
    this.emitValue(tagNumber);

    // Switch to manual tab to show the generated value
    if (this.showManualInput()) {
      this.activeTab = 0;
    }
  }

  onGeneratorCancelled(): void {
    // Switch back to manual tab if available
    if (this.showManualInput()) {
      this.activeTab = 0;
    }
  }

  clearGenerated(): void {
    this.generatedTagNumber.set(null);
    this.manualTagNumber.set('');
    this.emitValue('');
  }

  private emitValue(value: string): void {
    const fieldName = this.step().tagNumberConfig?.fieldName || 'tagNumber';
    this.valueChange.emit({
      field: fieldName,
      value: value,
      entityType: 'lotoPoint',
    });
  }
}
