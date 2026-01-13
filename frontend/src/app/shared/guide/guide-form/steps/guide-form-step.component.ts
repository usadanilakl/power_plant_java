import { Component, inject, input, output, computed, signal, effect } from '@angular/core';
import { GuideFormStep } from '../guide-form.types';
import { GuideHintsPanelComponent } from './guide-hints-panel.component';
import { RfReactiveFormComponent } from '../../../reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { FileMapperService } from '../../../../features/files/refactored/services/rf-file-mapper.service';
import { FileDto } from '../../../../models/file/file.model';
import { RfFormField } from '../../../../models/ui/form-field.model';

@Component({
  selector: 'app-guide-form-step',
  standalone: true,
  imports: [GuideHintsPanelComponent, RfReactiveFormComponent],
  template: `
    <div class="form-step">
      <h3 class="step-title">{{ step().title }}</h3>
      <p class="step-description">{{ step().description }}</p>

      @if (step().hints && step().hints!.length > 0) {
        <app-guide-hints-panel [hints]="step().hints!" [compact]="true" />
      }

      <div class="form-container">
        <app-rf-reactive-form
          [fields]="formFields()"
          [entity]="entity()"
          [showSubmitButton]="false"
          layout="column"
          (formValueChange)="onFormChange($event)"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .form-step {
        padding: 16px;
      }

      .step-title {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary, #333);
      }

      .step-description {
        margin: 0 0 16px 0;
        font-size: 14px;
        color: var(--text-secondary, #666);
      }

      .form-container {
        margin-top: 16px;
      }
    `,
  ],
})
export class GuideFormStepComponent {
  private fileMapper = inject(FileMapperService);

  step = input.required<GuideFormStep>();
  initialData = input<Record<string, any>>({});
  selectedFileName = input<string>('');

  formChange = output<Record<string, any>>();

  private currentFormData = signal<Record<string, any>>({});

  // Create entity based on initial data and selected file name
  entity = computed(() => {
    const data = this.initialData();
    const fileName = this.selectedFileName();

    // Auto-fill name and fileNumber from selected file name
    if (fileName && this.step().formEntityType === 'file') {
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      return new FileDto({
        ...data,
        name: data['name'] || nameWithoutExt,
        fileNumber: data['fileNumber'] || [nameWithoutExt],
      });
    }

    return new FileDto(data);
  });

  // Generate form fields based on step configuration
  formFields = computed<RfFormField[]>(() => {
    const step = this.step();
    const entity = this.entity();

    if (step.formEntityType === 'file') {
      const fieldNames = (step.formFields || ['name', 'fileType', 'fileNumber', 'vendor', 'isVerified']) as (keyof FileDto)[];
      return this.fileMapper.toFormFields(entity, fieldNames);
    }

    // Future: Add LOTO point and LOTO standard mappers
    return [];
  });

  onFormChange(data: any): void {
    this.currentFormData.set(data);
    this.formChange.emit(data);
  }
}
