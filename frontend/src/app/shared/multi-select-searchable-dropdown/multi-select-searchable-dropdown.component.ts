import { Component, EventEmitter, Input, Output, forwardRef, OnInit, OnChanges, input, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchableDropdownComponent } from '../searchable-dropdown/searchable-dropdown.component';
import { FindPipe } from "../../pipes/find.pipe";
import { Option } from '../../models/option.model';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Question } from '../../models/ui/question.model';

@Component({
  selector: 'app-multi-select-searchable-dropdown',
  standalone: true,
  imports: [CommonModule, SearchableDropdownComponent, FindPipe],
  templateUrl: './multi-select-searchable-dropdown.component.html',
  styleUrl: './multi-select-searchable-dropdown.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectSearchableDropdownComponent),
      multi: true
    }
  ]
})
export class MultiSelectSearchableDropdownComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() options: Option[] | Observable<Option[]> = [];
  @Input() label: string = '';
  question = input<Question | null>(null);
  categoryName = input<string>('');
  
  @Output() selectionChange = new EventEmitter<any[]>();
  addNewOption = output<string>();
  editOption = output<string>();

  selectedValues: any[] = [];
  availableOptions$: Observable<Option[]>;
  allOptions$: Observable<Option[]>;
  private optionsSubject = new BehaviorSubject<Option[]>([]);

  constructor() {
    this.allOptions$ = this.optionsSubject.asObservable();
    this.availableOptions$ = combineLatest([
      this.allOptions$,
      this.optionsSubject.pipe(startWith([]))
    ]).pipe(
      map(([allOptions, _]) => allOptions.filter(option => !this.selectedValues.includes(option.value)))
    );
  }

  ngOnInit() {
    this.updateAvailableOptions();
  }

  ngOnChanges() {
    this.updateAvailableOptions();
  }

  private updateAvailableOptions() {
    if (this.options instanceof Observable) {
        this.options.subscribe(options => {
        this.optionsSubject.next(options);
      });
    } else {
      this.optionsSubject.next(this.options);
    }
  }

  onSelect(value: any) {
    if (!this.selectedValues.includes(value)) {
      this.selectedValues = [...this.selectedValues, value];
      this.optionsSubject.next(this.optionsSubject.value); // Trigger filter
      this.onChange(this.selectedValues);
      this.onTouched();
      this.selectionChange.emit(this.selectedValues);
    }
  }
  
  removeOption(value: any) {
    this.selectedValues = this.selectedValues.filter(v => v !== value);
    this.optionsSubject.next(this.optionsSubject.value); // Trigger filter
    this.onChange(this.selectedValues);
    this.onTouched();
    this.selectionChange.emit(this.selectedValues);
  }

  writeValue(value: any[]): void {
    if (Array.isArray(value)) {
      this.selectedValues = [...value];
      this.optionsSubject.next(this.optionsSubject.value); // Trigger filter
    } else {
      this.selectedValues = [];
    }
  }

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onAddNewOption() {
    console.log(this.categoryName( ));
    this.addNewOption.emit(this.categoryName());
  }
  

  onEditOption() {
    console.log(this.categoryName( ));
    this.editOption.emit(this.categoryName());
  }
}