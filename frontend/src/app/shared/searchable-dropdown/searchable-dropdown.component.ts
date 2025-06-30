import { Component, ElementRef, EventEmitter, HostListener, Input, Output, forwardRef, input, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FindPipe } from "../../pipes/find.pipe";
import { Option } from '../../models/option.model';
import { Observable, Subscription, take } from 'rxjs';

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
  @Input() options: Option[] | Observable<Option[]> = [];
  @Input() closeOnSelect = true;
  categoryName = input<string>('');

  @Output() valueChange = new EventEmitter<any>();
  addNewOption = output<string>();
  editOption = output<void>();

  private optionsSubscription: Subscription | null = null;
  selectedOption: Option | null = null;

  value: any;
  isOpen = false;
  filteredOptions: Option[] = [];

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.setupOptionsObservable();
    this.updateSelectedOption();
  }

  ngOnDestroy() {
    if (this.optionsSubscription) {
      this.optionsSubscription.unsubscribe();
    }
  }

  private setupOptionsObservable() {
    if (this.options instanceof Observable) {
      this.optionsSubscription = this.options.subscribe(
        (newOptions: Option[]) => {
          this.filteredOptions = newOptions;
        }
      );
    } else {
      this.filteredOptions = this.options;
    }
  }


  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = value;
    this.updateSelectedOption();
  }
  
  private updateSelectedOption() {
    if (this.options instanceof Observable) {
      this.options.pipe(take(1)).subscribe(opts => {
        // console.log('Updating selectedOption:', opts);
        this.selectedOption = opts.find(opt => opt.value === this.value) || null;
      });
    } else {
      this.selectedOption = this.options.find(opt => opt.value === this.value) || null;
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
    this.isOpen = false;
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (this.options instanceof Observable) {
      // The filteredOptions will be updated by the subscription
    } else {
      this.filteredOptions = this.options;
    }
  }

  selectOption(option: Option, event: Event) {
    event.stopPropagation();
    this.value = option.value;
    this.selectedOption = option;
    this.onChange(this.value);
    if(this.closeOnSelect)this.isOpen = false;
    this.valueChange.emit(this.value);
  }

  filterOptions(event: any) {
    const filterValue = event.target.value.toLowerCase();
    if (this.options instanceof Observable) {
      // If options is an Observable, we need to update the subscription
      if (this.optionsSubscription) {
        this.optionsSubscription.unsubscribe();
      }
      this.optionsSubscription = this.options.subscribe(options => {
        this.filteredOptions = options.filter(option =>
          option.label.toLowerCase().includes(filterValue)
        );
      });
    } else {
      // If options is an array, we can filter it directly
      this.filteredOptions = this.options.filter(option =>
        option.label.toLowerCase().includes(filterValue)
      );
    }
  }

  onAddNewOption(event: Event) {
    event.stopPropagation();
    this.addNewOption.emit(this.categoryName());
  }
  

  onEditOption(event: Event) {
    event.stopPropagation();
    this.editOption.emit();
  }
}