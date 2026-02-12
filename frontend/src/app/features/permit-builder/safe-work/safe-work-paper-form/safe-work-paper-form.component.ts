import { Component, computed, DestroyRef, EventEmitter, inject, input, Input, isSignal, OnInit, Output, Signal, signal } from '@angular/core';
import { CurrentSafeWorkService } from '../../../../services/current-items-services/current-safe-work.service';
import { FormRendererComponent } from "../../../form-designer-refactored/form-renderer/form-renderer.component";
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { CurrentValueService } from '../../../../services/current-value.service';
import { Option } from '../../../../models/option.model';
import { FormField } from '../../../../models/ui/form-field.model';
import { FormContainerDto } from '../../../../models/forms/form-container.model';

@Component({
  selector: 'app-safe-work-paper-form',
  imports: [FormRendererComponent],
  templateUrl: './safe-work-paper-form.component.html',
  styleUrl: './safe-work-paper-form.component.css'
})
export class SafeWorkPaperFormComponent implements OnInit  {

  currentSafeWorkService = inject(CurrentSafeWorkService);
  currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);
  
  dataInput = input<SafeWorkDto | null>(null);

  @Output() submitEvent = new EventEmitter<SafeWorkDto>();
  @Output() changeEvent = new EventEmitter<SafeWorkDto>();
  @Output() deleteEvent = new EventEmitter<number>();


  paperForm = toSignal(this.currentSafeWorkService.paperForm$, { initialValue: new PrintableFormDto() });
  dataFromService = toSignal(this.currentSafeWorkService.selectedSafeWork$, { initialValue: new SafeWorkDto() });
  locations = signal<Option[]>([]);

  data = computed(() => {
    if(this.dataInput && this.dataInput()){
      return this.dataInput();
    } 
    return this.dataFromService();
  });

  fieldsWithOptions = computed(() => {
    return SafeWorkDto.toFormFields(this.data()!, this.locations());
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


  ngOnInit() {
    this.loadOptions('location', this.locations);
  }
  onSubmit(form: SafeWorkDto): void {
    if(this.submitEvent.observers.length > 0){
      this.submitEvent.emit(form);
      return;
    }
    this.currentSafeWorkService.saveSafeWork(form);
  }

  onChange(form: SafeWorkDto): void {
    if(this.changeEvent.observers.length > 0){
      this.changeEvent.emit(form);
      return;
    }
    this.currentSafeWorkService.saveSafeWork(form);
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
