import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-input.component.html',
  styleUrl: './text-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true
    }
  ],
})
export class TextInputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() value: any = '';
  @Input() customStyle: { [key: string]: any } = {};
  @Output() valueChange = new EventEmitter<any>();

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    if (value !== undefined) {
      this.value = value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInputChange(event: any) {
    const target = event.target;
    let value: any;

    switch (this.type) {
      case 'checkbox':
        value = target.checked;
        break;
      case 'number':
        // Use valueAsNumber for a direct numeric value, or null if empty/invalid.
        value = target.value === '' ? null : target.valueAsNumber;
        break;
      default: // 'text', 'date', 'time', 'radio', etc.
        value = target.value;
        break;
    }

    this.value = value;
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
  }
}

