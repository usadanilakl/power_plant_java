
import { Component, Input, forwardRef, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Question } from '../../models/ui/question.model';
import { QaService } from '../../services/qa/qa.service';

@Component({
  selector: 'app-radio-group',
  templateUrl: './radio-group.component.html',
  styleUrls: ['./radio-group.component.css'],
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true
    }
  ]
})
export class RadioGroupComponent implements ControlValueAccessor {
  qaService = inject(QaService);
  @Input() label: string = '';
  @Input() options: { value: any, label: string }[] = [];
  @Input() name: string = '';
  question = input<Question | null>(null);

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

  onQaClick(): void {
    const q = this.question();
    if (q) this.qaService.openDialog(q);
  }
}