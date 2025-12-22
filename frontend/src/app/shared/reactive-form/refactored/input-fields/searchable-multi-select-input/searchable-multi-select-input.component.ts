import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  input,
  output,
  Output,
  effect,
  signal,
  DestroyRef,
  inject,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FindPipe } from '../../../../../pipes/find.pipe';
import { Option } from '../../../../../models/option.model';
import { SearchableSelectInputComponent } from '../searchable-select-input/searchable-select-input.component';

@Component({
  selector: 'app-searchable-multi-select-input',
  standalone: true,
  imports: [CommonModule, SearchableSelectInputComponent, FindPipe],
  templateUrl: './searchable-multi-select-input.component.html',
  styleUrl: './searchable-multi-select-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableMultiSelectInputComponent),
      multi: true,
    },
  ],
})
export class SearchableMultiSelectInputComponent
  implements ControlValueAccessor
{
  options = input<Option[]>([]);
  label = input<string>('');
  categoryName = input<string>('');
  closeOnSelect = input<boolean>(true);

  @Output() selectionChange = new EventEmitter<any[]>();
  addNewOption = output<string>();
  editOption = output<string>();

  private destroyRef = inject(DestroyRef);
  private elementRef = inject(ElementRef);

  selectedValues = signal<any[]>([]);
  availableOptions = signal<Option[]>([]);
  isOpen = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.updateAvailableOptions();
    });
  }

  private updateAvailableOptions() {
    const opts = this.options();
    if (opts && Array.isArray(opts)) {
      const filtered = opts.filter(
        (option) => !this.selectedValues().includes(option.value)
      );
      this.availableOptions.set(filtered);
    }
  }

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any[]): void {
    if (Array.isArray(value)) {
      const mappedValues = value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return item.id !== undefined ? item.id : item;
        } else {
          return item;
        }
      });
      this.selectedValues.set(mappedValues);
    } else {
      this.selectedValues.set([]);
    }
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
    this.isOpen.set(false);
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isOpen.update((state) => !state);
  }

  onSelect(value: any) {
    if (!this.selectedValues().includes(value)) {
      this.selectedValues.update((values) => [...values, value]);
      this.onChange(this.selectedValues());
      this.onTouched();
      this.selectionChange.emit(this.selectedValues());
      if (this.closeOnSelect()) {
        this.isOpen.set(false);
      }
    }
  }

  removeOption(value: any) {
    this.selectedValues.update((values) => values.filter((v) => v !== value));
    this.onChange(this.selectedValues());
    this.onTouched();
    this.selectionChange.emit(this.selectedValues());
  }

  filterOptions(event: any) {
    const filterValue = event.target.value.toLowerCase();
    const opts = this.options();
    if (opts && Array.isArray(opts)) {
      const filtered = opts.filter(
        (option) =>
          option.label.toLowerCase().includes(filterValue) &&
          !this.selectedValues().includes(option.value)
      );
      this.availableOptions.set(filtered);
    }
  }

  getSelectedOptionLabels(): string {
    const opts = this.options();
    const selected = this.selectedValues().map(
      (value) => opts?.find((opt) => opt.value === value)?.label || value
    );
    return selected.join(', ');
  }

  onAddNewOption() {
    this.addNewOption.emit(this.categoryName());
  }

  onEditOption() {
    this.editOption.emit(this.categoryName());
  }
}

// import { Component, EventEmitter, forwardRef, input, Input, OnChanges, OnInit, output, Output } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
// import { BehaviorSubject, combineLatest, map, Observable, startWith } from 'rxjs';
// import { SearchableSelectInputComponent } from "../searchable-select-input/searchable-select-input.component";
// import { CommonModule } from '@angular/common';
// import { FindPipe } from '../../../../../pipes/find.pipe';
// import { Option } from '../../../../../models/option.model';

// @Component({
//   selector: 'app-searchable-multi-select-input',
//   standalone: true,
//   imports: [CommonModule, SearchableSelectInputComponent, FindPipe],
//   templateUrl: './searchable-multi-select-input.component.html',
//   styleUrl: './searchable-multi-select-input.component.css',
//   providers: [
//     {
//       provide: NG_VALUE_ACCESSOR,
//       useExisting: forwardRef(() => SearchableMultiSelectInputComponent),
//       multi: true
//     }
//   ]
// })
// export class SearchableMultiSelectInputComponent implements ControlValueAccessor, OnInit, OnChanges {
//   @Input() options: Option[] | Observable<Option[]> = [];
//   @Input() label: string = '';
//   categoryName = input<string>('');

//   @Output() selectionChange = new EventEmitter<any[]>();
//   addNewOption = output<string>();
//   editOption = output<string>();

//   selectedValues: any[] = [];
//   availableOptions$: Observable<Option[]>;
//   allOptions$: Observable<Option[]>;
//   private optionsSubject = new BehaviorSubject<Option[]>([]);

//   constructor() {
//     this.allOptions$ = this.optionsSubject.asObservable();
//     this.availableOptions$ = combineLatest([
//       this.allOptions$,
//       this.optionsSubject.pipe(startWith([]))
//     ]).pipe(
//       map(([allOptions, _]) => allOptions.filter(option => !this.selectedValues.includes(option.value)))
//     );
//   }

//   ngOnInit() {
//     this.updateAvailableOptions();
//   }

//   ngOnChanges() {
//     this.updateAvailableOptions();
//   }

//   private updateAvailableOptions() {
//     if (this.options instanceof Observable) {
//         this.options.subscribe(options => {
//         this.optionsSubject.next(options);
//       });
//     } else {
//       this.optionsSubject.next(this.options);
//     }
//   }

//   onSelect(value: any) {
//     if (!this.selectedValues.includes(value)) {
//       this.selectedValues = [...this.selectedValues, value];
//       this.optionsSubject.next(this.optionsSubject.value); // Trigger filter
//       this.onChange(this.selectedValues);
//       this.onTouched();
//       this.selectionChange.emit(this.selectedValues);
//     }
//   }

//   removeOption(value: any) {
//     this.selectedValues = this.selectedValues.filter(v => v !== value);
//     this.optionsSubject.next(this.optionsSubject.value); // Trigger filter
//     this.onChange(this.selectedValues);
//     this.onTouched();
//     this.selectionChange.emit(this.selectedValues);
//   }

//   writeValue(value: any[]): void {
//     if (Array.isArray(value)) {
//       this.selectedValues = value.map(item => {
//         if (typeof item === 'object' && item !== null) {
//           // If it's an object, return the id or the entire object
//           return item.id !== undefined ? item.id : item;
//         } else {
//           // If it's a simple value (string, number, etc.), return as is
//           return item;
//         }
//       });
//       this.optionsSubject.next(this.optionsSubject.value); // Trigger filter
//     } else {
//       this.selectedValues = [];
//     }
//     console.log('Selected values after writeValue:', this.selectedValues);
//   }

//   onChange: (value: any) => void = () => {};
//   onTouched: () => void = () => {};

//   registerOnChange(fn: any): void {
//     this.onChange = fn;
//   }

//   registerOnTouched(fn: any): void {
//     this.onTouched = fn;
//   }

//   onAddNewOption() {
//     console.log(this.categoryName( ));
//     this.addNewOption.emit(this.categoryName());
//   }

//   onEditOption() {
//     console.log(this.categoryName( ));
//     this.editOption.emit(this.categoryName());
//   }

// }
