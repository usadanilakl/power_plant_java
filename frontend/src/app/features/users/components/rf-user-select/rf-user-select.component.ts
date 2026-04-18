import {
  Component, input, inject, signal, effect, ViewChild, AfterViewInit,
  computed, Injector, output, ElementRef, TemplateRef, ViewContainerRef, HostListener
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { RfUserOptionService } from '../../services/rf-user-option.service';
import { UserDto } from '../../../../models/user.model';
import { Option } from '../../../../models/option.model';
import { SearchableSelectInputComponent } from '../../../../shared/reactive-form/refactored/input-fields/searchable-select-input/searchable-select-input.component';

@Component({
  selector: 'app-rf-user-select',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectInputComponent],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: RfUserSelectComponent,
    multi: true
  }],
  templateUrl: './rf-user-select.component.html',
  styleUrls: ['./rf-user-select.component.css']
})
export class RfUserSelectComponent implements ControlValueAccessor, AfterViewInit {
  private userOptionService = inject(RfUserOptionService);
  private injector = inject(Injector);
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private elementRef = inject(ElementRef);

  @ViewChild('selectInput') selectInput!: SearchableSelectInputComponent;
  @ViewChild('suggestDropdown') suggestDropdown!: TemplateRef<any>;
  @ViewChild('textInput') textInputRef!: ElementRef<HTMLInputElement>;

  // Inputs
  label = input<string>('User');
  roleFilter = input<string | undefined>(undefined);
  /** 'strict' = must pick from dropdown (value = User ID). 'suggest' = autocomplete text (value = string name). */
  mode = input<'strict' | 'suggest'>('suggest');

  // Outputs
  userSelected = output<UserDto | null>();

  // State
  value = signal<any>(null);
  disabled = signal<boolean>(false);

  // Suggest mode state
  suggestText = signal<string>('');
  filteredSuggestions = signal<Option[]>([]);
  suggestOpen = signal<boolean>(false);
  private overlayRef: OverlayRef | null = null;

  // Computed options
  options = computed(() => {
    const filter = this.roleFilter();
    if (filter) {
      return this.userOptionService.getFilteredOptions(filter);
    }
    return this.userOptionService.getUserOptions();
  });

  // ControlValueAccessor
  private onChange = (value: any) => {};
  private onTouched = () => {};
  private pendingValue: any = undefined;
  private hasPendingValue = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeSuggestDropdown();
    }
  }

  ngAfterViewInit(): void {
    if (this.mode() === 'strict' && this.selectInput) {
      this.setupStrictMode();
    }
  }

  // ==================== Strict mode (ID-based, same as before) ====================

  private setupStrictMode(): void {
    this.selectInput.registerOnChange((val: any) => {
      this.value.set(val);
      this.onChange(val);
      this.emitSelectedUser(val);
    });
    this.selectInput.registerOnTouched(() => {
      this.onTouched();
    });

    if (this.hasPendingValue) {
      this.selectInput.writeValue(this.pendingValue);
      this.hasPendingValue = false;
      this.pendingValue = undefined;
    }

    effect(() => {
      const opts = this.options();
      const val = this.value();
      if (opts.length > 0 && val !== null && val !== undefined && this.selectInput) {
        setTimeout(() => {
          if (this.selectInput) {
            this.selectInput.writeValue(val);
          }
        }, 0);
      }
    }, { injector: this.injector });
  }

  private emitSelectedUser(userId: any): void {
    if (userId === null || userId === undefined) {
      this.userSelected.emit(null);
      return;
    }
    const user = this.userOptionService.getUserById(Number(userId));
    this.userSelected.emit(user ?? null);
  }

  // ==================== Suggest mode (text-based with autocomplete) ====================

  onSuggestInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const text = input.value;
    this.suggestText.set(text);

    // Update form control value immediately (free text)
    this.value.set(text);
    this.onChange(text);

    // Filter suggestions
    this.filterSuggestions(text);

    // Open dropdown if there are matches and text is not empty
    if (text.trim().length > 0 && this.filteredSuggestions().length > 0) {
      this.openSuggestDropdown();
    } else {
      this.closeSuggestDropdown();
    }

    // Emit matched user or null
    this.emitMatchedUser(text);
  }

  onSuggestFocus(): void {
    const text = this.suggestText();
    this.filterSuggestions(text);
    if (this.filteredSuggestions().length > 0) {
      this.openSuggestDropdown();
    }
  }

  selectSuggestion(option: Option, event: MouseEvent): void {
    event.stopPropagation();
    const name = option.label;
    this.suggestText.set(name);
    this.value.set(name);
    this.onChange(name);
    this.onTouched();
    this.closeSuggestDropdown();

    // Emit matched user
    const user = this.userOptionService.getUserById(Number(option.value));
    this.userSelected.emit(user ?? null);
  }

  clearSuggest(event: MouseEvent): void {
    event.stopPropagation();
    this.suggestText.set('');
    this.value.set('');
    this.onChange('');
    this.onTouched();
    this.userSelected.emit(null);
    this.closeSuggestDropdown();
  }

  private filterSuggestions(text: string): void {
    const filterValue = text.toLowerCase().trim();
    if (!filterValue) {
      this.filteredSuggestions.set(this.options());
      return;
    }

    const words = filterValue.split(/\s+/).filter(w => w.length > 0);
    this.filteredSuggestions.set(
      this.options().filter(opt => {
        const label = (opt.label || '').toLowerCase();
        return words.every(word => label.includes(word));
      })
    );
  }

  private emitMatchedUser(text: string): void {
    if (!text.trim()) {
      this.userSelected.emit(null);
      return;
    }
    // Exact match check
    const match = this.options().find(
      opt => (opt.label || '').toLowerCase() === text.toLowerCase().trim()
    );
    if (match) {
      const user = this.userOptionService.getUserById(Number(match.value));
      this.userSelected.emit(user ?? null);
    } else {
      this.userSelected.emit(null);
    }
  }

  private openSuggestDropdown(): void {
    if (this.suggestOpen() || !this.textInputRef) return;

    const triggerElement = this.textInputRef.nativeElement;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(triggerElement)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'transparent-backdrop',
      width: triggerElement.offsetWidth,
    });

    this.overlayRef.backdropClick().subscribe(() => this.closeSuggestDropdown());

    const portal = new TemplatePortal(this.suggestDropdown, this.viewContainerRef);
    this.overlayRef.attach(portal);
    this.suggestOpen.set(true);
  }

  private closeSuggestDropdown(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.suggestOpen.set(false);
  }

  // ==================== ControlValueAccessor ====================

  writeValue(value: any): void {
    this.value.set(value);
    if (this.mode() === 'strict') {
      if (this.selectInput) {
        this.selectInput.writeValue(value);
      } else {
        this.pendingValue = value;
        this.hasPendingValue = true;
      }
    } else {
      // Suggest mode: value is a string
      this.suggestText.set(value || '');
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (this.mode() === 'strict' && this.selectInput) {
      this.selectInput.setDisabledState(isDisabled);
    }
  }
}
