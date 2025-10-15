import { Component, computed, DestroyRef, effect, inject, Input, input, output, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FormField } from '../../../models/inputs/form-field.model';
import { SearchableSelectInputComponent } from "../../input-fields/searchable-select-input/searchable-select-input.component";
import { ChekcboxGroupComponent } from "../../input-fields/chekcbox-group/chekcbox-group.component";
import { CheckboxLabelOnlyComponent } from "../../input-fields/checkbox-label-only/checkbox-label-only.component";
import { RadioGroupComponent } from "../../input-fields/radio-group/radio-group.component";
import { SearchableMultiSelectInputComponent } from "../../input-fields/searchable-multi-select-input/searchable-multi-select-input.component";
import { MultiTextInputComponent } from "../../input-fields/multi-text-input/multi-text-input.component";
import { FormInputComponent } from "../../input-fields/form-input/form-input.component";

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
    FormInputComponent
],
  templateUrl: './reactive-form.component.html',
  styleUrl: './reactive-form.component.css'
})
export class ReactiveFormComponent {
  fields = input<any[]>([]);
  entity = input<any>({});
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
      const data = this.entity(); // re-run when form data changes
      if (data && this.form) {
        this.form.patchValue(data, { emitEvent: false });
      }
    });
  }

   createForm() {
    const group: { [key: string]: any } = {};
    const formFields = this.fields();

    formFields.forEach(field => {
      if (field && field.name) {
        let value = this.getNestedValue(this.entity(), field.name);

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
      const originalData = this.entity() || {};
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
      console.error('Form is invalid');
      this.form.markAllAsTouched();
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

}
