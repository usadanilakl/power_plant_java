import { Component, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Option } from '../../../models/inputs/option.model';

@Component({
  selector: 'app-chekcbox-group',
  standalone: true,
  imports: [],
  templateUrl: './chekcbox-group.component.html',
  styleUrl: './chekcbox-group.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ChekcboxGroupComponent,
      multi: true
    }
  ],
})
export class ChekcboxGroupComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() options: Option[] = [];
  showPopup = false;

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

  isBoolean(value: any): boolean {
    return typeof value === 'boolean';
  }
}
