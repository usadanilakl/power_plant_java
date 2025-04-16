import { Component, ElementRef, EventEmitter, HostListener, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FindPipe } from "../../pipes/find.pipe";
import { Option } from '../../models/option.model';

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
  @Input() options: Option[] = [];

  @Output() valueChange = new EventEmitter<any>();

  value: any;
  isOpen = false;
  filteredOptions: Option[] = [];

  constructor(private elementRef: ElementRef) {}


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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  closeDropdown() {
    this.isOpen = false;
  }

  // Modify toggleDropdown to prevent immediate closure
  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    this.filteredOptions = this.options;
  }

  // Modify selectOption to stop propagation
  selectOption(option: any, event: Event) {
    event.stopPropagation();
    this.value = option.value;
    this.onChange(this.value);
    this.isOpen = false;
    this.valueChange.emit(this.value);
  }

  filterOptions(event: any) {
    const filterValue = event.target.value.toLowerCase();
    this.filteredOptions = this.options.filter(option => 
      option.label.toLowerCase().includes(filterValue)
    );
  }
}