import { Component, Input, forwardRef, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormArray, FormControl, ReactiveFormsModule, FormGroup, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InvisibleInputFieldComponent } from "../invisible-input-field/invisible-input-field.component";

@Component({
  selector: 'app-nested-form-input',
  standalone: true,
  templateUrl: './nested-form-input.component.html',
  styleUrls: ['./nested-form-input.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NestedFormInputComponent),
      multi: true
    }
  ],
  imports: [CommonModule, InvisibleInputFieldComponent, ReactiveFormsModule]
})
export class NestedFormInputComponent implements ControlValueAccessor {
  @Input() type: 'text' | 'date' | 'file' | 'number' | 'time' = 'text';
  @Input() customStyle: { [key: string]: any } = {};

  formArray = new FormArray<FormGroup>([]);
  objectKeys: string[] = [];

  onChange: (value: any[]) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(values: any[]): void {
    this.formArray.clear();
    if (Array.isArray(values) && values.length > 0) {
      this.objectKeys = Object.keys(values[0]);
      values.forEach(value => {
        const group = new FormGroup({});
        this.objectKeys.forEach(key => {
          group.addControl(key, new FormControl(value[key] || ''));
        });
        this.formArray.push(group);
      });
    }
    this.formArray.valueChanges.subscribe(value => {
      this.onChange(value);
      this.onTouched();
    });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.formArray.disable() : this.formArray.enable();
  }

  addItem(): void {
    const group = new FormGroup({});
    this.objectKeys.forEach(key => {
      group.addControl(key, new FormControl(''));
    });
    this.formArray.push(group);
  }

  removeItem(index: number): void {
    this.formArray.removeAt(index);
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  getFormControl(group: AbstractControl, key: string): FormControl {
    const formGroup = this.asFormGroup(group);
    const control = formGroup.get(key);
    return control as FormControl;
  }
}