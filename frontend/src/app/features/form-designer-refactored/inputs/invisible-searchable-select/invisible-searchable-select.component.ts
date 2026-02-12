import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Option } from '../../../../models/option.model';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';

@Component({
  selector: 'app-invisible-searchable-select',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './invisible-searchable-select.component.html',
  styleUrl: './invisible-searchable-select.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InvisibleSearchableSelectComponent),
      multi: true,
    },
  ],
})
export class InvisibleSearchableSelectComponent implements ControlValueAccessor, OnDestroy {
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Input()
  set options(value: Option[] | Observable<Option[]>) {
    this.optionsSubscription?.unsubscribe();
    if (value instanceof Observable) {
      this.optionsSubscription = value.subscribe(opts => {
        this._options = opts;
        this.filteredOptions = opts;
        this.updateSelectedOption();
      });
    } else {
      this._options = value || [];
      this.filteredOptions = value || [];
      this.updateSelectedOption();
    }
  }
  @Output() addNew = new EventEmitter<void>();
  @Output() edit = new EventEmitter<string>();

  value: string | null = null;
  private _options: Option[] = [];
  filteredOptions: Option[] = [];
  selectedOption: Option | null = null;
  private optionsSubscription: Subscription | undefined;

  isOpen = false;
  positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 5 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -5 },
  ];

  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnDestroy(): void {
    this.optionsSubscription?.unsubscribe();
  }

  private updateSelectedOption(): void {
    if (this.value && this._options.length > 0) {
      this.selectedOption = this._options.find(opt => opt.value === this.value) || null;
    } else {
      this.selectedOption = null;
    }
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredOptions = this._options.filter(o => o.label.toLowerCase().includes(term));
  }

  writeValue(value: any): void {
    this.value = value;
    this.updateSelectedOption();
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void { this.disabled = isDisabled; }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) this.filteredOptions = this._options;
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.onTouched();
  }

  selectOption(option: Option, event: MouseEvent): void {
    event.stopPropagation();
    this.value = option.value;
    this.selectedOption = option;
    this.onChange(this.value);
    this.closeDropdown();
  }

  onAddNewOption(event: MouseEvent): void {
    event.stopPropagation();
    this.addNew.emit();
    this.closeDropdown();
  }

  onEditOption(event: MouseEvent): void {
    event.stopPropagation();
    if (this.value) this.edit.emit(this.value);
    this.closeDropdown();
  }
}
