import { Component, Input, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Question } from '../../models/ui/question.model';
import { QaMenuComponent } from "../menu/qa-menu/qa-menu.component";

@Component({
  selector: 'app-checkbox-group',
  templateUrl: './checkbox-group.component.html',
  styleUrls: ['./checkbox-group.component.css'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CheckboxGroupComponent,
      multi: true
    }
  ],
  imports: [QaMenuComponent]
})
export class CheckboxGroupComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() options: { value: any, label: string }[] = [];
  question = input<Question | null>(null)
  showPopup = false;

  value: any[] = [];

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any[]): void {
    this.value = value || [];
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onCheckboxChange(option: { value: any, label: string }, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.value.push(option.value);
    } else {
      this.value = this.value.filter(val => val !== option.value);
    }
    this.onChange(this.value);
  }

  openPopup() {
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }
}