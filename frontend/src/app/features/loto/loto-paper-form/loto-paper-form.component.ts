import { Component, computed, DestroyRef, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { CurrentValueService } from '../../../services/current-value.service';
import { CurrentLotoService } from '../../../services/current-items-services/current-loto.service';
import { LotoDto } from '../../../models/loto/loto.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Option } from '../../../models/option.model';
import { FormContainerDto } from '../../../models/forms/form-container.model';
import { FormField } from '../../../models/ui/form-field.model';
import { PrintableFormDto } from '../../../models/forms/printable-form.model';
import { FormRendererComponent } from "../../form-designer-refactored/form-renderer/form-renderer.component";

@Component({
  selector: 'app-loto-paper-form',
  standalone: true,
  imports: [FormRendererComponent],
  templateUrl: './loto-paper-form.component.html',
  styleUrl: './loto-paper-form.component.css'
})
export class LotoPaperFormComponent {
  currentLotoService = inject(CurrentLotoService)
  currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  dataInput= input<LotoDto | null>(null);
  /**
   * When true the form renders but never writes. The package builder mounts this component with
   * no (changeEvent) handler — unlike all six sibling paper forms — so onChange() fell through to
   * an unconditional currentLotoService.save(). Combined with the lotoPoints form-array carrying
   * no id, that save round-tripped the point list through findById(0) and wiped it. LOTO is edited
   * through its own form, which goes via the lifecycle-gated endpoints.
   */
  readOnly = input<boolean>(false);

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
    return this.dataFromService() ?? new LotoDto();
  });

  fieldsWithOptions = computed(() => {
    return LotoDto.toFormFields(this.data()!);
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
    if(this.readOnly()) return;
    if(this.formSubmit.observers.length > 0){
      this.formSubmit.emit(form);
      return;
    }
    this.currentLotoService.save([form]);
  }
  onChange(form: LotoDto): void {
    if(this.readOnly()) return;
    if(this.changeEvent.observers.length > 0){
      this.changeEvent.emit(form);
      return;
    }
    this.currentLotoService.save([form]);
  }

}
