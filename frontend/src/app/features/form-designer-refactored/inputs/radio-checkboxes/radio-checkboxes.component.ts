import { NgFor } from '@angular/common';
import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-radio-checkboxes',
  standalone: true,
  imports: [FormsModule, NgFor],
  templateUrl: './radio-checkboxes.component.html',
  styleUrl: './radio-checkboxes.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioCheckboxesComponent),
      multi: true,
    },
  ],
})
export class RadioCheckboxesComponent implements ControlValueAccessor {
  options = input<any[]>([true, false]);
  name = input<string>('square-radio-group');

  value: any;
  disabled = false;

  private onChange = (value: any) => {};
  private onTouched = () => {};

  writeValue(value: any): void { this.value = value; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void { this.disabled = isDisabled; }

  selectOption(option: any): void {
    if (!this.disabled) {
      this.value = option;
      this.onChange(this.value);
      this.onTouched();
    }
  }
}
