import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkbox-x',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkbox-x.component.html',
  styleUrl: './checkbox-x.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxXComponent),
      multi: true,
    },
  ],
})
export class CheckboxXComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() id: string = '';
  value: boolean = false;
  disabled: boolean = false;

  onChange: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void { this.value = !!value; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void { this.disabled = isDisabled; }

  toggle(newValue: boolean): void {
    if (!this.disabled) {
      this.value = newValue;
      this.onChange(this.value);
      this.onTouched();
    }
  }
}
