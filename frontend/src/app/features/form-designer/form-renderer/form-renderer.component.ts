import { Component, computed, inject, input, OnChanges, SimpleChanges } from '@angular/core';
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

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContainerContentPipe, SearchableDropdownComponent, CheckboxGroupComponent, RadioGroupComponent, MultiSelectSearchableDropdownComponent, FileInputComponent, MultiInputComponent, FormInputComponent],
  templateUrl: './form-renderer.component.html',
  styleUrl: './form-renderer.component.css'
})
export class FormRendererComponent implements OnChanges {
  formDefinition = input<PrintableFormDto | null>(null);
  formData = input<any | null>(null);

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
          value = value.id;
        }

        group[field.name] = [value, []]; // Add validators if needed
      }
    });

    this.form = this.fb.group(group);
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
    console.log('Form Submitted', this.form.value);
    // Here you can emit the form value or handle submission
  }

  print() {
    window.print();
  }
}