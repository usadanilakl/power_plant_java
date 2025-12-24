import {
  Component,
  input,
  output,
  signal,
  ViewChild,
  TemplateRef,
  inject,
  effect,
  forwardRef,
  ElementRef,
  HostListener,
  DestroyRef,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-searchable-select-input',
  templateUrl: './searchable-select-input.component.html',
  styleUrl: './searchable-select-input.component.css',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectInputComponent),
      multi: true,
    },
  ],
})
export class SearchableSelectInputComponent
  implements ControlValueAccessor
{
  @ViewChild('dropdownTemplate') dropdownTemplate!: TemplateRef<any>;

  // Display-related inputs
  label = input<string>('');
  categoryName = input<string>('');
  closeOnSelect = input<boolean>(true);

  // Options can be array or Observable
  options = input<any[] | Observable<any[]>>([]);

  // Internal state
  isOpen = signal(false);
  filteredOptions = signal<any[]>([]);
  searchTerm = signal<string>('');
  private internalValue = signal<any>(null);
  private optionsSubscription: Subscription | null = null;

  // Outputs
  addNewOption = output<string>();
  editOption = output<string>();
  valueChange = output<any>();

  // CVA callbacks
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  // Overlay plumbing
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private elementRef = inject(ElementRef);
  private destroyRef = inject(DestroyRef);
  private overlayRef: OverlayRef | null = null;

  // COMPUTED - for template display
  selectedDisplay = computed(() => {
    const value = this.internalValue();
    const opts = this.filteredOptions();

    if (!value || !opts.length) return 'Select an option';

    const found = opts.find((o) => o.value == value || o.id == value);
    return found
      ? found.label || found.name || String(value)
      : 'Select an option';
  });

  constructor() {
    // Handle options changes
    effect(() => {
      this.setupOptionsSource();
    });

    // CRITICAL: React to BOTH value AND options changes
    effect(
      () => {
        const value = this.internalValue();
        const opts = this.filteredOptions();
        // This effect automatically runs whenever value or options change
        // No need for manual resolution - computed handles display
      },
      { allowSignalWrites: true }
    );
  }

  // ---- ControlValueAccessor ----
  writeValue(value: any): void {
    console.log('writeValue:', value);
    this.internalValue.set(value);
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ---- Options handling ----
  private setupOptionsSource(): void {
    const opts = this.options();

    if (this.optionsSubscription) {
      this.optionsSubscription.unsubscribe();
      this.optionsSubscription = null;
    }

    if (opts instanceof Observable) {
      this.optionsSubscription = opts.subscribe((newOptions: any[]) => {
        console.log('Options loaded:', newOptions);
        this.filteredOptions.set(newOptions ?? []);
      });
    } else if (Array.isArray(opts)) {
      console.log('Options set:', opts);
      this.filteredOptions.set(opts ?? []);
    } else {
      this.filteredOptions.set([]);
    }
  }

  // ---- Overlay / dropdown ----
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeDropdown();
    }
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown(event.currentTarget as HTMLElement);
    }
  }

  private openDropdown(triggerElement: HTMLElement): void {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(triggerElement)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 4,
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -4,
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'transparent-backdrop',
      width: triggerElement.offsetWidth,
    });

    this.overlayRef.backdropClick().subscribe(() => this.closeDropdown());

    const portal = new TemplatePortal(
      this.dropdownTemplate,
      this.viewContainerRef
    );
    this.overlayRef.attach(portal);
    this.isOpen.set(true);
  }

  private closeDropdown(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isOpen.set(false);
    this.searchTerm.set('');
    const opts = this.options();
    if (Array.isArray(opts)) {
      this.filteredOptions.set(opts as any[]);
    }
  }

  // ---- User interactions ----
  selectOption(option: any, event: MouseEvent): void {
    event.stopPropagation();

    const newValue = option?.value ?? option?.id ?? null;

    console.log('selectOption:', newValue);

    this.internalValue.set(newValue);
    this.onChange(newValue);
    this.onTouched();
    this.valueChange.emit(newValue);

    if (this.closeOnSelect()) {
      this.closeDropdown();
    }
  }

  filterOptions(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filterValue = input.value.toLowerCase();
    this.searchTerm.set(filterValue);

    const allOptions = Array.isArray(this.options())
      ? (this.options() as any[])
      : this.filteredOptions();

    this.filteredOptions.set(
      allOptions.filter((opt) =>
        (opt.label ?? opt.name ?? opt.value ?? opt.id ?? '')
          .toLowerCase()
          .includes(filterValue)
      )
    );
  }

  onAddNewOption(event: MouseEvent): void {
    event.stopPropagation();
    this.addNewOption.emit(this.categoryName());
    this.closeDropdown();
  }

  onEditOption(event: MouseEvent): void {
    event.stopPropagation();
    this.editOption.emit(this.categoryName());
    this.closeDropdown();
  }
}

// import {
//   Component,
//   input,
//   output,
//   signal,
//   ViewChild,
//   TemplateRef,
//   inject,
//   effect,
//   forwardRef,
//   ElementRef,
//   HostListener,
//   DestroyRef,
//   computed,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   ReactiveFormsModule,
//   ControlValueAccessor,
//   NG_VALUE_ACCESSOR,
// } from '@angular/forms';
// import { Overlay, OverlayRef } from '@angular/cdk/overlay';
// import { TemplatePortal } from '@angular/cdk/portal';
// import { ViewContainerRef } from '@angular/core';
// import { Observable, Subscription } from 'rxjs';

// @Component({
//   selector: 'app-searchable-select-input',
//   templateUrl: './searchable-select-input.component.html',
//   styleUrl: './searchable-select-input.component.css',
//   standalone: true,
//   imports: [ReactiveFormsModule, CommonModule],
//   providers: [
//     {
//       provide: NG_VALUE_ACCESSOR,
//       useExisting: forwardRef(() => SearchableSelectInputComponent),
//       multi: true,
//     },
//   ],
// })
// export class SearchableSelectInputComponent implements ControlValueAccessor {
//   @ViewChild('dropdownTemplate') dropdownTemplate!: TemplateRef<any>;

//   // Display-related inputs
//   label = input<string>('');
//   categoryName = input<string>('');
//   closeOnSelect = input<boolean>(true);

//   // Options can be array or Observable
//   options = input<any[] | Observable<any[]>>([]);

//   // Internal state
//   isOpen = signal(false);
//   selectedOption = signal<any | null>(null);
//   filteredOptions = signal<any[]>([]);
//   searchTerm = signal<string>('');
//   private optionsLoaded = signal(false);
//   private internalValue = signal<any>(null);

//   // Outputs
//   addNewOption = output<string>();
//   editOption = output<string>();
//   valueChange = output<any>();

//   // CVA callbacks
//   private onChange: (value: any) => void = () => {};
//   private onTouched: () => void = () => {};

//   // Overlay plumbing
//   private overlay = inject(Overlay);
//   private viewContainerRef = inject(ViewContainerRef);
//   private elementRef = inject(ElementRef);
//   private destroyRef = inject(DestroyRef);
//   private overlayRef: OverlayRef | null = null;
//   private optionsSubscription: Subscription | null = null;

//   selectedDisplay = computed(() => {
//     const selected = this.selectedOption();
//     return selected
//       ? selected.label || selected.name || 'Select an option'
//       : 'Select an option';
//   });

//   constructor() {
//     // React to options input changes
//     effect(() => this.setupOptionsSource());

//     // Re-run selection when value or options change
//     effect(() => {
//       if (this.optionsLoaded()) {
//         this.resolveSelectedOption();
//       }
//     });
//   }

//   // ---- ControlValueAccessor ----

//   writeValue(value: any): void {
//     console.log('writeValue called with:', value);
//     this.internalValue.set(value);

//     // Force immediate resolution even if options not "loaded"
//     setTimeout(() => {
//       this.resolveSelectedOption();
//     }, 0);
//   }

//   registerOnChange(fn: (value: any) => void): void {
//     this.onChange = fn;
//   }

//   registerOnTouched(fn: () => void): void {
//     this.onTouched = fn;
//   }

//   setDisabledState?(isDisabled: boolean): void {
//     // Optional: add disabled handling to template as needed
//     if (isDisabled) {
//       // e.g. add a `disabled` signal and use it in the template
//     }
//   }

//   // ---- Options handling ----

//   private setupOptionsSource(): void {
//     const opts = this.options();

//     if (this.optionsSubscription) {
//       this.optionsSubscription.unsubscribe();
//       this.optionsSubscription = null;
//     }

//     if (opts instanceof Observable) {
//       this.optionsSubscription = opts.subscribe((newOptions: any[]) => {
//         console.log('Observable options received:', newOptions);
//         this.filteredOptions.set(newOptions ?? []);
//         this.optionsLoaded.set(true);
//         // Always try to resolve selection when options arrive
//         this.resolveSelectedOption();
//       });
//     } else if (Array.isArray(opts)) {
//       console.log('Array options received:', opts);
//       this.filteredOptions.set(opts ?? []);
//       this.optionsLoaded.set(true);
//       this.resolveSelectedOption();
//     } else {
//       this.filteredOptions.set([]);
//       this.optionsLoaded.set(false);
//     }
//   }

//   private resolveSelectedOption(): void {
//     const value = this.internalValue();
//     const opts = this.filteredOptions();

//     console.log('resolveSelectedOption:', { value, optsCount: opts.length });

//     if (!value || !opts.length) {
//       this.selectedOption.set(null);
//       return;
//     }

//     // Try multiple possible matches
//     let found = opts.find((o) => o.value == value); // loose equality for numbers/strings
//     if (!found) found = opts.find((o) => o.id == value);
//     if (!found) found = opts.find((o) => o == value); // exact object match
//     if (!found) {
//       // Last resort: find by string conversion
//       found = opts.find(
//         (o) =>
//           String(o.value) === String(value) || String(o.id) === String(value)
//       );
//     }

//     console.log('Found option:', found);
//     this.selectedOption.set(found || null);
//   }

//   // ---- Overlay / dropdown ----

//   @HostListener('document:click', ['$event'])
//   onDocumentClick(event: MouseEvent): void {
//     if (!this.elementRef.nativeElement.contains(event.target)) {
//       this.closeDropdown();
//     }
//   }

//   toggleDropdown(event: MouseEvent): void {
//     event.stopPropagation();
//     if (this.isOpen()) {
//       this.closeDropdown();
//     } else {
//       this.openDropdown(event.currentTarget as HTMLElement);
//     }
//   }

//   private openDropdown(triggerElement: HTMLElement): void {
//     const positionStrategy = this.overlay
//       .position()
//       .flexibleConnectedTo(triggerElement)
//       .withPositions([
//         {
//           originX: 'start',
//           originY: 'bottom',
//           overlayX: 'start',
//           overlayY: 'top',
//           offsetY: 4,
//         },
//         {
//           originX: 'start',
//           originY: 'top',
//           overlayX: 'start',
//           overlayY: 'bottom',
//           offsetY: -4,
//         },
//       ]);

//     this.overlayRef = this.overlay.create({
//       positionStrategy,
//       scrollStrategy: this.overlay.scrollStrategies.reposition(),
//       hasBackdrop: true,
//       backdropClass: 'transparent-backdrop',
//       width: triggerElement.offsetWidth,
//     });

//     this.overlayRef.backdropClick().subscribe(() => this.closeDropdown());

//     const portal = new TemplatePortal(
//       this.dropdownTemplate,
//       this.viewContainerRef
//     );
//     this.overlayRef.attach(portal);
//     this.isOpen.set(true);
//   }

//   private closeDropdown(): void {
//     if (this.overlayRef) {
//       this.overlayRef.dispose();
//       this.overlayRef = null;
//     }
//     this.isOpen.set(false);
//     this.searchTerm.set('');
//     // Reset to ALL original options, not filtered ones
//     const opts = this.options();
//     if (Array.isArray(opts)) {
//       this.filteredOptions.set(opts);
//     }
//   }

//   // ---- User interactions ----

//   selectOption(option: any, event: MouseEvent): void {
//     event.stopPropagation();

//     const newValue = option?.value ?? option?.id ?? null;

//     console.log('selectOption:', { option, newValue });

//     // Update INTERNAL state FIRST
//     this.internalValue.set(newValue);
//     this.selectedOption.set(option);

//     // THEN notify form
//     this.onChange(newValue);
//     this.onTouched();
//     this.valueChange.emit(newValue);

//     if (this.closeOnSelect()) {
//       this.closeDropdown();
//     }
//   }

//   filterOptions(event: Event): void {
//     const input = event.target as HTMLInputElement;
//     const filterValue = input.value.toLowerCase();
//     this.searchTerm.set(filterValue);

//     const allOptions = Array.isArray(this.options())
//       ? (this.options() as any[])
//       : this.filteredOptions();

//     this.filteredOptions.set(
//       allOptions.filter((opt) =>
//         (opt.label ?? opt.name ?? opt.value ?? opt.id ?? '')
//           .toLowerCase()
//           .includes(filterValue)
//       )
//     );
//   }

//   onAddNewOption(event: MouseEvent): void {
//     event.stopPropagation();
//     this.addNewOption.emit(this.categoryName());
//     this.closeDropdown();
//   }

//   onEditOption(event: MouseEvent): void {
//     event.stopPropagation();
//     this.editOption.emit(this.categoryName());
//     this.closeDropdown();
//   }
// }

// import { Component, ElementRef, EventEmitter, HostListener, input, Input, output, Output } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
// import { Observable, Subscription, take } from 'rxjs';
// import { Option } from '../../../../../models/option.model';

// @Component({
//   selector: 'app-searchable-select-input',
//   standalone: true,
//   imports: [],
//   templateUrl: './searchable-select-input.component.html',
//   styleUrl: './searchable-select-input.component.css',
//   providers: [
//     {
//       provide: NG_VALUE_ACCESSOR,
//       useExisting: SearchableSelectInputComponent,
//       multi: true
//     }
//   ]
// })
// export class SearchableSelectInputComponent implements ControlValueAccessor {

//   @Input() label: string = '';
//   @Input() options: Option[] | Observable<Option[]> = [];
//   @Input() closeOnSelect = true;
//   categoryName = input<string>('');

//   @Output() valueChange = new EventEmitter<any>();
//   addNewOption = output<string>();
//   editOption = output<string>();

//   private optionsSubscription: Subscription | null = null;
//   selectedOption: Option | null = null;

//   value: any;
//   isOpen = false;
//   filteredOptions: Option[] = [];

//   constructor(private elementRef: ElementRef) {}

//   ngOnInit() {
//     this.setupOptionsObservable();
//     this.updateSelectedOption();
//   }

//   ngOnDestroy() {
//     if (this.optionsSubscription) {
//       this.optionsSubscription.unsubscribe();
//     }
//   }

//   private setupOptionsObservable() {
//     if (this.options instanceof Observable) {
//       this.optionsSubscription = this.options.subscribe(
//         (newOptions: Option[]) => {
//           this.filteredOptions = newOptions;
//         }
//       );
//     } else {
//       this.filteredOptions = this.options;
//     }
//   }

//   onChange: (value: any) => void = () => {};
//   onTouched: () => void = () => {};

//   writeValue(value: any): void {
//     this.value = value;
//     this.updateSelectedOption();
//   }

//   private updateSelectedOption() {
//     if (this.options instanceof Observable) {
//       this.options.pipe(take(1)).subscribe(opts => {
//         this.selectedOption = opts.find(opt => opt.value === this.value) || null;
//       });
//     } else {
//       this.selectedOption = this.options.find(opt => opt.value === this.value) || null;
//     }
//   }

//   registerOnChange(fn: any): void {
//     this.onChange = fn;
//   }

//   registerOnTouched(fn: any): void {
//     this.onTouched = fn;
//   }

//   @HostListener('document:click', ['$event'])
//   onDocumentClick(event: MouseEvent) {
//     if (!this.elementRef.nativeElement.contains(event.target)) {
//       this.closeDropdown();
//     }
//   }

//   closeDropdown() {
//     this.isOpen = false;
//   }

//   toggleDropdown(event: Event) {
//     event.stopPropagation();
//     this.isOpen = !this.isOpen;
//     if (this.options instanceof Observable) {
//       // The filteredOptions will be updated by the subscription
//     } else {
//       this.filteredOptions = this.options;
//     }
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
//     if (this.options instanceof Observable) {
//       // If options is an Observable, we need to update the subscription
//       if (this.optionsSubscription) {
//         this.optionsSubscription.unsubscribe();
//       }
//       this.optionsSubscription = this.options.subscribe(options => {
//         this.filteredOptions = options.filter(option =>
//           option.label.toLowerCase().includes(filterValue)
//         );
//       });
//     } else {
//       // If options is an array, we can filter it directly
//       this.filteredOptions = this.options.filter(option =>
//         option.label.toLowerCase().includes(filterValue)
//       );
//     }
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
