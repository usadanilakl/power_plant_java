import { Component, EventEmitter, Input, Output, forwardRef, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormInputComponent } from '../form-input/form-input.component';

@Component({
  selector: 'app-multi-input',
  standalone: true,
  imports: [CommonModule, FormsModule, FormInputComponent],
  templateUrl: `./multi-input.component.html`,
  styleUrls: ['./multi-input.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiInputComponent),
      multi: true
    }
  ]
})
export class MultiInputComponent implements ControlValueAccessor, OnInit {
  @Input() label: string = '';
  @Input() type: string = 'text';
  
  @Output() valuesChange = new EventEmitter<any[]>();

  values: any[] = [];

  ngOnInit() {
    // Initialize component if needed
  }

  onValueChange(index: number, newValue: any) {
    this.values[index] = newValue;
    this.onChange(this.values);
    this.valuesChange.emit(this.values);
  }

  addValue() {
    this.values.push('');
    this.onChange(this.values);
    this.valuesChange.emit(this.values);
  }
  
  removeValue(index: number) {
    this.values.splice(index, 1);
    this.onChange(this.values);
    this.valuesChange.emit(this.values);
  }

  writeValue(value: any[]): void {
    if (Array.isArray(value)) {
      this.values = [...value];
    } else {
      this.values = [];
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