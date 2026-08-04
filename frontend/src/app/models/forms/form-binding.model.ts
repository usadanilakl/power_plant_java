import { Signal } from '@angular/core';
import { PrintableFormDto } from './printable-form.model';

/**
 * Pairs a printable-form layout with the data that fills it and a submit handler.
 * Relocated here from the retired form-designer `form-binder` component, which was dead apart
 * from this type.
 */
export interface FormBinding {
  formDefinition: PrintableFormDto;
  formData: Signal<any>;
  onSubmit: (formData: any) => void;
}
