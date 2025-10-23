
import { Component, Input, output, OnDestroy, OnInit, OnChanges, SimpleChanges, inject, computed, input } from '@angular/core';
import { FormArray, ReactiveFormsModule, FormGroup, FormBuilder, AbstractControl, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormField } from '../../../../models/ui/form-field.model';
import { InvisibleInputFieldComponent } from '../invisible-input-field/invisible-input-field.component';
import { InvisibleSearchableSelectComponent } from '../invisible-searchable-select/invisible-searchable-select.component';
import { InvisibleSearchableMultiSelectComponent } from '../invisible-searchable-multi-select/invisible-searchable-multi-select.component';
import { ChekcboxXComponent } from '../chekcbox-x/chekcbox-x.component';
import { RadioCheckboxesComponent } from '../radio-checkboxes/radio-checkboxes.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-nested-form-input',
  standalone: true,
  templateUrl: './nested-form-input.component.html',
  styleUrls: ['./nested-form-input.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InvisibleInputFieldComponent,
    InvisibleSearchableSelectComponent,
    InvisibleSearchableMultiSelectComponent,
    ChekcboxXComponent,
    RadioCheckboxesComponent
  ]
})
export class NestedFormInputComponent implements OnInit, OnDestroy {
  formField = input<FormField>();
  formArray = input<FormArray>(new FormArray<AbstractControl>([]));
  @Input() fieldName: string = '';

  itemAdded = output<FormGroup>();
  itemRemoved = output<{ index: number; fieldName: string }>();

  formTemplate = computed<PrintableFormDto>(() => {return this.formField()?.nestedForm as PrintableFormDto; });

  private fb = inject(FormBuilder);

  pixelsPerInch = 96;

  ngOnInit(): void {

  }

  getFormGroupsForCurrentContainer(): AbstractControl[] {
    // console.log('Current formArray:', this.formArray());
    const startIndex = this.formField()?.arrayIndexRange?.start;
    const endIndex = this.formField()?.arrayIndexRange?.end;
    const groups = this.formArray().controls.slice(startIndex, endIndex);
    console.log(`Groups for container ${startIndex}-${endIndex}:`, groups);
    return groups;
  }

  addItem(): void {
    const newGroup = this.createFormGroup();
    this.formArray().push(newGroup);
    
    this.itemAdded.emit(newGroup);
  }
  
  
  
  removeItem(index: number): void {
    const startIndex = this.formField()?.arrayIndexRange?.start ?? 0;
    const actualIndex = startIndex + index;
  
    if (actualIndex < 0 || actualIndex >= this.formArray().length) {
      console.warn(`Invalid index: ${actualIndex} (array length: ${this.formArray().length})`);
      return;
    }
  
    console.log(`Requesting removal at absolute index: ${actualIndex} (relative index: ${index})`);
    console.log('Current array length:', this.formArray().length);
    console.log('Item to be removed:', this.formArray().at(actualIndex)?.value);
    console.log('Full array before removal:', this.formArray().value);
    
    // Just emit the event - parent will handle the actual removal
    this.itemRemoved.emit({ 
      index: actualIndex, 
      fieldName: this.fieldName 
    });
  }

  getSheetSize(): { width: number; height: number } {
    return this.formTemplate()?.size || { width: 8.5, height: 11 };
  }

  getContainers(): FormContainerDto[] {
    return this.formTemplate()?.formContainers || [];
  }

  private createFormGroup(data: any = {}): FormGroup {
    const group: { [key: string]: any } = {};
    const fields = this.getAllFormFields();
  
    fields.forEach(field => {
      if (field && field.name) {
        let value = data[field.name];
  
        if (field.type === 'file') {
          value = null;
        } else if (field.type === 'checkbox-group' || field.type === 'multi-select') {
          value = value || [];
        } else if (field.type === 'select' && typeof value === 'object' && value !== null) {
          value = value.id;
        }
  
        group[field.name] = new FormControl(value || null, field.validators || []);
      }
    });
  
    return this.fb.group(group);
  }

  private getAllFormFields(): FormField[] {
    if (!this.formTemplate()) return [];
    
    const containers = this.formTemplate().formContainers || [];
    return containers
      .filter(c => c.contentType === 'formField' && this.isFormField(c.content))
      .map(c => c.content as FormField);
  }

  getFormControl(formGroup: FormGroup, path: string): FormControl {
    const control = formGroup.get(path);
    if (!control) {
      console.warn(`Form control not found: ${path}. Adding it to the form group.`);
      const newControl = new FormControl(null);
      formGroup.addControl(path, newControl);
      return newControl;
    }
    return control as FormControl;
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
      Object.assign(styles, container.content.style);
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

  isFormField(content: any): content is FormField {
    return content && typeof content === 'object' && 'type' in content && 'name' in content;
  }

  asFormField(content: any): FormField {
    return content as FormField;
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}

// import { Component, Input, forwardRef, ViewEncapsulation, OnInit } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormArray, FormControl, ReactiveFormsModule, FormGroup, AbstractControl, FormBuilder } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
// import { FormContainerDto } from '../../../../models/forms/form-container.model';
// import { FormField } from '../../../../models/ui/form-field.model';
// import { InvisibleInputFieldComponent } from '../invisible-input-field/invisible-input-field.component';
// import { InvisibleSearchableSelectComponent } from '../invisible-searchable-select/invisible-searchable-select.component';
// import { InvisibleSearchableMultiSelectComponent } from '../invisible-searchable-multi-select/invisible-searchable-multi-select.component';
// import { ChekcboxXComponent } from '../chekcbox-x/chekcbox-x.component';
// import { RadioCheckboxesComponent } from '../radio-checkboxes/radio-checkboxes.component';

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
//   imports: [
//     CommonModule, 
//     ReactiveFormsModule,
//     InvisibleInputFieldComponent,
//     InvisibleSearchableSelectComponent,
//     InvisibleSearchableMultiSelectComponent,
//     ChekcboxXComponent,
//     RadioCheckboxesComponent
//   ]
// })
// export class NestedFormInputComponent implements ControlValueAccessor, OnInit {
//   @Input() type: 'text' | 'date' | 'file' | 'number' | 'time' = 'text';
//   @Input() customStyle: { [key: string]: any } = {};
//   @Input() formTemplate: PrintableFormDto | null = null;

//   formArray = new FormArray<FormGroup>([]);
//   pixelsPerInch = 96;

//   onChange: (value: any[]) => void = () => {};
//   onTouched: () => void = () => {};

//   constructor(private fb: FormBuilder) {}

//   ngOnInit(): void {
//     // Subscribe to form array changes
//     this.formArray.valueChanges.subscribe(value => {
//       this.onChange(value);
//       this.onTouched();
//     });
//   }

//   writeValue(values: any[]): void {
//     this.formArray.clear();
    
//     if (Array.isArray(values) && values.length > 0) {
//       values.forEach(value => {
//         const group = this.createFormGroupFromTemplate(value);
//         this.formArray.push(group);
//       });
//     } else if (!values || values.length === 0) {
//       // Add one empty form by default
//       this.addItem();
//     }
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

//   /**
//    * Creates a FormGroup based on the formTemplate's containers
//    */
//   private createFormGroupFromTemplate(initialValue: any = {}): FormGroup {
//     const group: { [key: string]: AbstractControl } = {};

//     if (this.formTemplate && this.formTemplate.formContainers) {
//       this.formTemplate.formContainers.forEach(container => {
//         if (container.contentType === 'formField' && this.isFormField(container.content)) {
//           const field = container.content as FormField;
//           const controlKey = container.formControlKey || field.name;
          
//           if (field.type === 'form-array') {
//             // Handle nested form arrays
//             group[controlKey] = this.fb.array([]);
//           } else {
//             // Get initial value from provided data or field's initial value
//             const value = this.getNestedValue(initialValue, controlKey) ?? field.initialValue ?? '';
//             group[controlKey] = this.fb.control(value, field.validators);
//           }
//         }
//       });
//     }

//     // Add any additional fields from initialValue that aren't in the template
//     Object.keys(initialValue).forEach(key => {
//       if (!group[key]) {
//         group[key] = this.fb.control(initialValue[key]);
//       }
//     });

//     return this.fb.group(group);
//   }

//   addItem(): void {
//     const group = this.createFormGroupFromTemplate();
//     this.formArray.push(group);
//   }

//   removeItem(index: number): void {
//     this.formArray.removeAt(index);
//   }

//   getFormGroup(index: number): FormGroup {
//     return this.formArray.at(index) as FormGroup;
//   }

//   getFormControl(formGroup: FormGroup, controlName: string): FormControl {
//     let control = formGroup.get(controlName);
//     if (!control) {
//       console.warn(`Control ${controlName} not found in form group. Creating a new one.`);
//       control = new FormControl('');
//       formGroup.addControl(controlName, control);
//     }
//     return control as FormControl;
//   }

//   /**
//    * Get containers for the form template
//    */
//   getContainers(): FormContainerDto[] {
//     return this.formTemplate?.formContainers ?? [];
//   }

//   /**
//    * Get sheet size for rendering
//    */
//   getSheetSize(): { width: number; height: number } {
//     return this.formTemplate?.size ?? { width: 8.5, height: 11 };
//   }

//   /**
//    * Get container styles for positioning
//    */
//   getContainerStyles(container: FormContainerDto): any {
//     return {
//       ...container.style,
//       position: 'absolute',
//       left: `${container.position.x}px`,
//       top: `${container.position.y}px`,
//       width: `${container.size.width}px`,
//       height: `${container.size.height}px`,
//     };
//   }

//   /**
//    * Get content styles
//    */
//   getContentStyles(container: FormContainerDto): any {
//     if (!container.contentStyle) {
//       return {};
//     }
//     const styles = { ...container.contentStyle };
//     if (styles.fontSize && typeof styles.fontSize === 'number') {
//       styles.fontSize = `${styles.fontSize}px`;
//     }
//     return styles;
//   }

//   /**
//    * Type guard for FormField
//    */
//   isFormField(content: any): content is FormField {
//     return content && typeof content === 'object' && 'type' in content && 'name' in content;
//   }

//   /**
//    * Type assertion for FormField
//    */
//   asFormField(content: any): FormField {
//     return content as FormField;
//   }

//   /**
//    * Type assertion for FormGroup
//    */
//   asFormGroup(control: AbstractControl): FormGroup {
//     return control as FormGroup;
//   }

//   /**
//    * Get nested value from object using dot notation
//    */
//   private getNestedValue(obj: any, path: string): any {
//     if (!obj || !path) return undefined;
//     return path.split('.').reduce((acc, part) => acc?.[part], obj);
//   }
// }

// import { Component, Input, forwardRef, ViewEncapsulation } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormArray, FormControl, ReactiveFormsModule, FormGroup, AbstractControl } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { InvisibleInputFieldComponent } from "../invisible-input-field/invisible-input-field.component";
// import { PrintableFormDto } from '../../../../models/forms/printable-form.model';

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
//   @Input() formTemplate: PrintableFormDto | null = null;

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