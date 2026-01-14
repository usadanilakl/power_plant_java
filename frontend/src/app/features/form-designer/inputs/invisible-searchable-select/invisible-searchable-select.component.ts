import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Option } from '../../../../models/option.model';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';

@Component({
  selector: 'app-invisible-searchable-select',
  standalone: true,
  imports: [CommonModule, MatIconModule, OverlayModule],
  templateUrl: './invisible-searchable-select.component.html',
  styleUrl: './invisible-searchable-select.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InvisibleSearchableSelectComponent),
      multi: true
    }
  ]
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
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 5,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -5,
    }
  ];

  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnDestroy(): void {
    this.optionsSubscription?.unsubscribe();
  }

  private updateSelectedOption() {
    if (this.value && this._options.length > 0) {
      this.selectedOption = this._options.find(opt => opt.value === this.value) || null;
    } else {
      this.selectedOption = null;
    }
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredOptions = this._options.filter(option =>
      option.label.toLowerCase().includes(term)
    );
  }

  writeValue(value: any): void {
    this.value = value;
    this.updateSelectedOption();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        // Reset filter when opening
        this.filteredOptions = this._options;
      }
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
    if (this.value) {
      this.edit.emit(this.value);
    }
    this.closeDropdown();
  }
}

// import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, SimpleChanges, forwardRef, input } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
// import { Observable, of, Subscription, take } from 'rxjs';
// import { MatIconModule } from '@angular/material/icon';
// import { CommonModule } from '@angular/common';
// import { CopyPasteDirective } from '../../../../directives/copy-paste.directive';
// import { Option } from '../../../../models/option.model';
// import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';

// @Component({
//   selector: 'app-invisible-searchable-select',
//   standalone: true,
//   imports: [CommonModule, MatIconModule, CopyPasteDirective, OverlayModule],
//   templateUrl: './invisible-searchable-select.component.html',
//   styleUrl: './invisible-searchable-select.component.css',
//   providers: [
//     {
//       provide: NG_VALUE_ACCESSOR,
//       useExisting: forwardRef(() => InvisibleSearchableSelectComponent),
//       multi: true
//     }
//   ]
// })
// export class InvisibleSearchableSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {

//   @Input() label: string = '';
//   @Input() options: Option[] | Observable<Option[]> = [];
//   @Input() closeOnSelect = true;
//   categoryName = input<string>('');
//   @Output() valueChange = new EventEmitter<any>();
//   @Output() addNewOption = new EventEmitter<string>();
//   @Output() editOption = new EventEmitter<string>();

//   private optionsSubscription: Subscription | null = null;
//   selectedOption: Option | null = null;
//   private _options: Option[] = [];

//   value: any;
//   isOpen = false;
//   filteredOptions: Option[] = [];

//   // Positions for the overlay panel
//   positions: ConnectedPosition[] = [
//     {
//       originX: 'start',
//       originY: 'bottom',
//       overlayX: 'start',
//       overlayY: 'top',
//       offsetY: 4,
//     },
//     {
//       originX: 'start',
//       originY: 'top',
//       overlayX: 'start',
//       overlayY: 'bottom',
//       offsetY: -4,
//     }
//   ];


//   constructor(private elementRef: ElementRef) {}

//   ngOnInit() {
//     this.setupOptionsObservable();
//   }

//   ngOnChanges(changes: SimpleChanges) {
//     if (changes['options']) {
//       this.setupOptionsObservable();
//     }
//   }

//   ngOnDestroy() {
//     if (this.optionsSubscription) {
//       this.optionsSubscription.unsubscribe();
//     }
//   }

//   private setupOptionsObservable() {
//     if (this.optionsSubscription) {
//       this.optionsSubscription.unsubscribe();
//     }
//     const options$ = this.options instanceof Observable ? this.options : of(this.options);
//     this.optionsSubscription = options$.subscribe(
//       (newOptions: Option[]) => {
//         this._options = newOptions;
//         this.filteredOptions = newOptions;
//         this.updateSelectedOption(newOptions);
//       }
//     );
//   }


//   onChange: (value: any) => void = () => {};
//   onTouched: () => void = () => {};

//   writeValue(value: any): void {
//     this.value = value;
//     this.updateSelectedOption();
//   }
  
//   private updateSelectedOption(options?: Option[]) {
//     const opts = options || this._options;
//     this.selectedOption = opts.find(opt => opt.value === this.value) || null;
//   }

//   registerOnChange(fn: any): void {
//     this.onChange = fn;
//   }

//   registerOnTouched(fn: any): void {
//     this.onTouched = fn;
//   }

//   // @HostListener('document:click', ['$event'])
//   // onDocumentClick(event: MouseEvent) {
//   //   if (!this.elementRef.nativeElement.contains(event.target)) {
//   //     this.closeDropdown();
//   //   }
//   // }

//   closeDropdown() {
//     this.isOpen = false;
//   }
//   toggleDropdown(event: Event) {
//     event.stopPropagation();
//     this.isOpen = !this.isOpen;
//     if (!this.isOpen) return;

//     this.filteredOptions = this._options;
//   }

//   selectOption(option: Option, event: Event) {
//     event.stopPropagation();
//     this.value = option.value;
//     this.selectedOption = option;
//     this.onChange(this.value);
//     if(this.closeOnSelect)this.isOpen = false;
//     this.valueChange.emit(this.value);
//   }

//   filterOptions(event: any) {
//     const filterValue = event.target.value.toLowerCase();
//     this.filteredOptions = this._options.filter(option =>
//       option.label.toLowerCase().includes(filterValue)
//     );
//   }

//   onAddNewOption(event: Event) {
//     event.stopPropagation();
//     this.addNewOption.emit(this.categoryName());
//   }
  

//   onEditOption(event: Event) {
//     event.stopPropagation();
//     this.editOption.emit(this.categoryName());
//   }
// }
