import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SearchableDropdownComponent } from '../searchable-dropdown/searchable-dropdown.component';
import { CheckboxGroupComponent } from '../checkbox-group/checkbox-group.component';
import { FormInputComponent } from '../form-input/form-input.component';
import { MultiSelectSearchableDropdownComponent } from '../multi-select-searchable-dropdown/multi-select-searchable-dropdown.component';
import { FileInputComponent } from '../file-input/file-input.component';
import { MultiInputComponent } from '../multi-input/multi-input.component';
import { RadioGroupComponent } from '../radio-group/radio-group.component';
import { ValuesComponent } from "../../features/values/values.component";
import { AddValueFormComponent } from "../../features/values/add-value-form/add-value-form.component";
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-details-form',
  standalone: true,
  templateUrl: './details-form.component.html',
  styleUrls: ['./details-form.component.css'],
  imports: [
    SearchableDropdownComponent,
    CheckboxGroupComponent,
    FormInputComponent,
    ReactiveFormsModule,
    MultiSelectSearchableDropdownComponent,
    FileInputComponent,
    MultiInputComponent,
    RadioGroupComponent,
    ValuesComponent,
    AddValueFormComponent
],
})
export class DetailsFormComponent {
  @Input() fields: any[] = [];
  @Input() values: any = {};
  @Input() layout: 'row' | 'column' | 'reactive' = 'reactive';
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formDelete = new EventEmitter<void>();
  addNewSelectOption = output<void>();
  formChange = output<any>();

  isValueEditMenuOpen = signal<boolean>(false);
  isAddValueMenuOpen = signal<boolean>(false);
  selectedCategoryName = signal<string>('');

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.createForm();
    this.subscribeToFormChanges();
  }

private subscribeToFormChanges() {
  this.form.valueChanges.pipe(
    debounceTime(1000), // Adds a small delay to avoid too frequent emissions
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  ).subscribe(() => {
    this.emitFormChange();
  });
}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['values'] && !changes['values'].firstChange) {
      this.updateForm();
    }
  }

  createForm() {
    const group: { [key: string]: any[] } = {};
    this.fields.forEach((field) => {
      let value = this.getNestedValue(this.values, field.name);
      let validators = field.validators || [];
  
      // Special handling for file inputs
      if (field.type === 'file') {
        value = null; // File inputs should start empty
      }
  
      // Special handling for checkbox groups
      if (field.type === 'checkbox-group') {
        value = value || []; // Ensure it's an array
      }
  
      // Special handling for multi-select
      if (field.type === 'multi-select' || field.type === 'multi-input') {
        value = value || []; // Ensure it's an array
      }
  
      // For select fields with nested object values, use the id
      if (field.type === 'select' && typeof value === 'object' && value !== null) {
        value = value.id;
      }
  
      group[field.name] = [value, validators];
    });
    this.form = this.fb.group(group);
  }

  updateForm() {
    if (this.form) {
      this.fields.forEach((field) => {
        if (this.form.get(field.name)) {
          let value = this.getNestedValue(this.values, field.name);
          
          // Don't update file inputs
          if (field.type !== 'file') {
            // For select fields with nested object values, use the id
            if (field.type === 'select' && typeof value === 'object' && value !== null) {
              value = value.id;
            }
            this.form.get(field.name)!.setValue(value || null);
          }
        }
      });
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => {
      return prev ? prev[curr] : null;
    }, obj);
  }
  
  onSubmit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const result = {...this.values}; // Start with the original object
  
      this.fields.forEach((field) => {
        const parts = field.name.split('.');
        let current: any = result;
  
        // For nested properties
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
  
        const lastPart = parts[parts.length - 1];
  
        // Handle different field types
        if (field.type === 'select' && typeof current[lastPart] === 'object') {
          current[lastPart] = current[lastPart] || {};
          current[lastPart].id = formValue[field.name];
        } else if (field.type === 'file' && formValue[field.name] instanceof File) {
          // Handle file input
          current[lastPart] = formValue[field.name];
        } else {
          // For all other fields, including 'overrideFile'
          current[lastPart] = formValue[field.name];
        }
      });
  
      this.formSubmit.emit(result);
    }
  }

  onDelete() {
    this.formDelete.emit();
  }

  onAddNewSelectOption(name: string) {
    this.selectedCategoryName.set(name);
    this.isAddValueMenuOpen.set(true);
  }
  
  onEditSelectOption(){
    this.isValueEditMenuOpen.set(false);
  }

  closeAddValueMenu(){
    this.isAddValueMenuOpen.set(false);
  }

  private emitFormChange() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const result = this.prepareFormData(formValue);
      this.formChange.emit(result);
    }
  }
  
  private prepareFormData(formValue: any): any {
    const result = {...this.values};
  
    this.fields.forEach((field) => {
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
      } else {
        current[lastPart] = formValue[field.name];
      }
    });
  
    return result;
  }
}
