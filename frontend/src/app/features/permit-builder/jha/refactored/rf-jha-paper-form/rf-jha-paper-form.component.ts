import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RfJhaStateService } from '../services/rf-jha-state.service';
import { FormRendererComponent } from '../../../../form-designer-refactored/form-renderer/form-renderer.component';
import { JhaDto } from '../../../../../models/permits/jha.model';
import { PrintableFormDto } from '../../../../../models/forms/printable-form.model';
import { FormField } from '../../../../../models/ui/form-field.model';
import { FormContainerDto } from '../../../../../models/forms/form-container.model';

@Component({
  selector: 'app-rf-jha-paper-form',
  standalone: true,
  imports: [FormRendererComponent],
  template: `
    <app-form-renderer
      [formData]="data()"
      [formDefinition]="form()"
      (formSubmit)="onSubmit($event)"
    ></app-form-renderer>
  `,
  styles: [`:host { display: block; height: 100%; overflow: auto; }`]
})
export class RfJhaPaperFormComponent {
  private stateService = inject(RfJhaStateService);

  paperForm = toSignal(this.stateService.paperForm$, { initialValue: new PrintableFormDto() });

  data = computed(() => this.stateService.selectedItem() ?? new JhaDto());

  fieldsWithOptions = computed(() => {
    const entity = this.data();
    return entity.getFormFields();
  });

  form = computed(() => {
    const form = this.paperForm();
    const fields = this.fieldsWithOptions();
    if (!form.id || fields.length === 0) {
      return form;
    }

    const fieldsMap = new Map(fields.map(f => [f.name, f]));

    const updatedContainers = form.formContainers.map(container => {
      if (container.contentType === 'formField' && container.content) {
        const fieldWithOptions = fieldsMap.get((container.content as FormField).name);
        if (fieldWithOptions) {
          const newContainer = new FormContainerDto(container);
          newContainer.content = {
            ...(container.content as FormField),
            ...fieldWithOptions,
            type: (container.content as FormField).type,
          };
          return newContainer;
        }
      }
      return container;
    });

    return new PrintableFormDto({
      ...form,
      formContainers: updatedContainers
    });
  });

  onSubmit(form: JhaDto): void {
    this.stateService.submitForm(form);
  }
}
