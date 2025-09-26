import { Component, computed, DestroyRef, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { CurrentValueService } from '../../../services/current-value.service';
import { CurrentLotoService } from '../../../services/current-items-services/current-loto.service';
import { LotoDto } from '../../../models/loto/loto.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Option } from '../../../models/option.model';
import { FormContainerDto } from '../../../models/forms/form-container.model';
import { FormField } from '../../../models/ui/form-field.model';
import { PrintableFormDto } from '../../../models/forms/printable-form.model';

@Component({
  selector: 'app-loto-paper-form',
  standalone: true,
  imports: [],
  templateUrl: './loto-paper-form.component.html',
  styleUrl: './loto-paper-form.component.css'
})
export class LotoPaperFormComponent {
  currentLotoService = inject(CurrentLotoService)
  currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  dataInput= input<LotoDto | null>(null);

  @Output() formSubmit = new EventEmitter<LotoDto>();
  @Output() changeEvent = new EventEmitter<LotoDto>();
  @Output() deleteEvent = new EventEmitter<number>();

  paperForm = toSignal(this.currentLotoService.paperForm$, { initialValue: new PrintableFormDto() });
  dataFromService = toSignal(this.currentLotoService.currentLoto$, { initialValue: new LotoDto() });
  locations = signal<Option[]>([]);

  data = computed(() => {
    if(this.dataInput()){
      return this.dataInput();
    } 
    return this.dataFromService();
  });

  fieldsWithOptions = computed(() => {
    return LotoDto.toFormFields(this.data()!, []);
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

  onSubmit(form: LotoDto): void {
    if(this.formSubmit.observers.length > 0){
      this.formSubmit.emit(form);
      return;
    }
    this.currentLotoService.save(form);
  }
  onChange(form: LotoDto): void {
    if(this.changeEvent.observers.length > 0){
      this.changeEvent.emit(form);
      return;
    }
    this.currentLotoService.save(form);
  }

}
