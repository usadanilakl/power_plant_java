import { Component, computed, DestroyRef, effect, inject, Input, input, output, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FormField } from '../../../models/inputs/form-field.model';
import { SearchableSelectInputComponent } from "../../input-fields/searchable-select-input/searchable-select-input.component";
import { ChekcboxGroupComponent } from "../../input-fields/chekcbox-group/chekcbox-group.component";
import { CheckboxLabelOnlyComponent } from "../../input-fields/checkbox-label-only/checkbox-label-only.component";
import { RadioGroupComponent } from "../../input-fields/radio-group/radio-group.component";
import { SearchableMultiSelectInputComponent } from "../../input-fields/searchable-multi-select-input/searchable-multi-select-input.component";
import { MultiTextInputComponent } from "../../input-fields/multi-text-input/multi-text-input.component";
import { FormInputComponent } from "../../input-fields/form-input/form-input.component";
import { FormArrayInputComponent } from "../../input-fields/form-array-input/form-array-input.component";
import { FileInputComponent } from "../../input-fields/file-input/file-input.component";
import { SignatureInputComponent } from "../../input-fields/signature-input/signature-input.component";
import { WorkAreaMapSelectComponent } from "../work-area-map-select/work-area-map-select.component";
import { EquipmentPickerComponent } from "../equipment-picker/equipment-picker.component";
import { MaximoTreePickerComponent } from "../../../features/maximo/maximo-tree-picker.component";

@Component({
  selector: 'app-reactive-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SearchableSelectInputComponent,
    ChekcboxGroupComponent,
    CheckboxLabelOnlyComponent,
    RadioGroupComponent,
    SearchableMultiSelectInputComponent,
    MultiTextInputComponent,
    FormInputComponent,
    FormArrayInputComponent,
    FileInputComponent,
    SignatureInputComponent,
    WorkAreaMapSelectComponent,
    EquipmentPickerComponent,
    MaximoTreePickerComponent,
],
  templateUrl: './reactive-form.component.html',
  styleUrl: './reactive-form.component.css'
})
export class ReactiveFormComponent {
  fields = input<FormField[]>([]);
  entity = input<any>({});
  layout = input<'row' | 'column' | 'reactive'>('column');
  groupLayout = input<'row' | 'column' | 'reactive' | 'grid'>('grid');
  title = input<string>('');
  submitButtonText = input<string>('Submit');
  deleteButtonText = input<string>('');
  showAddEditOption = input<boolean>(true);


  formSubmit = output<any>();
  formDelete = output<void>();
  addNewSelectOption = output<string>();
  formValueChange = output<any>();

  destroyRef = inject(DestroyRef);

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

    console.log('groupedFields', groupsMap);

    return groupsMap;
  });


  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
    effect(() => {
      this.createForm();
    });

    effect(() => {
      const data = this.entity();
      if (data && this.form) {
        this.form.patchValue(data, { emitEvent: false });
      }
    });
  }

  //  createForm() {
  //   const group: { [key: string]: any } = {};
  //   const formFields = this.fields();

  //   formFields.forEach(field => {
  //     if (field && field.name) {
  //       let value = this.getNestedValue(this.entity(), field.name);

  //       if (field.type === 'file') {
  //         value = null;
  //       } else if (field.type === 'checkbox-group' || field.type === 'multi-select' || field.type === 'multi-input') {
  //         value = value || [];
  //       } else if (field.type === 'select' && typeof value === 'object' && value !== null) {
  //         // Assuming the object has an 'id' property to be used as the form value
  //         value = value.id;
  //       }

  //       if (field.type === 'date' && !value) {
  //         value = new Date().toISOString().split('T')[0];
  //       }

  //       if (field.type === 'time' && !value) {
  //         value = new Date().toTimeString().slice(0, 5)
  //       }

  //       // Use the new helper to create nested structure
  //       this.setNestedControl(group, field.name, new FormControl(value, field.validators || []));
  //     }
  //   });

  //   this.form = this.fb.group(group);
  //   this.setupConditionalValidators();
    
  //   this.form.valueChanges.pipe(
  //     debounceTime(1000), // Wait for 300ms of inactivity before emitting
  //     distinctUntilChanged(), // Only emit if the value has changed
  //     takeUntilDestroyed(this.destroyRef)
  //   ).subscribe(currentValue => {
  //     // console.log('Form value changed: ', currentValue);
  //     const originalData = this.entity() || {};
  //     const formValue = this.form.value;
  //     const mergedData = this.deepMerge(originalData, formValue);
  //     this.formValueChange.emit(mergedData);
  //   });
  // }

  createForm() {
    const group: { [key: string]: any } = {};
    const formFields = this.fields();

    formFields.forEach(field => {
      if (field && field.name) {
        if (field.type === 'form-array') {
          // Handle FormArray
          const arrayData = this.getNestedValue(this.entity(), field.name) || [];
          const formArray = this.fb.array(
            arrayData.map((item: any) => this.createArrayItem(field.fields ?? [], item))
          );
          this.setNestedControl(group, field.name, formArray);

        } else {
          let value = this.getNestedValue(this.entity(), field.name);

          if (field.type === 'file') {
            value = field.initialValue ?? null;
          } else if (field.type === 'checkbox-group' || field.type === 'multi-select' || field.type === 'multi-input') {
            value = value || [];
          } else if (field.type === 'select' && typeof value === 'object' && value !== null) {
            value = value.id;
          }

          if (field.type === 'date' && !value) {
            value = new Date().toISOString().split('T')[0];
          }

          if (field.type === 'time' && !value) {
            value = new Date().toTimeString().slice(0, 5);
          }

          this.setNestedControl(group, field.name, new FormControl(value, field.validators || []));
        }
      }
    });

    this.form = this.fb.group(group);
    this.setupConditionalValidators();
    
    this.form.valueChanges.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(currentValue => {
      const originalData = this.entity() || {};
      const formValue = this.form.value;
      const mergedData = this.deepMerge(originalData, formValue);
      this.formValueChange.emit(mergedData);
      console.log('Form value changed: ', currentValue);
    });
  }

  private createArrayItem(fields: FormField[], data: any = {}): FormGroup {
    const group = this.fb.group({});
    fields.forEach(field => {
      const value = data[field.name] ?? field.initialValue ?? '';
      group.addControl(field.name, this.fb.control(value, field.validators));
    });
    return group;
  }

  getFormArray(name: string): FormArray {
    return this.form.get(name) as FormArray;
  }

  addArrayItem(arrayName: string, fields: FormField[]) {
    const formArray = this.getFormArray(arrayName);
    if (formArray) {
      formArray.push(this.createArrayItem(fields));
      this.form.markAsDirty();
    }
  }

  removeArrayItem(arrayName: string, index: number) {
    const formArray = this.getFormArray(arrayName);
    if (formArray) {
      formArray.removeAt(index);
      this.form.markAsDirty();
    }
  }

  shouldShowField(field: FormField): boolean {
    if (!field.showWhen) {
      return true; // Always show if no condition is set
    }
    const control = this.form.get(field.showWhen.field);
    return control ? control.value === field.showWhen.value : false;
  }

  private setupConditionalValidators(): void {
    this.fields().forEach(field => {
      if (field.showWhen) {
        const controllingField = this.form.get(field.showWhen.field);
        const dependentControl = this.form.get(field.name);

        if (controllingField && dependentControl) {
          // Function to update validators based on controlling field's value
          const updateValidators = (value: any) => {
            if (this.shouldShowField(field)) {
              dependentControl.setValidators(field.validators ?? []);
            } else {
              dependentControl.clearValidators();
              dependentControl.reset(undefined, { emitEvent: false }); // Reset value when hidden
            }
            dependentControl.updateValueAndValidity({ emitEvent: false });
          };

          // Subscribe to changes and automatically unsubscribe on component destruction
          controllingField.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
          ).subscribe(updateValidators);

          // Run the check once initially
          updateValidators(controllingField.value);
        }
      }
    });
  }

  // private setNestedControl(group: { [key: string]: any }, path: string, control: FormControl) {
  //   const pathParts = path.split('.');
  //   let currentGroup: any = group;

  //   for (let i = 0; i < pathParts.length - 1; i++) {
  //     const part = pathParts[i];
  //     if (!currentGroup[part]) {
  //       currentGroup[part] = this.fb.group({});
  //     }
  //     currentGroup = currentGroup[part];
  //   }

  //   const lastPart = pathParts[pathParts.length - 1];
  //   if (currentGroup instanceof FormGroup) {
  //     currentGroup.addControl(lastPart, control);
  //   } else {
  //     currentGroup[lastPart] = control;
  //   }
  // }

  // getFormControl(path: string): FormControl {
  //   const control = this.form.get(path);
  //   if (!control) {
  //     // Return a dummy control to avoid template errors if the control doesn't exist yet
  //     return new FormControl();
  //   }
  //   return control as FormControl;
  // }

  private setNestedControl(group: { [key: string]: any }, path: string, control: FormControl | FormArray) {
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
    if (!control || !(control instanceof FormControl)) {
      // Return a dummy control to avoid template errors if the control doesn't exist or is not a FormControl
      return new FormControl();
    }
    return control as FormControl;
  }

  /**
   * Bridge the MaximoTreePicker's (selection) EventEmitter into the reactive form's
   * FormControl for the given field. The picker doesn't implement ControlValueAccessor,
   * so we manually push its emitted {assetnum, location} value into the form. Consumers
   * unpack maximoLocation + maximoAssetnum from that object on submit.
   */
  onMaximoTreePicked(fieldName: string, event: { assetnum: string; location: string }): void {
    this.form.get(fieldName)?.setValue(event);
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        const sourceValue = source[key];
        const targetValue = target[key];

        // Merge recursively ONLY when BOTH sides are objects. The old check was
        // `isObject(sourceValue) && targetValue` — that was truthy on a STRING targetValue,
        // which then recursed into `deepMerge(string, object)`. The nested call did
        // `output = { ...target }` on the string, producing a char-indexed object like
        // {0:'P',1:'U',2:'M',3:'P',...} and losing every property from the source object.
        // Symptom: the PWA equipment-picker emits {id, tagNumber, ...} on select but the
        // entity carried the previous tag as a plain string, so the merged value came back
        // as garbage {0:'O',1:'L',2:'D',...} — buildPayload then extracted `.tagNumber`
        // (undefined) and shipped an empty equipmentTag, so the backend no-op'd. Verified
        // via code trace 2026-08-18.
        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          output[key] = this.deepMerge(targetValue, sourceValue);
        } else if (targetValue instanceof Date && typeof sourceValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sourceValue)) {
          // If target is a Date and source is a date-string, convert it back to a Date object.
          // This handles the case where a date picker returns a string.
          const [year, month, day] = sourceValue.split('-').map(Number);
          output[key] = new Date(year, month - 1, day);
        } else {
          // Source wins on any type mismatch (including string→object which the recursive
          // branch above used to corrupt). This is the correct "merge" semantic: the form's
          // fresh value replaces the entity's stale value at this leaf.
          output[key] = sourceValue;
        }
      });
    }

    return output;
  }

  // private isObject(item: any): boolean {
  //   return (item && typeof item === 'object' && !Array.isArray(item));
  // }

  private isObject(item: any): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Date));
  }
  

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) {
      return null;
    }
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }



  onSubmit() {
    if (this.form.valid) {
      const originalData = this.entity() || {};
      const formValue = this.form.value;
      const mergedData = this.deepMerge(originalData, formValue);
      this.formSubmit.emit(mergedData);
    } else {
      this.form.markAllAsTouched();
      this.updateFormErrors();
      this.scrollToFirstError();
    }
  }

  onDelete() {
    this.formDelete.emit();
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    return false;
  }

  getCurrentFormValues() {
    const currentForm = this.form;
    if (currentForm) {
      return currentForm.value;
    }
    return null;
  }

  private scrollToFirstError(): void {
    const errors = this.formErrors();
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const el = document.getElementById('field-' + firstErrorField);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  private updateFormErrors() {
    const errors: { [key: string]: string } = {};
    this.fields().forEach(field => {
      const control = this.form.get(field.name);
      if (control && control.invalid && (control.dirty || control.touched)) {
        if (control.errors) {
          const errorKey = Object.keys(control.errors)[0];
          errors[field.name] = this.getErrorMessage(field.label, errorKey, control.errors[errorKey]);
        }
      }
    });
    this.formErrors.set(errors);
  }

  private getErrorMessage(fieldName: string, errorKey: string, errorValue: any): string {
    switch (errorKey) {
      case 'required':
        return `${fieldName} is required. Put NA if not applicable.`;
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

}
