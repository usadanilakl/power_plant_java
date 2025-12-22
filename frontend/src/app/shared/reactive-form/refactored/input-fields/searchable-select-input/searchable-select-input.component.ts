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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  ReactiveFormsModule,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef } from '@angular/core';

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
export class SearchableSelectInputComponent implements ControlValueAccessor {
  @ViewChild('dropdownTemplate') dropdownTemplate!: TemplateRef<any>;

  label = input<string>('');
  options = input<any[]>([]);
  formControl = input<FormControl>(new FormControl());
  categoryName = input<string>('');
  closeOnSelect = input<boolean>(true);

  isOpen = signal(false);
  selectedOption = signal<any>(null);
  filteredOptions = signal<any[]>([]);
  searchTerm = signal<string>('');

  addNewOption = output<string>();
  editOption = output<string>();
  valueChange = output<any>();

  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const opts = this.options();
      this.filteredOptions.set(opts);
      const selected = this.formControl().value;
      if (selected) {
        this.selectedOption.set(opts.find((o) => o.value === selected));
      }
    });
  }

  writeValue(value: any): void {
    if (value) {
      this.formControl().setValue(value, { emitEvent: false });
      const selected = this.options().find((o) => o.value === value);
      if (selected) {
        this.selectedOption.set(selected);
      }
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
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

  closeDropdown(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isOpen.set(false);
    this.searchTerm.set('');
  }

  selectOption(option: any, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedOption.set(option);
    this.formControl().setValue(option.value);
    this.onChange(option.value);
    this.onTouched();
    this.valueChange.emit(option.value);
    if (this.closeOnSelect()) {
      this.closeDropdown();
    }
  }

  filterOptions(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filterValue = input.value.toLowerCase();
    this.searchTerm.set(filterValue);
    this.filteredOptions.set(
      this.options().filter((opt) =>
        opt.label.toLowerCase().includes(filterValue)
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

// import { Component, input, output, signal, ViewChild, TemplateRef, inject, effect } from '@angular/core';
// import { FormControl, ReactiveFormsModule } from '@angular/forms';
// import { Overlay, OverlayRef } from '@angular/cdk/overlay';
// import { TemplatePortal } from '@angular/cdk/portal';
// import { ViewContainerRef } from '@angular/core';

// @Component({
//   selector: 'app-searchable-select-input',
//   templateUrl: './searchable-select-input.component.html',
//   styleUrl: './searchable-select-input.component.css',
//   standalone: true,
//   imports: [ReactiveFormsModule, CommonModule]
// })
// export class SearchableSelectInputComponent {
//   @ViewChild('dropdownTemplate') dropdownTemplate!: TemplateRef<any>;
//   @ViewChild('triggerElement') triggerElement: any;

//   label = input<string>('');
//   options = input<any[]>([]);
//   formControl = input<FormControl>(new FormControl());
//   categoryName = input<string>('');

//   isOpen = signal(false);
//   selectedOption = signal<any>(null);
//   filteredOptions = signal<any[]>([]);

//   addNewOption = output<string>();
//   editOption = output<string>();

//   private overlay = inject(Overlay);
//   private viewContainerRef = inject(ViewContainerRef);
//   private overlayRef: OverlayRef | null = null;

//   constructor() {
//     effect(() => {
//       const opts = this.options();
//       this.filteredOptions.set(opts);
//       const selected = this.formControl().value;
//       if (selected) {
//         this.selectedOption.set(opts.find(o => o.value === selected));
//       }
//     });
//   }

//   toggleDropdown(event: MouseEvent): void {
//     event.stopPropagation();
//     if (this.isOpen()) {
//       this.closeDropdown();
//     } else {
//       this.openDropdown(event.target as HTMLElement);
//     }
//   }

//   private openDropdown(triggerElement: HTMLElement): void {
//     const positionStrategy = this.overlay.position()
//       .flexibleConnectedTo(triggerElement)
//       .withPositions([
//         {
//           originX: 'start',
//           originY: 'bottom',
//           overlayX: 'start',
//           overlayY: 'top',
//           offsetY: 4
//         },
//         {
//           originX: 'start',
//           originY: 'top',
//           overlayX: 'start',
//           overlayY: 'bottom',
//           offsetY: -4
//         }
//       ]);

//     this.overlayRef = this.overlay.create({
//       positionStrategy,
//       scrollStrategy: this.overlay.scrollStrategies.reposition(),
//       hasBackdrop: true,
//       backdropClass: 'transparent-backdrop'
//     });

//     this.overlayRef.backdropClick().subscribe(() => this.closeDropdown());

//     const portal = new TemplatePortal(this.dropdownTemplate, this.viewContainerRef);
//     this.overlayRef.attach(portal);
//     this.isOpen.set(true);
//   }

//   closeDropdown(): void {
//     if (this.overlayRef) {
//       this.overlayRef.dispose();
//       this.overlayRef = null;
//     }
//     this.isOpen.set(false);
//   }

//   selectOption(option: any, event: MouseEvent): void {
//     event.stopPropagation();
//     this.selectedOption.set(option);
//     this.formControl().setValue(option.value);
//     this.closeDropdown();
//   }

//   filterOptions(event: Event): void {
//     const input = event.target as HTMLInputElement;
//     const filterValue = input.value.toLowerCase();
//     this.filteredOptions.set(
//       this.options().filter(opt =>
//         opt.label.toLowerCase().includes(filterValue)
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
