import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CopyPasteDirective } from '../../../../../directives/copy-paste.directive';

@Component({
  selector: 'app-multi-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule, CopyPasteDirective],
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
    // Update the value at the specific index
    this.values[index] = newValue;
    // Emit a NEW array reference so change detection works properly
    this.emitChange();
  }

  onInputBlur() {
    this.onTouched();
    this.valuesChange.emit([...this.values]);
    this.ensureMinimumInputs();
  }

  addValue() {
    this.values = [...this.values, ''];
    this.emitChange();
  }

  removeValue(index: number) {
    this.values = this.values.filter((_, i) => i !== index);
    this.ensureMinimumInputs();
    this.emitChange();
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
      this.values = [''];
    }
  }

  private emitChange(): void {
    // Always emit a new array reference for proper change detection
    const valuesCopy = [...this.values];
    this.onChange(valuesCopy);
    this.valuesChange.emit(valuesCopy);
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
