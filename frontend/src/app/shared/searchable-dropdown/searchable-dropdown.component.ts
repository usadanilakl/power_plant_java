import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FindPipe } from "../../pipes/find.pip";

@Component({
  selector: 'app-searchable-dropdown',
  templateUrl: './searchable-dropdown.component.html',
  styleUrls: ['./searchable-dropdown.component.css'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SearchableDropdownComponent,
      multi: true
    }
  ],
  imports: [FindPipe]
})
export class SearchableDropdownComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() options: { value: any, label: string }[] = [];

  value: any;
  isOpen = false;
  filteredOptions: any[] = [];

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.filteredOptions = this.options;
  }

  selectOption(option: any) {
    this.value = option.value;
    this.onChange(this.value);
    this.isOpen = false;
  }

  filterOptions(event: any) {
    const filterValue = event.target.value.toLowerCase();
    this.filteredOptions = this.options.filter(option => 
      option.label.toLowerCase().includes(filterValue)
    );
  }
}