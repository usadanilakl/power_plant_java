import { Component, computed, DestroyRef, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { CurrentExcavationPermitService } from '../../../../services/current-items-services/current-excavation-permit.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { ExcavationPermitDto } from '../../../../models/permits/excavation-permit.model';
import { FormRendererComponent } from "../../../form-designer-refactored/form-renderer/form-renderer.component";
import { Option } from '../../../../models/option.model';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormField } from '../../../../models/ui/form-field.model';

@Component({
  selector: 'app-excavation-permit-paper-form',
  standalone: true,
  imports: [FormRendererComponent],
  templateUrl: './excavation-permit-paper-form.component.html',
  styleUrl: './excavation-permit-paper-form.component.css'
})
export class ExcavationPermitPaperFormComponent {
  currentService = inject(CurrentExcavationPermitService);
  private destroyRef = inject(DestroyRef);

  dataInput = input<ExcavationPermitDto | null>(null);
  @Output() submitEvent = new EventEmitter<ExcavationPermitDto>();
  @Output() changeEvent = new EventEmitter<ExcavationPermitDto>();

  paperForm = toSignal(this.currentService.paperForm$, { initialValue: new PrintableFormDto() });
  dataFromService = toSignal(this.currentService.selectedPermit$, { initialValue: new ExcavationPermitDto() });

  data = computed(() => this.dataInput() ?? this.dataFromService());

  fieldsWithOptions = computed(() => ExcavationPermitDto.toFormFields(this.data()!));

  form = computed(() => {
    const form = this.paperForm();
    const fields = this.fieldsWithOptions();
    if (!form.id || fields.length === 0) return form;
    const fieldsMap = new Map(fields.map(f => [f.name, f]));
    const updatedContainers = form.formContainers.map(container => {
      if (container.contentType === 'formField' && container.content) {
        const fieldWithOptions = fieldsMap.get((container.content as FormField).name);
        if (fieldWithOptions) {
          const newContainer = new FormContainerDto(container);
          newContainer.content = { ...(container.content as FormField), ...fieldWithOptions, type: (container.content as FormField).type };
          return newContainer;
        }
      }
      return container;
    });
    return new PrintableFormDto({ ...form, formContainers: updatedContainers });
  });

  onSubmit(form: ExcavationPermitDto): void {
    if (this.submitEvent.observers.length > 0) { this.submitEvent.emit(form); return; }
    this.currentService.savePermit(form);
  }
  onChange(form: ExcavationPermitDto): void {
    if (this.changeEvent.observers.length > 0) { this.changeEvent.emit(form); return; }
    this.currentService.savePermit(form);
  }
}
