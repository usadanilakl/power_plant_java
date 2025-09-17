import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chekcbox-x',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chekcbox-x.component.html',
  styleUrl: './chekcbox-x.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SquareCheckboxComponent),
      multi: true
    }
  ]
})
export class SquareCheckboxComponent implements ControlValueAccessor {
  value: boolean = false;
  disabled: boolean = false;

  private onChange = (value: boolean) => {};
  private onTouched = () => {};

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

  toggle(): void {
    if (!this.disabled) {
      this.value = !this.value;
      this.onChange(this.value);
      this.onTouched();
    }
  }
}
