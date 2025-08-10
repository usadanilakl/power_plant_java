import { Component, computed, input, output } from '@angular/core';
import { LotoStandardDto } from '../../../models/loto/loto-standard.model';
import { FormField } from '../../../models/ui/form-field.model';
import { ReactiveFormComponent } from "../../../shared/reactive-form/reactive-form.component";

@Component({
  selector: 'app-loto-standard-form',
  imports: [ReactiveFormComponent],
  templateUrl: './loto-standard-form.component.html',
  styleUrl: './loto-standard-form.component.css'
})
export class LotoStandardFormComponent {
  values = input<LotoStandardDto>(new LotoStandardDto());
  openImage = output<void>();
  formSubmit = output<LotoStandardDto>();
  formDelete = output<void>();

  fields = computed<FormField[]>(() =>{
    return this.values().toFormFields();
  } );

  onFormSubmit(formData: LotoStandardDto) {
    this.formSubmit.emit(formData);
  }

  onFormDelete() {
    this.formDelete.emit();
  }

  onOpenImage() {
    this.openImage.emit();
  }

}
