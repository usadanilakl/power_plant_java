import { Component, computed, DestroyRef, EventEmitter, inject, Input, isSignal, Output, signal, Signal } from '@angular/core';
import { CurrentHotWorkService } from '../../../../services/current-items-services/current-hot-work.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';
import { FormRendererComponent } from "../../../form-designer/form-renderer/form-renderer.component";
import { Option } from '../../../../models/option.model';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormField } from '../../../../models/ui/form-field.model';
import { CurrentValueService } from '../../../../services/current-value.service';

@Component({
  selector: 'app-hot-work-paper-form',
  imports: [FormRendererComponent],
  templateUrl: './hot-work-paper-form.component.html',
  styleUrl: './hot-work-paper-form.component.css'
})
export class HotWorkPaperFormComponent {
  currentHotWorkService = inject(CurrentHotWorkService);
  currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  @Input() dataInput: Signal<HotWorkDto> | HotWorkDto | null = null;

  @Output() submitEvent = new EventEmitter<HotWorkDto>();
  @Output() changeEvent = new EventEmitter<HotWorkDto>();
  @Output() deleteEvent = new EventEmitter<number>();

  paperForm = toSignal(this.currentHotWorkService.paperForm$, { initialValue: new PrintableFormDto() });
  dataFromService = toSignal(this.currentHotWorkService.selectedHotWork$, { initialValue: new HotWorkDto() });
  locations = signal<Option[]>([]);



  data = computed(() => {
    if(this.dataInput){
      if(isSignal(this.dataInput))return this.dataInput();
      else return this.dataInput;
    } 
    return this.dataFromService();
  });

  fieldsWithOptions = computed(() => {
    return HotWorkDto.toFormFields(this.data(), this.locations());
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

  onSubmit(form: HotWorkDto): void {
    if(this.submitEvent.observers.length > 0){
      this.submitEvent.emit(form);
      return;
    }
    this.currentHotWorkService.createHotWork(form);
  }

  onChange(form: HotWorkDto): void {
    if(this.changeEvent.observers.length > 0){
      this.changeEvent.emit(form);
      return;
    }
    this.currentHotWorkService.saveHotWork(form);
  }
  
  private loadOptions(category: string, optionsSignal: ReturnType<typeof signal<Option[]>>) {
    this.currentValueService.getOptionsByCategory(category).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(options => {
      optionsSignal.set(options);
      this.checkFormReady();
    });
  }
  checkFormReady() {
    // throw new Error('Method not implemented.');
  }

}
