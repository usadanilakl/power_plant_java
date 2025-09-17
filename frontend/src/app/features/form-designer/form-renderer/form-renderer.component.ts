import { Component, computed, inject, input, OnChanges, output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../../../models/ui/form-field.model';
import { FormContainerDto } from '../../../models/forms/form-container.model';
import { PrintableFormDto } from '../../../models/forms/printable-form.model';
import { CommonModule } from '@angular/common';
import { ContainerContentPipe } from '../../../pipes/container-content.pipe';
import { SearchableDropdownComponent } from '../../../shared/searchable-dropdown/searchable-dropdown.component';
import { CheckboxGroupComponent } from '../../../shared/checkbox-group/checkbox-group.component';
import { RadioGroupComponent } from '../../../shared/radio-group/radio-group.component';
import { MultiSelectSearchableDropdownComponent } from '../../../shared/multi-select-searchable-dropdown/multi-select-searchable-dropdown.component';
import { FileInputComponent } from '../../../shared/file-input/file-input.component';
import { MultiInputComponent } from '../../../shared/multi-input/multi-input.component';
import { FormInputComponent } from '../../../shared/form-input/form-input.component';
import { InvisibleInputFieldComponent } from "../inputs/invisible-input-field/invisible-input-field.component";
import { RadioCheckboxesComponent } from "../inputs/radio-checkboxes/radio-checkboxes.component";
import { SquareCheckboxComponent } from "../inputs/chekcbox-x/chekcbox-x.component";
import { InvisibleSearchableSelectComponent } from "../inputs/invisible-searchable-select/invisible-searchable-select.component";

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContainerContentPipe, SearchableDropdownComponent, CheckboxGroupComponent, RadioGroupComponent, MultiSelectSearchableDropdownComponent, FileInputComponent, MultiInputComponent, FormInputComponent, InvisibleInputFieldComponent, RadioCheckboxesComponent, SquareCheckboxComponent, InvisibleSearchableSelectComponent],
  templateUrl: './form-renderer.component.html',
  styleUrl: './form-renderer.component.css'
})
export class FormRendererComponent implements OnChanges {
  formDefinition = input<PrintableFormDto | null>(null);
  formData = input<any | null>(null);
  formSubmit = output<any>();

  form: FormGroup;
  private fb = inject(FormBuilder);

  // Use computed signals for easier template binding
  // containers = computed(() => this.formDefinition()?.formContainers ?? []);
  containers = computed(() => {
    const originalContainers = this.formDefinition()?.formContainers ?? [];
    return originalContainers.map(container => {
      if (container.contentType === 'formField' && this.isFormField(container.content)) {
        const field = container.content as FormField;
        return new FormContainerDto({
          ...container,
          content: {
            ...field,
            label: '' // Set label to empty string to hide it
          }
        });
      }
      return container;
    });
  });
  sheetSize = computed(() => this.formDefinition()?.size ?? { width: 8.5, height: 11 });
  pixelsPerInch = 96;

  constructor() {
    this.form = this.fb.group({});
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formDefinition'] || changes['formData']) {
      this.createForm();
    }
  }

  // createForm() {
  //   const group: { [key: string]: any } = {};
  //   const formFields = this.getAllFormFields();

  //   formFields.forEach(field => {
  //     if (field && field.name) {
  //       let value = this.getNestedValue(this.formData(), field.name);

  //       if (field.type === 'file') {
  //         value = null;
  //       } else if (field.type === 'checkbox-group' || field.type === 'multi-select' || field.type === 'multi-input') {
  //         value = value || [];
  //       } else if (field.type === 'select' && typeof value === 'object' && value !== null) {
  //         value = value.id;
  //       }

  //       group[field.name] = [value, []]; // Add validators if needed
  //     }
  //   });

  //   this.form = this.fb.group(group);
  // }

  createForm() {
    const group: { [key: string]: any } = {};
    const formFields = this.getAllFormFields();

    formFields.forEach(field => {
      if (field && field.name) {
        let value = this.getNestedValue(this.formData(), field.name);

        if (field.type === 'file') {
          value = null;
        } else if (field.type === 'checkbox-group' || field.type === 'multi-select' || field.type === 'multi-input') {
          value = value || [];
        } else if (field.type === 'select' && typeof value === 'object' && value !== null) {
          // Assuming the object has an 'id' property to be used as the form value
          value = value.id;
        }

        // Use the new helper to create nested structure
        this.setNestedControl(group, field.name, new FormControl(value, []));
      }
    });

    this.form = this.fb.group(group);
    console.log('Form created:', this.form);
  }

  private setNestedControl(group: { [key: string]: any }, path: string, control: FormControl) {
    const pathParts = path.split('.');
    let currentGroup = group;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!currentGroup[part]) {
        currentGroup[part] = this.fb.group({});
      }
      // We need to access the controls of the FormGroup to go deeper
      currentGroup = currentGroup[part].controls || currentGroup[part];
    }

    currentGroup[pathParts[pathParts.length - 1]] = control;
  }

  getFormControl(path: string): FormControl {
    const control = this.form.get(path);
    if (!control) {
      // Return a dummy control to avoid template errors if the control doesn't exist yet
      return new FormControl();
    }
    return control as FormControl;
  }

  private getAllFormFields(): FormField[] {
    return this.containers()
      .filter(container => container.contentType === 'formField' && this.isFormField(container.content))
      .map(container => container.content as FormField);
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) {
      return null;
    }
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }

  getContainerStyles(container: FormContainerDto): any {
    const styles: any = {
      ...container.style,
      position: 'absolute',
      left: `${container.position.x}px`,
      top: `${container.position.y}px`,
      width: `${container.size.width}px`,
      height: `${container.size.height}px`,
    };

    if (this.isFormField(container.content) && container.content.style) {
      Object.assign(styles, this.getContainerStyles(container));
    }

    return styles;
  }

  getContentStyle(container: FormContainerDto): { [klass: string]: any; }|null|undefined {
    return {
      'display': 'flex',
      'justify-content': container.style.justifyContent?? 'center',
      'align-items': container.style.alignItems?? 'center',
    }
  }

  isFormField(content: any): content is FormField {
    return content && typeof content === 'object' && 'name' in content && 'type' in content;
  }

  asFormField(content: any): FormField {
    if (this.isFormField(content)) {
      return content;
    }
    // This is a type guard; actual return doesn't matter if isFormField is false.
    // But for safety, we can return a non-FormField-like object.
    return {} as FormField;
  }

  onSubmit() {
    if (this.form.valid) {
      const originalData = this.formData() || {};
      const formValue = this.form.value;
      const mergedData = this.deepMerge(originalData, formValue);
      
      console.log('Form Submitted', mergedData);
      this.formSubmit.emit(mergedData);
    } else {
      console.error('Form is invalid');
      this.form.markAllAsTouched();
    }
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

  print() {
    window.print();
  }
}