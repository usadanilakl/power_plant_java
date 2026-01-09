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
  computed,
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
export class SearchableSelectInputComponent implements ControlValueAccessor {
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
  searchMode = signal<'and' | 'or'>('and');
  private internalValue = signal<any>(null);
  isDisabled = signal<boolean>(false);
  private optionsSubscription: Subscription | null = null;

  // Input to control delete button visibility
  showDelete = input<boolean>(false);

  // Outputs
  addNewOption = output<string>();
  editOption = output<string>();
  deleteOption = output<void>();
  valueChange = output<any>();

  // CVA callbacks
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  // Overlay plumbing
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private elementRef = inject(ElementRef);
  private overlayRef: OverlayRef | null = null;

  // COMPUTED - for template display
  selectedDisplay = computed(() => {
    const value = this.internalValue();
    const opts = this.filteredOptions();

    if (value === null || value === undefined || !opts.length) {
      return 'Select an option';
    }

    const found = opts.find((o) => o.value == value || o.id == value);
    return found
      ? found.label || found.name || String(value)
      : 'Select an option';
  });

  constructor() {
    // Handle options changes and setup
    effect(() => {
      this.setupOptionsSource();
    });
  }

  // ---- ControlValueAccessor ----
  writeValue(value: any): void {
    this.internalValue.set(value);
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
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
        this.filteredOptions.set(newOptions ?? []);
      });
    } else if (Array.isArray(opts)) {
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
    // Always refresh filteredOptions from current options when opening
    // This ensures we pick up any async-loaded options
    const opts = this.options();
    if (Array.isArray(opts)) {
      this.filteredOptions.set(opts);
    }

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
    const filterValue = input.value.toLowerCase().trim();
    this.searchTerm.set(filterValue);
    this.applyFilter(filterValue);
  }

  toggleSearchMode(): void {
    this.searchMode.set(this.searchMode() === 'and' ? 'or' : 'and');
    this.applyFilter(this.searchTerm());
  }

  private applyFilter(filterValue: string): void {
    const allOptions = Array.isArray(this.options())
      ? (this.options() as any[])
      : this.filteredOptions();

    const searchWords = filterValue.split(/\s+/).filter((word) => word.length > 0);

    if (searchWords.length === 0) {
      this.filteredOptions.set(allOptions);
      return;
    }

    const isAndMode = this.searchMode() === 'and';

    this.filteredOptions.set(
      allOptions.filter((opt) => {
        const optionText = (opt.label ?? opt.name ?? opt.value ?? opt.id ?? '').toLowerCase();
        // AND mode: every word must match, OR mode: any word must match
        return isAndMode
          ? searchWords.every((word) => optionText.includes(word))
          : searchWords.some((word) => optionText.includes(word));
      })
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

  onDeleteOption(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteOption.emit();
    this.closeDropdown();
  }
}
