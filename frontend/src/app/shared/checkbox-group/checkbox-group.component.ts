import { Component, Input, forwardRef, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Question } from '../../models/ui/question.model';
import { Option } from '../../models/option.model';
import { QaService } from '../../services/qa/qa.service';

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
})
export class CheckboxGroupComponent implements ControlValueAccessor {
  qaService = inject(QaService);
  @Input() label: string = '';
  @Input() options: Option[] = [];
  question = input<Question | null>(null);

  /** Unique per-instance key so option ids don't collide across groups (a <label for> otherwise targets the
   *  first element with a matching id, mis-toggling another group's box when option labels repeat). */
  private static seq = 0;
  private readonly uid = `cbg${CheckboxGroupComponent.seq++}`;
  optionId(i: number): string { return `${this.uid}-${i}`; }

  value: any = {};
  mode: 'object' | 'array' = 'object';

  onChange: any = () => {};
  onTouched: any = () => {};



  // This is the key change. writeValue determines the mode.
  writeValue(value: any): void {
    if (Array.isArray(value)) {
      this.mode = 'array';
      this.value = value || [];
    } else if (typeof value === 'object' && value !== null) {
      this.mode = 'object';
      this.value = value;
    } else {
      // Default to object mode if value is null/undefined,
      // which is common for new forms.
      this.mode = 'object';
      this.value = {};
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // onCheckboxChange(option: { value: any, label: string }, event: Event) {
  //   const checkbox = event.target as HTMLInputElement;
  //   if (checkbox.checked) {
  //     this.value.push(option.value);
  //   } else {
  //     this.value = this.value.filter(val => val !== option.value);
  //   }
  //   this.onChange(this.value);
  // }



  // The change handler now uses the mode to update the value correctly.
  onCheckboxChange(option: Option, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;

    if (this.mode === 'object') {
      this.value[option.key ?? option.label] = isChecked;
    } else { // mode === 'array'
      if (isChecked) {
        this.value = [...this.value, option.value];
      } else {
        this.value = this.value.filter((val: any) => val !== option.value);
      }
    }
    
    this.onTouched();
    console.log('Value sent to form',this.value);
    this.onChange(this.value);
  }

  onQaClick(): void {
    const q = this.question();
    if (q) this.qaService.openDialog(q);
  }

  isBoolean(value: any): boolean {
    return typeof value === 'boolean';
  }
}

