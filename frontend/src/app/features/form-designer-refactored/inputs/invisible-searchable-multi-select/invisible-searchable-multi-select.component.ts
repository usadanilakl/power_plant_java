import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subscription, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Option } from '../../../../models/option.model';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';

@Component({
  selector: 'app-invisible-searchable-multi-select',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './invisible-searchable-multi-select.component.html',
  styleUrl: './invisible-searchable-multi-select.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InvisibleSearchableMultiSelectComponent),
      multi: true,
    },
  ],
})
export class InvisibleSearchableMultiSelectComponent implements ControlValueAccessor, OnDestroy {
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Input()
  set options(value: Option[] | Observable<Option[]>) {
    this.optionsSubscription?.unsubscribe();
    const options$ = value instanceof Observable ? value : of(value);
    this.optionsSubscription = options$.subscribe(opts => {
      this._options = opts || [];
      this.filterAndSortOptions();
    });
  }
  @Output() addNew = new EventEmitter<void>();
  @Output() edit = new EventEmitter<string>();

  values: any[] = [];
  private _options: Option[] = [];
  filteredAndSortedOptions: Option[] = [];
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

  get displayValue(): string {
    if (!this.values || this.values.length === 0) return '';
    return this._options
      .filter(opt => this.values.includes(opt.value))
      .map(opt => opt.label)
      .join(', ');
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterAndSortOptions(term);
  }

  private filterAndSortOptions(searchTerm: string = ''): void {
    let filtered = this._options;
    if (searchTerm) {
      filtered = this._options.filter(o => o.label.toLowerCase().includes(searchTerm));
    }
    this.filteredAndSortedOptions = filtered.sort((a, b) => {
      const aS = this.values.includes(a.value);
      const bS = this.values.includes(b.value);
      if (aS && !bS) return -1;
      if (!aS && bS) return 1;
      return 0;
    });
  }

  writeValue(values: any[]): void {
    this.values = Array.isArray(values) ? values : [];
    this.filterAndSortOptions();
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void { this.disabled = isDisabled; }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) this.filterAndSortOptions();
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.onTouched();
  }

  toggleOption(option: Option, event: MouseEvent): void {
    event.stopPropagation();
    const index = this.values.indexOf(option.value);
    if (index > -1) {
      this.values.splice(index, 1);
    } else {
      this.values.push(option.value);
    }
    this.onChange([...this.values]);
    this.filterAndSortOptions();
  }

  isSelected(option: Option): boolean {
    return this.values.includes(option.value);
  }

  onAddNewOption(event: MouseEvent): void {
    event.stopPropagation();
    this.addNew.emit();
    this.closeDropdown();
  }

  onEditOption(event: MouseEvent): void {
    event.stopPropagation();
    this.edit.emit();
    this.closeDropdown();
  }
}
