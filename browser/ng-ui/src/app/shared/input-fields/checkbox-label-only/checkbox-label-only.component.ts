import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-checkbox-label-only',
  standalone: true,
  imports: [],
  templateUrl: './checkbox-label-only.component.html',
  styleUrl: './checkbox-label-only.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxLabelOnlyComponent),
      multi: true
    }
  ]
})
export class CheckboxLabelOnlyComponent  implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() id: string = '';

  value: boolean = false;
  disabled: boolean = false;

  onChange: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = !!value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleValue(): void {
    if (!this.disabled) {
      this.value = !this.value;
      this.onChange(this.value);
      this.onTouched();
    }
  }
}
