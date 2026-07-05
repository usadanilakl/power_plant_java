import { Component, computed, DestroyRef, effect, inject, Input, input, output, Signal, signal } from '@angular/core';
import { AddValueFormComponent } from '../../../features/values/add-value-form/add-value-form.component';
import { SearchableDropdownComponent } from '../../searchable-dropdown/searchable-dropdown.component';
import { CheckboxGroupComponent } from '../../checkbox-group/checkbox-group.component';
import { RadioGroupComponent } from '../../radio-group/radio-group.component';
import { MultiSelectSearchableDropdownComponent } from '../../multi-select-searchable-dropdown/multi-select-searchable-dropdown.component';
import { FileInputComponent } from '../../file-input/file-input.component';
import { MultiInputComponent } from '../../multi-input/multi-input.component';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { FormInputComponent } from '../../form-input/form-input.component';
import { ValueFormComponent } from '../../../features/values/value-form/value-form.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, FormFieldGroup } from '../../../models/ui/form-field.model';
import { CheckboxOnlyLabelComponent } from "../../checkbox-only-label/checkbox-only-label.component";
import { WorkAreaSelectComponent } from '../../../features/permit-builder/work-area/components/work-area-select/work-area-select.component';
import { WorkAreaDto } from '../../../models/permits/work-area.model';

@Component({
  selector: 'app-smart-form',
  standalone: true,
  imports: [
    AddValueFormComponent,
    SearchableDropdownComponent,
    CheckboxGroupComponent,
    RadioGroupComponent,
    MultiSelectSearchableDropdownComponent,
    FileInputComponent,
    MultiInputComponent,
    FormInputComponent,
    ReactiveFormsModule,
    ValueFormComponent,
    CheckboxOnlyLabelComponent,
    WorkAreaSelectComponent,
],
  templateUrl: './smart-form.component.html',
  styleUrl: './smart-form.component.css'
})
export class SmartFormComponent {
  fields = input<any[]>([]);
  @Input() values: Signal<any> = signal({});
  layout = input<'row' | 'column' | 'reactive'>('column');
  groupLayout = input<'row' | 'column' | 'reactive' | 'grid'>('grid');
  title = input<string>('');
  submitButtonText = input<string>('Submit');
  deleteButtonText = input<string>('');


  formSubmit = output<any>();
  formDelete = output<void>();
  addNewSelectOption = output<string>();
  formValueChange = output<any>();

  destroyRef = inject(DestroyRef);

  isValueEditMenuOpen = signal<boolean>(false);
  isAddValueMenuOpen = signal<boolean>(false);
  selectedCategoryName = signal<string>('');
  formErrors = signal<{ [key: string]: string }>({});


  Object = Object;
  groupedFields = computed(() => {
    const allFields = this.fields();
    const groupsMap: { [key: string]: FormField[] } = {};

    allFields.forEach(field => {
      const groupLabel = field.group?.label || 'Ungrouped';
      if (!groupsMap[groupLabel]) {
        groupsMap[groupLabel] = [];
      }
      groupsMap[groupLabel].push(field);
    });

    return groupsMap;
  });


  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
    effect(() => {
      this.createForm();
    });

    effect(() => {
      const data = this.values(); // re-run when form data changes
      if (data && this.form) {
        this.form.patchValue(data, { emitEvent: false });
      }
    });
  }

   createForm() {
    const group: { [key: string]: any } = {};
    const formFields = this.fields();

    formFields.forEach(field => {
      // Display-only reference image — no form control, no value.
      if (field && field.type === 'image') return;
      if (field && field.name) {
        let value = this.getNestedValue(this.values(), field.name);

        if (field.type === 'file') {
          value = null;
        } else if (field.type === 'checkbox-group' || field.type === 'multi-select' || field.type === 'multi-input') {
          value = value || [];
        } else if (field.type === 'select' && typeof value === 'object' && value !== null) {
          // Assuming the object has an 'id' property to be used as the form value
          value = value.id;
        }

        if (field.type === 'date' && !value) {
          value = new Date().toISOString().split('T')[0];
        }

        if (field.type === 'time' && !value) {
          value = new Date().toTimeString().slice(0, 5)
        }

        // Use the new helper to create nested structure
        this.setNestedControl(group, field.name, new FormControl(value, []));
      }
    });

    this.form = this.fb.group(group);
    
    this.form.valueChanges.pipe(
      debounceTime(1000), // Wait for 300ms of inactivity before emitting
      distinctUntilChanged(), // Only emit if the value has changed
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(currentValue => {
      // console.log('Form value changed: ', currentValue);
      const originalData = this.values() || {};
      const formValue = this.form.value;
      const mergedData = this.deepMerge(originalData, formValue);
      this.formValueChange.emit(mergedData);
    });
  }

  private setNestedControl(group: { [key: string]: any }, path: string, control: FormControl) {
    const pathParts = path.split('.');
    let currentGroup: any = group;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!currentGroup[part]) {
        currentGroup[part] = this.fb.group({});
      }
      currentGroup = currentGroup[part];
    }

    const lastPart = pathParts[pathParts.length - 1];
    if (currentGroup instanceof FormGroup) {
      currentGroup.addControl(lastPart, control);
    } else {
      currentGroup[lastPart] = control;
    }
  }

  getFormControl(path: string): FormControl {
    const control = this.form.get(path);
    if (!control) {
      // Return a dummy control to avoid template errors if the control doesn't exist yet
      return new FormControl();
    }
    return control as FormControl;
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
  
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
  
    return output;
  }

  private isObject(item: any): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
  
  // private getValidators(validators: (string | ValidatorFn)[] = []): ValidatorFn[] {
  //   return validators.map(validator => {
  //     if (typeof validator === 'function') {
  //       return validator as ValidatorFn;
  //     }
  //     switch (validator) {
  //       case 'required':
  //         return Validators.required;
  //       case 'email':
  //         return Validators.email;
  //       // Add more cases for other validators as needed
  //       default:
  //         console.warn(`Unknown validator: ${validator}`);
  //         return null;
  //     }
  //   }).filter(Boolean) as ValidatorFn[];
  // }

  // onValueChanged(form: FormGroup) {
  //   if (!form) return;
  
  //   const errors: { [key: string]: string } = {};
  //   for (const field of this.fields()) {
  //     const control = form.get(field.name);
  //     if (control && (control.dirty || control.touched) && !control.valid) {
  //       errors[field.name] = '';
  //       for (const key in control.errors) {
  //         if (control.errors.hasOwnProperty(key)) {
  //           errors[field.name] += this.getValidatorErrorMessage(key, control.errors[key]) + ' ';
  //         }
  //       }
  //     }
  //   }
  //   this.formErrors.set(errors);
  // }

  // getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
  //   const messages: { [key: string]: string } = {
  //     'required': 'This field is required.',
  //     'email': 'Invalid email address.',
  //     // Add more error messages for other validators
  //   };
  //   return messages[validatorName] || `Unknown error: ${validatorName}`;
  // }



  // updateForm = computed(() => {
  //   const form = this.form;
  //   if (form) {
  //     this.fields().forEach((field) => {
  //       const control = form.get(field.name.split('.'));
  //       if (control) {
  //         let value = this.getNestedValue(this.values(), field.name);
          
  //         if (field.type !== 'file') {
  //           if (field.type === 'select' && typeof value === 'object' && value !== null) {
  //             value = value.id;
  //           }
  //           control.setValue(value || null);
  //         }
  //       }
  //     });
  //   }
  //   return form;
  // });

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) {
      return null;
    }
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }



  onSubmit() {
    if (this.form.valid) {
      const originalData = this.values() || {};
      const formValue = this.form.value;
      const mergedData = this.deepMerge(originalData, formValue);

      this.formSubmit.emit(mergedData);
    } else {
      console.error('Form is invalid');
      this.form.markAllAsTouched();
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

  /**
   * Handle work area selection - auto-apply constant hazards to hazard fields.
   * Maps constantHazards properties to hazards.X form controls.
   */
  onWorkAreaSelected(workArea: WorkAreaDto | null): void {
    if (!workArea?.constantHazards) return;

    const hazards = workArea.constantHazards;
    const patch: { [key: string]: boolean } = {};

    // For each hazard property that is true, set the corresponding hazards.X control
    Object.entries(hazards).forEach(([key, value]) => {
      if (typeof value === 'boolean' && value) {
        const control = this.form.get(`hazards.${key}`);
        if (control) {
          patch[key] = true;
        }
      }
    });

    // Patch the hazards FormGroup if it exists
    const hazardsGroup = this.form.get('hazards');
    if (hazardsGroup && Object.keys(patch).length > 0) {
      hazardsGroup.patchValue(patch);
    }
  }

  getCurrentFormValues() {
    const currentForm = this.form;
    if (currentForm) {
      return currentForm.value;
    }
    return null;
  }
  // updateFormValues(newValues: any) {
  //   const form = this.form;
  //   if (form) {
  //     this.fields().forEach((field) => {
  //       const control = form.get(field.name.split('.'));
  //       if (control) {
  //         let value = this.getNestedValue(newValues, field.name);
          
  //         if (field.type !== 'file') {
  //           if (field.type === 'select' && typeof value === 'object' && value !== null) {
  //             value = value.id;
  //           }
  //           control.setValue(value || null);
  //         }
  //       }
  //     });
  //     form.updateValueAndValidity();
  //   }
  // }


}
