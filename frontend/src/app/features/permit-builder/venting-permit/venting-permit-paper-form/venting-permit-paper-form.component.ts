import { Component, computed, DestroyRef, EventEmitter, inject, input, Input, isSignal, Output, signal, Signal } from '@angular/core';
import { CurrentVentingPermitService } from '../../../../services/current-items-services/current-venting-permit.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { VentingPermitDto } from '../../../../models/permits/venting-permit.model';
import { FormRendererComponent } from "../../../form-designer-refactored/form-renderer/form-renderer.component";
import { Option } from '../../../../models/option.model';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormField } from '../../../../models/ui/form-field.model';
import { CurrentValueService } from '../../../../services/current-value.service';

@Component({
  selector: 'app-venting-permit-paper-form',
  imports: [FormRendererComponent],
  templateUrl: './venting-permit-paper-form.component.html',
  styleUrl: './venting-permit-paper-form.component.css'
})
export class VentingPermitPaperFormComponent {
  currentVentingPermitService = inject(CurrentVentingPermitService);
  currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  dataInput = input<VentingPermitDto | null>(null);

  @Output() submitEvent = new EventEmitter<VentingPermitDto>();
  @Output() changeEvent = new EventEmitter<VentingPermitDto>();
  @Output() deleteEvent = new EventEmitter<number>();

  paperForm = toSignal(this.currentVentingPermitService.paperForm$, { initialValue: new PrintableFormDto() });
  dataFromService = toSignal(this.currentVentingPermitService.selectedPermit$, { initialValue: new VentingPermitDto() });
  locations = signal<Option[]>([]);



  data = computed(() => {
    if(this.dataInput()){
      return this.dataInput();
    }
    return this.dataFromService();
  });

  fieldsWithOptions = computed(() => {
    return VentingPermitDto.toFormFields(this.data()!);
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
          const fieldName = (container.content as FormField).name;
          newContainer.content = {
            ...(container.content as FormField),
            ...fieldWithOptions,
            type: (container.content as FormField).type,
            ...(fieldName === 'workArea' ? { context: { viewMode: 'both' } } : {}),
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

  onSubmit(form: VentingPermitDto): void {
    if(this.submitEvent.observers.length > 0){
      this.submitEvent.emit(form);
      return;
    }
    // createPermit returns a cold Observable -- unsubscribed, no request was ever sent, so
    // Submit silently did nothing. savePermit subscribes for us.
    this.currentVentingPermitService.savePermit(form);
  }

  onChange(form: VentingPermitDto): void {
    if(this.changeEvent.observers.length > 0){
      this.changeEvent.emit(form);
      return;
    }
    this.currentVentingPermitService.savePermit(form);
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
