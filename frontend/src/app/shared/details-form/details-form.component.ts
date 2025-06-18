import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SearchableDropdownComponent } from '../searchable-dropdown/searchable-dropdown.component';
import { CheckboxGroupComponent } from '../checkbox-group/checkbox-group.component';
import { FormInputComponent } from '../form-input/form-input.component';
import { MultiSelectSearchableDropdownComponent } from '../multi-select-searchable-dropdown/multi-select-searchable-dropdown.component';
import { FileInputComponent } from '../file-input/file-input.component';
import { MultiInputComponent } from '../multi-input/multi-input.component';

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
    MultiInputComponent
  ],
})
export class DetailsFormComponent {
  @Input() fields: any[] = [];
  @Input() values: any = {};
  @Input() layout: 'row' | 'column' | 'reactive' = 'reactive';
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formDelete = new EventEmitter<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.createForm();
    console.log('this.form:', this.form);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['values'] && !changes['values'].firstChange) {
      this.updateForm();
    }
  }

  createForm() {
    console.log('Creating form with fields:', this.fields);
    console.log("values:", this.values);
    const group: { [key: string]: any[] } = {};
    this.fields.forEach((field) => {
      console.log('Field:', field);
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

  // createForm() {
  //   const group: { [key: string]: any[] } = {};
  //   this.fields.forEach((field) => {
  //     group[field.name] = [this.values[field.name] || ''];
  //   });
  //   this.form = this.fb.group(group);
  // }

  // updateForm() {
  //   if (this.form) {
  //     this.fields.forEach((field) => {
  //       if (this.form.get(field.name)) {
  //         this.form.get(field.name)!.setValue(this.values[field.name] || '');
  //       }
  //     });
  //   }
  // }

  onSubmit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const result = {...this.values}; // Start with the original object
      this.fields.forEach((field) => {
        const parts = field.name.split('.');
        let current: any = result;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        if (field.type === 'select' && typeof current[parts[parts.length - 1]] === 'object') {
          current[parts[parts.length - 1]].id = formValue[field.name];
        } else {
          current[parts[parts.length - 1]] = formValue[field.name];
        }
      });
      this.formSubmit.emit(result);
    }
  }

  onDelete() {
    this.formDelete.emit();
  }
}
