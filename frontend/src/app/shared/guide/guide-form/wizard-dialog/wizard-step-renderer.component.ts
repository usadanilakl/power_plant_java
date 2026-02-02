import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  WizardStep,
  WizardContextFrame,
  WizardBranchRequest,
  WizardEntityData,
  StepDataPayload,
  WizardFlowType,
} from '../wizard-stack.types';

// Import step components
import { WizardWelcomeStepComponent } from '../steps/wizard-welcome-step.component';
import { WizardTextInputStepComponent } from '../steps/wizard-text-input-step.component';
import { WizardSelectInputStepComponent } from '../steps/wizard-select-input-step.component';
import { WizardMultiSelectStepComponent } from '../steps/wizard-multi-select-step.component';
import { WizardFormSectionStepComponent } from '../steps/wizard-form-section-step.component';
import { WizardFileUploadStepComponent } from '../steps/wizard-file-upload-step.component';
import { WizardFileBrowserStepComponent } from '../steps/wizard-file-browser-step.component';
import { WizardTableSelectorStepComponent } from '../steps/wizard-table-selector-step.component';
import { WizardConfirmStepComponent } from '../steps/wizard-confirm-step.component';
import { WizardReviewStepComponent } from '../steps/wizard-review-step.component';
import { WizardCompleteStepComponent } from '../steps/wizard-complete-step.component';
import { WizardHintsPanelComponent } from '../steps/wizard-hints-panel.component';
// New specialized step components
import { WizardTagNumberStepComponent } from '../steps/wizard-tag-number-step.component';
import { WizardDescriptionStepComponent } from '../steps/wizard-description-step.component';
import { WizardValueSelectStepComponent } from '../steps/wizard-value-select-step.component';
import { WizardZeroEnergyStepComponent } from '../steps/wizard-zero-energy-step.component';
import { WizardEquipmentPickerStepComponent } from '../steps/wizard-equipment-picker-step.component';
import { WizardLotoPointSelectorStepComponent } from '../steps/wizard-loto-point-selector-step.component';
import { WizardPhraseBuilderStepComponent } from '../steps/wizard-phrase-builder-step.component';
import { WizardCounterpartCreationStepComponent } from '../steps/wizard-counterpart-creation-step.component';

@Component({
  selector: 'app-wizard-step-renderer',
  standalone: true,
  imports: [
    CommonModule,
    WizardWelcomeStepComponent,
    WizardTextInputStepComponent,
    WizardSelectInputStepComponent,
    WizardMultiSelectStepComponent,
    WizardFormSectionStepComponent,
    WizardFileUploadStepComponent,
    WizardFileBrowserStepComponent,
    WizardTableSelectorStepComponent,
    WizardConfirmStepComponent,
    WizardReviewStepComponent,
    WizardCompleteStepComponent,
    WizardHintsPanelComponent,
    // New specialized step components
    WizardTagNumberStepComponent,
    WizardDescriptionStepComponent,
    WizardValueSelectStepComponent,
    WizardZeroEnergyStepComponent,
    WizardEquipmentPickerStepComponent,
    WizardLotoPointSelectorStepComponent,
    WizardPhraseBuilderStepComponent,
    WizardCounterpartCreationStepComponent,
  ],
  template: `
    @if (step()) {
      <div class="step-container">
        <!-- Step Header -->
        <div class="step-header">
          <h2 class="step-title">{{ step()?.title }}</h2>
          <p class="step-description">{{ step()?.description }}</p>
        </div>

        <!-- Step Content -->
        <div class="step-content">
          @switch (step()?.type) {
            @case ('welcome') {
              <app-wizard-welcome-step
                [step]="step()!"
              />
            }

            @case ('text-input') {
              <app-wizard-text-input-step
                [step]="step()!"
                [currentValue]="getCurrentValue(step()?.inputConfig?.fieldName)"
                (valueChange)="onValueChange($event)"
              />
            }

            @case ('textarea-input') {
              <app-wizard-text-input-step
                [step]="step()!"
                [currentValue]="getCurrentValue(step()?.inputConfig?.fieldName)"
                [multiline]="true"
                (valueChange)="onValueChange($event)"
              />
            }

            @case ('select-input') {
              <app-wizard-select-input-step
                [step]="step()!"
                [currentValue]="getCurrentValue(step()?.selectConfig?.fieldName)"
                (valueChange)="onValueChange($event)"
                (createNew)="onCreateNew($event)"
              />
            }

            @case ('multi-select') {
              <app-wizard-multi-select-step
                [step]="step()!"
                [currentValue]="getCurrentValue(step()?.tableConfig?.fieldName)"
                (valueChange)="onValueChange($event)"
                (createNew)="onCreateNew($event)"
              />
            }

            @case ('loto-point-selector') {
              <app-wizard-loto-point-selector-step
                [step]="step()!"
                [currentValue]="getCurrentValue(step()?.tableConfig?.fieldName)"
                (valueChange)="onValueChange($event)"
                (createNew)="onCreateNew($event)"
              />
            }

            @case ('form-section') {
              <app-wizard-form-section-step
                [step]="step()!"
                [entityData]="entityData()"
                (valueChange)="onValueChange($event)"
                (createNew)="onCreateNew($event)"
              />
            }

            @case ('file-upload') {
              <app-wizard-file-upload-step
                [step]="step()!"
                [currentFile]="getCurrentValue(step()?.uploadConfig?.fieldName)"
                (fileSelected)="onFileSelected($event)"
              />
            }

            @case ('file-browser') {
              <app-wizard-file-browser-step
                [step]="step()!"
                [currentValue]="getCurrentValue(step()?.fileBrowserConfig?.fieldName)"
                (valueChange)="onValueChange($event)"
                (uploadNew)="onUploadNew()"
              />
            }

            @case ('table-selector') {
              <app-wizard-table-selector-step
                [step]="step()!"
                [currentValue]="getCurrentValue(step()?.tableConfig?.fieldName)"
                (valueChange)="onValueChange($event)"
                (createNew)="onCreateNew($event)"
              />
            }

            @case ('tag-number') {
              <app-wizard-tag-number-step
                [step]="step()!"
                [currentValue]="getCurrentValue(step()?.tagNumberConfig?.fieldName || 'tagNumber')"
                (valueChange)="onValueChange($event)"
              />
            }

            @case ('description-builder') {
              <app-wizard-description-step
                [step]="step()!"
                [currentValue]="getCurrentValue(step()?.descriptionConfig?.fieldName || 'description')"
                (valueChange)="onValueChange($event)"
              />
            }

            @case ('value-select') {
              <app-wizard-value-select-step
                [step]="step()!"
                [currentValue]="getCurrentValue(step()?.valueSelectConfig?.fieldName)"
                (valueChange)="onValueChange($event)"
              />
            }

            @case ('phrase-builder') {
              <app-wizard-phrase-builder-step
                [step]="step()!"
                [currentValue]="getCurrentValue(step()?.phraseBuilderConfig?.fieldName)"
                (valueChange)="onValueChange($event)"
              />
            }

            @case ('zero-energy') {
              <app-wizard-zero-energy-step
                [step]="step()!"
                [frame]="frame()!"
                (valueChange)="onValueChange($event)"
                (branchRequest)="onCreateNew($event)"
              />
            }

            @case ('equipment-picker') {
              <app-wizard-equipment-picker-step
                [step]="step()!"
                [frame]="frame()!"
                (valueChange)="onValueChange($event)"
                (branchRequest)="onCreateNew($event)"
              />
            }

            @case ('confirm') {
              <app-wizard-confirm-step
                [step]="step()!"
                (confirmed)="onConfirmed($event)"
              />
            }

            @case ('review') {
              <app-wizard-review-step
                [step]="step()!"
                [frame]="frame()!"
              />
            }

            @case ('counterpart-creation') {
              <app-wizard-counterpart-creation-step
                [step]="step()!"
                [frame]="frame()!"
                (valueChange)="onValueChange($event)"
                (stepComplete)="onCounterpartStepComplete()"
              />
            }

            @case ('complete') {
              <app-wizard-complete-step
                [step]="step()!"
              />
            }

            @default {
              <div class="unknown-step">
                <p>Unknown step type: {{ step()?.type }}</p>
              </div>
            }
          }
        </div>

        <!-- Hints Panel -->
        @if (step()?.hints?.length) {
          <app-wizard-hints-panel
            [hints]="step()!.hints!"
          />
        }
      </div>
    }
  `,
  styles: [`
    .step-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .step-header {
      text-align: center;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color, #eee);
    }

    .step-title {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 500;
      color: var(--primary-text, #333);
    }

    .step-description {
      margin: 0;
      color: var(--secondary-text, #666);
      font-size: 14px;
      line-height: 1.5;
    }

    .step-content {
      min-height: 150px;
    }

    .unknown-step {
      padding: 20px;
      background: var(--warning-background, #fff3e0);
      border-radius: 8px;
      text-align: center;
      color: var(--primary-text, #e65100);
    }
  `],
})
export class WizardStepRendererComponent {
  step = input<WizardStep | null>(null);
  frame = input<WizardContextFrame | null>(null);

  stepDataChange = output<StepDataPayload>();
  branchRequest = output<WizardBranchRequest>();
  stepComplete = output<any>();

  entityData = computed<WizardEntityData>(() => {
    return this.frame()?.entityData ?? {};
  });

  getCurrentValue(fieldName?: string): any {
    if (!fieldName) return undefined;

    const frame = this.frame();
    if (!frame) return undefined;

    // Check all entity types for the field
    const entityData = frame.entityData;

    // Check in lotoStandard
    if (entityData.lotoStandard?.[fieldName as keyof typeof entityData.lotoStandard] !== undefined) {
      return entityData.lotoStandard[fieldName as keyof typeof entityData.lotoStandard];
    }

    // Check in lotoPoint
    if (entityData.lotoPoint?.[fieldName as keyof typeof entityData.lotoPoint] !== undefined) {
      return entityData.lotoPoint[fieldName as keyof typeof entityData.lotoPoint];
    }

    // Check in file
    if (entityData.file?.[fieldName as keyof typeof entityData.file] !== undefined) {
      return entityData.file[fieldName as keyof typeof entityData.file];
    }

    // Check in value
    if (entityData.value?.[fieldName as keyof typeof entityData.value] !== undefined) {
      return entityData.value[fieldName as keyof typeof entityData.value];
    }

    // Check in zeroEnergy
    if (entityData.zeroEnergy?.[fieldName as keyof typeof entityData.zeroEnergy] !== undefined) {
      return entityData.zeroEnergy[fieldName as keyof typeof entityData.zeroEnergy];
    }

    // Check in collected
    if (entityData.collected?.[fieldName] !== undefined) {
      return entityData.collected[fieldName];
    }

    return undefined;
  }

  onValueChange(payload: StepDataPayload): void {
    this.stepDataChange.emit(payload);
  }

  onCreateNew(config: { flowType: WizardFlowType; field: string; initialData?: any }): void {
    // Determine the correct entity path based on field name and current flow
    const frame = this.frame();
    let entityPath = config.field;

    // If we're in build-standard flow and creating loto points, use lotoStandard path
    if (frame?.flow.type === 'build-standard' && config.field === 'lotoPoints') {
      entityPath = 'lotoStandard.lotoPoints';
    }

    this.branchRequest.emit({
      flowType: config.flowType,
      initialData: config.initialData,
      returnCallback: {
        field: entityPath,
        mode: 'append', // Append to array instead of replacing
      },
    });
  }

  onFileSelected(event: { fieldName: string; file: File }): void {
    this.stepDataChange.emit({
      field: event.fieldName,
      value: event.file,
      entityType: 'file',
    });
  }

  onUploadNew(): void {
    this.branchRequest.emit({
      flowType: 'upload-file',
      returnCallback: {
        field: 'equipmentList',
        mode: 'append',
      },
    });
  }

  onConfirmed(result: { field: string; value: boolean; nextStep?: string }): void {
    this.stepDataChange.emit({
      field: result.field,
      value: result.value,
    });
    this.stepComplete.emit(result);
  }

  onCounterpartStepComplete(): void {
    this.stepComplete.emit({ counterpartCreated: true });
  }
}
