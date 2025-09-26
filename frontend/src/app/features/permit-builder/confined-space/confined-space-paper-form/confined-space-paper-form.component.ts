import { Component, computed, DestroyRef, EventEmitter, inject, input, Input, isSignal, Output, signal, Signal } from '@angular/core';
import { FormRendererComponent } from "../../../form-designer/form-renderer/form-renderer.component";
import { CurrentConfinedSpaceService } from '../../../../services/current-items-services/current-confined-space.service';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfinedSpaceDto } from '../../../../models/permits/confined-space.model';
import { CurrentValueService } from '../../../../services/current-value.service';
import { Option } from '../../../../models/option.model';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormField } from '../../../../models/ui/form-field.model';

@Component({
  selector: 'app-confined-space-paper-form',
  imports: [FormRendererComponent],
  templateUrl: './confined-space-paper-form.component.html',
  styleUrl: './confined-space-paper-form.component.css'
})
export class ConfinedSpacePaperFormComponent {
  currentConfinedSpaceService = inject(CurrentConfinedSpaceService);
  currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  dataInput= input<ConfinedSpaceDto | null>(null);

  @Output() formSubmit = new EventEmitter<ConfinedSpaceDto>();
  @Output() changeEvent = new EventEmitter<ConfinedSpaceDto>();
  @Output() deleteEvent = new EventEmitter<number>();

  paperForm = toSignal(this.currentConfinedSpaceService.paperForm$, { initialValue: new PrintableFormDto() });
  dataFromService = toSignal(this.currentConfinedSpaceService.selectedConfinedSpace$, { initialValue: new ConfinedSpaceDto() });
  locations = signal<Option[]>([]);

  data = computed(() => {
    if(this.dataInput()){
      return this.dataInput();
    } 
    return this.dataFromService();
  });

  fieldsWithOptions = computed(() => {
    return ConfinedSpaceDto.toFormFields(this.data()!, this.locations());
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

  onSubmit(form: ConfinedSpaceDto): void {
    if(this.formSubmit.observers.length > 0){
      this.formSubmit.emit(form);
      return;
    }
    this.currentConfinedSpaceService.save(form);
  }
  onChange(form: ConfinedSpaceDto): void {
    if(this.changeEvent.observers.length > 0){
      this.changeEvent.emit(form);
      return;
    }
    this.currentConfinedSpaceService.save(form);
  }

}
