import { Component, computed, DestroyRef, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { CurrentEnergizedWorkPermitService } from '../../../../services/current-items-services/current-energized-work-permit.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { EnergizedWorkPermitDto } from '../../../../models/permits/energized-work-permit.model';
import { FormRendererComponent } from "../../../form-designer-refactored/form-renderer/form-renderer.component";
import { Option } from '../../../../models/option.model';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormField } from '../../../../models/ui/form-field.model';

@Component({
  selector: 'app-energized-work-permit-paper-form',
  standalone: true,
  imports: [FormRendererComponent],
  templateUrl: './energized-work-permit-paper-form.component.html',
  styleUrl: './energized-work-permit-paper-form.component.css'
})
export class EnergizedWorkPermitPaperFormComponent {
  currentService = inject(CurrentEnergizedWorkPermitService);
  private destroyRef = inject(DestroyRef);

  dataInput = input<EnergizedWorkPermitDto | null>(null);
  @Output() submitEvent = new EventEmitter<EnergizedWorkPermitDto>();
  @Output() changeEvent = new EventEmitter<EnergizedWorkPermitDto>();

  paperForm = toSignal(this.currentService.paperForm$, { initialValue: new PrintableFormDto() });
  dataFromService = toSignal(this.currentService.selectedPermit$, { initialValue: new EnergizedWorkPermitDto() });

  data = computed(() => this.dataInput() ?? this.dataFromService());

  fieldsWithOptions = computed(() => EnergizedWorkPermitDto.toFormFields(this.data()!));

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

  onSubmit(form: EnergizedWorkPermitDto): void {
    if (this.submitEvent.observers.length > 0) { this.submitEvent.emit(form); return; }
    this.currentService.savePermit(form);
  }
  onChange(form: EnergizedWorkPermitDto): void {
    if (this.changeEvent.observers.length > 0) { this.changeEvent.emit(form); return; }
    this.currentService.savePermit(form);
  }
}
