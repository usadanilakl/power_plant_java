import { Component, Input, forwardRef, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
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

  formArray = new FormArray<FormControl<any>>([]);

  onChange: (value: any[]) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(values: any[]): void {
    this.formArray.clear();
    if (Array.isArray(values)) {
      values.forEach(value => {
        this.formArray.push(new FormControl(value));
      });
    }
    // Subscribe to changes to propagate them upwards
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
    this.formArray.push(new FormControl(''));
  }

  removeItem(index: number): void {
    this.formArray.removeAt(index);
  }
}