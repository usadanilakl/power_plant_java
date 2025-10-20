import { Component, Input, Output, EventEmitter, forwardRef, ViewEncapsulation, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormField } from '../../../../models/ui/form-field.model';
import { InvisibleInputFieldComponent } from '../invisible-input-field/invisible-input-field.component';
import { InvisibleSearchableSelectComponent } from '../invisible-searchable-select/invisible-searchable-select.component';
import { InvisibleSearchableMultiSelectComponent } from '../invisible-searchable-multi-select/invisible-searchable-multi-select.component';
import { ChekcboxXComponent } from '../chekcbox-x/chekcbox-x.component';
import { RadioCheckboxesComponent } from '../radio-checkboxes/radio-checkboxes.component';

@Component({
  selector: 'app-nested-form-input',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    InvisibleInputFieldComponent,
    InvisibleSearchableSelectComponent,
    InvisibleSearchableMultiSelectComponent,
    ChekcboxXComponent,
    RadioCheckboxesComponent
  ],
  templateUrl: './nested-form-input.component.html',
  styleUrl: './nested-form-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NestedFormInputComponent),
      multi: true
    }
  ]
})
export class NestedFormInputComponent implements ControlValueAccessor, OnInit {
  @Input() formTemplate: PrintableFormDto | null = null;
  @Input() readOnly: boolean = false;
  @Input() formControl!: FormControl;
  @Output() valueChange = new EventEmitter<any[]>();

  formArray: FormArray;

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  constructor(private fb: FormBuilder) {
    this.formArray = this.fb.array([]);
  }

  ngOnInit() {
    const value = this.formControl.value;
    if (Array.isArray(value)) {
      this.formArray = this.fb.array(
        value.map(item => this.createFormGroup(this.formTemplate, item))
      );
    } else {
      this.formArray = this.fb.array([this.createFormGroup(this.formTemplate)]);
    }
    this.formControl.setValidators(this.formArray.validator);
    this.formControl.setValue(this.formArray.value);

    this.formArray.valueChanges.subscribe(value => {
      this.formControl.setValue(value);
      this.onChange(value);
      this.valueChange.emit(value);
    });
  }

  writeValue(value: any[]): void {
    if (Array.isArray(value)) {
      this.formArray.clear();
      value.forEach(item => {
        this.formArray.push(this.createFormGroup(this.formTemplate, item));
      });
    } else if (value === null || value === undefined) {
      this.formArray.clear();
      this.addItem();
    }
    this.formControl.setValue(this.formArray.value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  createFormGroup(formTemplate: PrintableFormDto | null, initialValue: any = {}): FormGroup {
    const group: { [key: string]: AbstractControl } = {};
    if (formTemplate && formTemplate.formContainers) {
      formTemplate.formContainers.forEach(container => {
        if (container.contentType === 'formField' && this.isFormField(container.content)) {
          const field = container.content;
          if (field.type === 'form-array') {
            // Handle nested form arrays
            group[field.name] = this.fb.array([]);
          } else {
            // For all other field types, create a FormControl
            group[field.name] = this.fb.control(initialValue[field.name] || field.initialValue || '');
          }
        }
      });
    }
    
    // Add any missing fields from initialValue that aren't in the template
    Object.keys(initialValue).forEach(key => {
      if (!group[key]) {
        group[key] = this.fb.control(initialValue[key]);
      }
    });
  
    return this.fb.group(group);
  }

  addItem(): void {
    this.formArray.push(this.createFormGroup(this.formTemplate));
    this.formControl.setValue(this.formArray.value);
  }

  removeItem(index: number): void {
    this.formArray.removeAt(index);
    this.formControl.setValue(this.formArray.value);
  }

  getFormGroup(index: number): FormGroup {
    return this.formArray.at(index) as FormGroup;
  }

  getFormControl(formGroup: FormGroup, controlName: string): FormControl {
    let control = formGroup.get(controlName);
    if (!control) {
      console.warn(`Control ${controlName} not found in form group. Creating a new one.`);
      control = new FormControl('');
      formGroup.addControl(controlName, control);
    }
    return control as FormControl;
  }

  isFormField(content: any): content is FormField {
    return content && typeof content === 'object' && 'type' in content && 'name' in content;
  }

  asFormField(content: any): FormField {
    return content as FormField;
  }

  asForm(content: any): PrintableFormDto {
    return content as PrintableFormDto;
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

  getContentStyles(container: FormContainerDto): any {
    if (!container.contentStyle) {
      return {};
    }
    const styles = { ...container.contentStyle };
    if (styles.fontSize && typeof styles.fontSize === 'number') {
      styles.fontSize = `${styles.fontSize}px`;
    }
    return styles;
  }

  getNestedValue(formValue: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], formValue);
  }
}


// import { Component, Input, forwardRef, ViewEncapsulation } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormArray, FormControl, ReactiveFormsModule, FormGroup, AbstractControl } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { InvisibleInputFieldComponent } from "../invisible-input-field/invisible-input-field.component";

// @Component({
//   selector: 'app-nested-form-input',
//   standalone: true,
//   templateUrl: './nested-form-input.component.html',
//   styleUrls: ['./nested-form-input.component.css'],
//   encapsulation: ViewEncapsulation.None,
//   providers: [
//     {
//       provide: NG_VALUE_ACCESSOR,
//       useExisting: forwardRef(() => NestedFormInputComponent),
//       multi: true
//     }
//   ],
//   imports: [CommonModule, InvisibleInputFieldComponent, ReactiveFormsModule]
// })
// export class NestedFormInputComponent implements ControlValueAccessor {
//   @Input() type: 'text' | 'date' | 'file' | 'number' | 'time' = 'text';
//   @Input() customStyle: { [key: string]: any } = {};

//   formArray = new FormArray<FormGroup>([]);
//   objectKeys: string[] = [];

//   onChange: (value: any[]) => void = () => {};
//   onTouched: () => void = () => {};

//   writeValue(values: any[]): void {
//     this.formArray.clear();
//     if (Array.isArray(values) && values.length > 0) {
//       this.objectKeys = Object.keys(values[0]);
//       values.forEach(value => {
//         const group = new FormGroup({});
//         this.objectKeys.forEach(key => {
//           group.addControl(key, new FormControl(value[key] || ''));
//         });
//         this.formArray.push(group);
//       });
//     }
//     this.formArray.valueChanges.subscribe(value => {
//       this.onChange(value);
//       this.onTouched();
//     });
//   }

//   registerOnChange(fn: any): void {
//     this.onChange = fn;
//   }

//   registerOnTouched(fn: any): void {
//     this.onTouched = fn;
//   }

//   setDisabledState?(isDisabled: boolean): void {
//     isDisabled ? this.formArray.disable() : this.formArray.enable();
//   }

//   addItem(): void {
//     const group = new FormGroup({});
//     this.objectKeys.forEach(key => {
//       group.addControl(key, new FormControl(''));
//     });
//     this.formArray.push(group);
//   }

//   removeItem(index: number): void {
//     this.formArray.removeAt(index);
//   }

//   asFormGroup(control: AbstractControl): FormGroup {
//     return control as FormGroup;
//   }

//   getFormControl(group: AbstractControl, key: string): FormControl {
//     const formGroup = this.asFormGroup(group);
//     const control = formGroup.get(key);
//     return control as FormControl;
//   }
// }