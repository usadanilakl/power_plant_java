import { Component, EventEmitter, Input, Output, SimpleChanges, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchableDropdownComponent } from '../searchable-dropdown/searchable-dropdown.component';
import { FindPipe } from "../../pipes/find.pipe";

@Component({
  selector: 'app-multi-select-searchable-dropdown',
  standalone: true,
  imports: [CommonModule, SearchableDropdownComponent, FindPipe],
  templateUrl: './multi-select-searchable-dropdown.component.html',
  styleUrl: './multi-select-searchable-dropdown.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectSearchableDropdownComponent),
      multi: true
    }
  ]
})
export class MultiSelectSearchableDropdownComponent implements ControlValueAccessor {
  @Input() options: { value: any, label: string }[] = [];
  @Input() label: string = '';
  
  @Output() selectionChange = new EventEmitter<any[]>();

  selectedValues: any[] = [];
  availableOptions: { value: any, label: string }[] = [];

  onChange: any = () => {};
  onTouched: any = () => {};

  ngOnInit() {
    this.updateAvailableOptions();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['options']) {
      this.updateAvailableOptions();
    }
  }

  private updateAvailableOptions() {
    this.availableOptions = this.options.filter(option => 
      !this.selectedValues.includes(option.value)
    );
  }

  onSelect(value: any) {
    if (!this.selectedValues.includes(value)) {
      this.selectedValues = [...this.selectedValues, value];
      this.updateAvailableOptions();
      this.onChange(this.selectedValues);
      this.onTouched();
      this.selectionChange.emit(this.selectedValues);
    }
  }
  
  removeOption(value: any) {
    this.selectedValues = this.selectedValues.filter(v => v !== value);
    this.updateAvailableOptions();
    this.onChange(this.selectedValues);
    this.onTouched();
    this.selectionChange.emit(this.selectedValues);
  }

  writeValue(value: any[]): void {
    if (Array.isArray(value)) {
      this.selectedValues = [...value];
      this.updateAvailableOptions();
    } else {
      this.selectedValues = [];
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
