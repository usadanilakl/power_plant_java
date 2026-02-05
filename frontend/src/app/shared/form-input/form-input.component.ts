import { Component, Input, Output, EventEmitter, forwardRef, ViewEncapsulation, input, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Question } from '../../models/ui/question.model';
import { CommonModule } from '@angular/common';
import { QaService } from '../../services/qa/qa.service';

@Component({
  selector: 'app-form-input',
  standalone: true,
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true
    }
  ],
  imports: [CommonModule]
})
export class FormInputComponent implements ControlValueAccessor {
  qaService = inject(QaService);
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() value: any = '';
  @Input() customStyle: { [key: string]: any } = {};
  @Output() valueChange = new EventEmitter<any>();
  question = input<Question | null>(null);

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

  onQaClick(): void {
    const q = this.question();
    if (q) this.qaService.openDialog(q);
  }
}
