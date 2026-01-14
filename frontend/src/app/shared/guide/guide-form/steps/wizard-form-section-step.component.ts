import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WizardStep, WizardEntityData, StepDataPayload, WizardFlowType } from '../wizard-stack.types';

@Component({
  selector: 'app-wizard-form-section-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="form-section-container" [class]="step().formConfig?.layout || 'vertical'">
      @for (field of step().formConfig?.fields || []; track field) {
        <div class="form-field">
          @switch (getFieldType(field)) {
            @case ('text') {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ getFieldLabel(field) }}</mat-label>
                <input
                  matInput
                  [value]="getFieldValue(field)"
                  (input)="onFieldChange(field, $event)"
                  [placeholder]="getFieldPlaceholder(field)"
                />
              </mat-form-field>
            }
            @case ('select') {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ getFieldLabel(field) }}</mat-label>
                <mat-select
                  [value]="getFieldValue(field)"
                  (selectionChange)="onSelectChange(field, $event.value)"
                >
                  @for (option of getFieldOptions(field); track option.value) {
                    <mat-option [value]="option.value">{{ option.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              @if (canCreateNew(field)) {
                <button mat-icon-button (click)="onCreateNew(field)" matTooltip="Create New">
                  <mat-icon>add</mat-icon>
                </button>
              }
            }
            @default {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ getFieldLabel(field) }}</mat-label>
                <input
                  matInput
                  [value]="getFieldValue(field)"
                  (input)="onFieldChange(field, $event)"
                />
              </mat-form-field>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .form-section-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 10px 0;
    }

    .form-section-container.horizontal {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .form-section-container.grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .form-field {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .full-width {
      flex: 1;
      width: 100%;
    }
  `],
})
export class WizardFormSectionStepComponent {
  step = input.required<WizardStep>();
  entityData = input.required<WizardEntityData>();

  valueChange = output<StepDataPayload>();
  createNew = output<{ flowType: WizardFlowType; field: string; initialData?: any }>();

  // Field metadata - in real implementation, this would come from a mapper service
  private fieldMeta: Record<string, { label: string; type: string; placeholder?: string; options?: any[] }> = {
    tagNumber: { label: 'Tag Number', type: 'text', placeholder: 'e.g., 01-MV-001' },
    unit: { label: 'Unit', type: 'select', options: [
      { value: '01', label: 'Unit 01' },
      { value: '02', label: 'Unit 02' },
    ]},
    name: { label: 'Name', type: 'text' },
    description: { label: 'Description', type: 'text' },
    specificLocation: { label: 'Specific Location', type: 'text' },
    eqType: { label: 'Equipment Type', type: 'select' },
    location: { label: 'Location', type: 'select' },
    normPos: { label: 'Normal Position', type: 'select' },
    isoPos: { label: 'Isolated Position', type: 'select' },
  };

  getFieldType(field: string): string {
    return this.fieldMeta[field]?.type || 'text';
  }

  getFieldLabel(field: string): string {
    return this.fieldMeta[field]?.label || this.formatFieldName(field);
  }

  getFieldPlaceholder(field: string): string {
    return this.fieldMeta[field]?.placeholder || '';
  }

  getFieldOptions(field: string): { value: any; label: string }[] {
    return this.fieldMeta[field]?.options || [];
  }

  getFieldValue(field: string): any {
    const data = this.entityData();
    const entityType = this.step().formConfig?.entityType;

    if (entityType === 'loto-point' && data.lotoPoint) {
      return (data.lotoPoint as any)[field];
    }
    if (entityType === 'loto-standard' && data.lotoStandard) {
      return (data.lotoStandard as any)[field];
    }
    if (entityType === 'value' && data.value) {
      return (data.value as any)[field];
    }

    return undefined;
  }

  onFieldChange(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emitChange(field, value);
  }

  onSelectChange(field: string, value: any): void {
    this.emitChange(field, value);
  }

  private emitChange(field: string, value: any): void {
    this.valueChange.emit({
      field,
      value,
      entityType: this.mapEntityType(),
    });
  }

  private mapEntityType(): keyof WizardEntityData | undefined {
    const type = this.step().formConfig?.entityType;
    switch (type) {
      case 'loto-point': return 'lotoPoint';
      case 'loto-standard': return 'lotoStandard';
      case 'file': return 'file';
      case 'equipment': return 'equipment';
      case 'value': return 'value';
      case 'zero-energy': return 'zeroEnergy';
      default: return undefined;
    }
  }

  canCreateNew(field: string): boolean {
    // Fields that support creating new values
    return ['eqType', 'location', 'normPos', 'isoPos'].includes(field);
  }

  onCreateNew(field: string): void {
    this.createNew.emit({
      flowType: 'create-value',
      field,
      initialData: { categoryName: field },
    });
  }

  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}
