import { Component, input, output, Signal } from '@angular/core';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { FormRendererComponent } from "../../form-renderer/form-renderer.component";

export interface FormBinding {
  formDefinition: PrintableFormDto;
  formData: Signal<any>;
  onSubmit: (formData: any) => void;
}

@Component({
  selector: 'app-form-binder',
  standalone: true,
  imports: [FormRendererComponent],
  templateUrl: './form-binder.component.html',
  styleUrl: './form-binder.component.css'
})
export class FormBinderComponent {
  formBindings = input<FormBinding[]>([]);
  formSubmit = output<any>();

  onFormSubmit(formData: any, binding: FormBinding) {
    binding.onSubmit(formData);
  }

}
