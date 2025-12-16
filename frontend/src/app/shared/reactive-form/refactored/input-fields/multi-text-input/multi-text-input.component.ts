import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-multi-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule,],
  templateUrl: './multi-text-input.component.html',
  styleUrl: './multi-text-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiTextInputComponent),
      multi: true
    }
  ]
})
export class MultiTextInputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type: string = 'text';
  
  @Output() valuesChange = new EventEmitter<any[]>();

  values: any[] = [''];  // Initialize with an empty string

  onValueChange(index: number, newValue: any) {
    this.onChange(this.values);
  }

  onInputBlur() {
    this.onTouched();
    this.valuesChange.emit(this.values);
    this.ensureMinimumInputs();
  }

  addValue() {
    this.values.push('');
    this.onChange(this.values);
    this.valuesChange.emit(this.values);
  }
  
  removeValue(index: number) {
    this.values.splice(index, 1);
    this.ensureMinimumInputs();
    this.onChange(this.values);
    this.valuesChange.emit(this.values);
  }

  writeValue(value: any[]): void {
    if (Array.isArray(value) && value.length > 0) {
      this.values = [...value];
    } else {
      this.values = [''];  // Initialize with an empty string if no values
    }
    this.ensureMinimumInputs();
  }

  ensureMinimumInputs(): void {
    if (this.values.length === 0) {
      this.values.push('');
    }
  }

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

}
