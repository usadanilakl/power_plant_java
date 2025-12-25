import { Injectable, DestroyRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfFormField } from '../../../../models/ui/form-field.model';

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {

  /**
   * Sets up conditional validators based on field dependencies
   */
  setupConditionalValidators(
    form: FormGroup,
    fields: RfFormField[],
    destroyRef: DestroyRef
  ): void {
    fields.forEach((field) => {
      if (field.showWhen) {
        const controllingField = form.get(field.showWhen.field);
        const dependentControl = form.get(field.name);

        if (controllingField && dependentControl) {
          const updateValidators = (value: any) => {
            const shouldShow = value === field.showWhen!.value;

            if (shouldShow) {
              dependentControl.setValidators(field.validators ?? []);
            } else {
              dependentControl.clearValidators();
              dependentControl.reset(undefined, { emitEvent: false });
            }
            dependentControl.updateValueAndValidity({ emitEvent: false });
          };

          controllingField.valueChanges
            .pipe(takeUntilDestroyed(destroyRef))
            .subscribe(updateValidators);

          updateValidators(controllingField.value);
        }
      }
    });
  }

  /**
   * Validates the form and returns error messages
   */
  getFormErrors(form: FormGroup, fields: RfFormField[]): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    fields.forEach((field) => {
      const control = form.get(field.name);
      if (control && control.invalid && (control.dirty || control.touched)) {
        if (control.errors) {
          const errorKey = Object.keys(control.errors)[0];
          errors[field.name] = this.getErrorMessage(
            field.label,
            errorKey,
            control.errors[errorKey]
          );
        }
      }
    });

    return errors;
  }

  /**
   * Gets a user-friendly error message for a validation error
   */
  private getErrorMessage(fieldName: string, errorKey: string, errorValue: any): string {
    switch (errorKey) {
      case 'required':
        return `${fieldName} is required.`;
      case 'minlength':
        return `${fieldName} must be at least ${errorValue.requiredLength} characters long.`;
      case 'maxlength':
        return `${fieldName} cannot be more than ${errorValue.requiredLength} characters long.`;
      case 'email':
        return `Please enter a valid email address.`;
      case 'pastDate':
        return `Date for ${fieldName} cannot be in the past.`;
      default:
        return `Invalid input for ${fieldName}.`;
    }
  }

  /**
   * Checks if a field should be shown based on its conditions
   */
  shouldShowField(form: FormGroup, field: RfFormField): boolean {
    if (!field.showWhen) {
      return true;
    }
    const control = form.get(field.showWhen.field);
    return control ? control.value === field.showWhen.value : false;
  }
}
