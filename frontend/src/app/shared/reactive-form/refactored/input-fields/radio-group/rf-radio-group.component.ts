import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-rf-radio-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rf-radio-group.component.html',
  styleUrl: './rf-radio-group.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RfRadioGroupComponent),
      multi: true
    }
  ]
})
export class RfRadioGroupComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() options: { value: any, label: string }[] = [];
  @Input() name: string = '';

  value: any;

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onRadioChange(option: { value: any, label: string }) {
    this.value = option.value;
    this.onChange(this.value);
    this.onTouched();
  }
}
