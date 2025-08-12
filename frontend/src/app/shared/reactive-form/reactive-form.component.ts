import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { AddValueFormComponent } from "../../features/values/add-value-form/add-value-form.component";
import { SearchableDropdownComponent } from "../searchable-dropdown/searchable-dropdown.component";
import { CheckboxGroupComponent } from "../checkbox-group/checkbox-group.component";
import { RadioGroupComponent } from "../radio-group/radio-group.component";
import { MultiSelectSearchableDropdownComponent } from "../multi-select-searchable-dropdown/multi-select-searchable-dropdown.component";
import { FileInputComponent } from "../file-input/file-input.component";
import { MultiInputComponent } from "../multi-input/multi-input.component";
import { FormInputComponent } from "../form-input/form-input.component";
import { ValueFormComponent } from "../../features/values/value-form/value-form.component";

@Component({
  selector: 'app-reactive-form',
  standalone: true,
  imports: [AddValueFormComponent, SearchableDropdownComponent, CheckboxGroupComponent, RadioGroupComponent, MultiSelectSearchableDropdownComponent, FileInputComponent, MultiInputComponent, FormInputComponent,
    ReactiveFormsModule, ValueFormComponent],
  templateUrl: './reactive-form.component.html',
  styleUrls: ['./reactive-form.component.css']
})
export class ReactiveFormComponent {
  fields = input<any[]>([]);
  values = input<any>({});
  layout = input<'row' | 'column' | 'reactive'>('reactive');
  formSubmit = output<any>();
  formDelete = output<void>();
  addNewSelectOption = output<string>();

  isValueEditMenuOpen = signal<boolean>(false);
  isAddValueMenuOpen = signal<boolean>(false);
  selectedCategoryName = signal<string>('');
  formErrors = signal<{ [key: string]: string }>({});

  form = signal<FormGroup | null>(null);


  constructor(private fb: FormBuilder) {
    effect(() => {
      this.createForm();
    });
  }

  createForm() {
    const group: { [key: string]: any[] } = {};
    this.fields().forEach((field) => {
      let value = this.getNestedValue(this.values(), field.name);
      let validators = this.getValidators(field.validators);
  
      if (field.type === 'file') {
        value = null;
      }
  
      if (field.type === 'checkbox-group' || field.type === 'multi-select' || field.type === 'multi-input') {
        value = value || [];
      }
  
      if (field.type === 'select' && typeof value === 'object' && value !== null) {
        value = value.id;
      }
  
      group[field.name] = [value, validators];
    });
    const form = this.fb.group(group);
    form.valueChanges.subscribe(() => this.onValueChanged(form));
    this.form.set(form);
  }
  
  private getValidators(validators: (string | ValidatorFn)[] = []): ValidatorFn[] {
    return validators.map(validator => {
      if (typeof validator === 'function') {
        return validator as ValidatorFn;
      }
      switch (validator) {
        case 'required':
          return Validators.required;
        case 'email':
          return Validators.email;
        // Add more cases for other validators as needed
        default:
          console.warn(`Unknown validator: ${validator}`);
          return null;
      }
    }).filter(Boolean) as ValidatorFn[];
  }

  onValueChanged(form: FormGroup) {
    if (!form) return;
  
    const errors: { [key: string]: string } = {};
    for (const field of this.fields()) {
      const control = form.get(field.name);
      if (control && (control.dirty || control.touched) && !control.valid) {
        errors[field.name] = '';
        for (const key in control.errors) {
          if (control.errors.hasOwnProperty(key)) {
            errors[field.name] += this.getValidatorErrorMessage(key, control.errors[key]) + ' ';
          }
        }
      }
    }
    this.formErrors.set(errors);
  }

  getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
    const messages: { [key: string]: string } = {
      'required': 'This field is required.',
      'email': 'Invalid email address.',
      // Add more error messages for other validators
    };
    return messages[validatorName] || `Unknown error: ${validatorName}`;
  }



  updateForm = computed(() => {
    const form = this.form();
    if (form) {
      this.fields().forEach((field) => {
        if (form.get(field.name)) {
          let value = this.getNestedValue(this.values(), field.name);
          
          if (field.type !== 'file') {
            if (field.type === 'select' && typeof value === 'object' && value !== null) {
              value = value.id;
            }
            form.get(field.name)!.setValue(value || null);
          }
        }
      });
    }
    return form;
  });

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => {
      return prev ? prev[curr] : null;
    }, obj);
  }

  onSubmit() {
    const form = this.form();
    if (form) {
      Object.keys(form.controls).forEach(key => {
        const control = form.get(key);
        control?.markAsTouched();
      });
    }

    if (form && form.valid) {
      const formValue = form.value;
      const result = {...this.values()};
  
      this.fields().forEach((field) => {
        const parts = field.name.split('.');
        let current: any = result;
  
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
  
        const lastPart = parts[parts.length - 1];
  
        if (field.type === 'select' && typeof current[lastPart] === 'object') {
          current[lastPart] = current[lastPart] || {};
          current[lastPart].id = formValue[field.name];
        } else if (field.type === 'file' && formValue[field.name] instanceof File) {
          current[lastPart] = formValue[field.name];
        } else if (field.type === 'multi-input' || field.type === 'multi-select' || field.type === 'checkbox-group') {
          // Ensure these types remain as arrays
          current[lastPart] = formValue[field.name];
          console.log('Multi-select or multi-input fields:', current[lastPart]);
        } else {
          current[lastPart] = formValue[field.name];
        }
      });

      console.log('Form submitted:', result);
  
      this.formSubmit.emit(result);
    }else if(form){
        this.onValueChanged(form!);
    }
  }

  onDelete() {
    this.formDelete.emit();
  }

  onAddNewSelectOption(name: string) {
    this.selectedCategoryName.set(name);
    this.isAddValueMenuOpen.set(true);
  }

  onEditSelectOption(name: string) {
    this.selectedCategoryName.set(name);
    this.isValueEditMenuOpen.set(true);
  }

  closeAddValueMenu() {
    this.isAddValueMenuOpen.set(false);
  }

  closeEditMenu(){
    this.isValueEditMenuOpen.set(false);
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    return false;
  }

  getCurrentFormValues() {
    const currentForm = this.form();
    if (currentForm) {
      return currentForm.value;
    }
    return null;
  }



}
