import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  forwardRef,
  inject,
  input,
  signal,
  computed,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Option } from '../../../../../models/option.model';

@Component({
  selector: 'app-loto-standard-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loto-standard-select.component.html',
  styleUrl: './loto-standard-select.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LotoStandardSelectComponent),
      multi: true,
    },
  ],
})
export class LotoStandardSelectComponent implements ControlValueAccessor {
  label = input<string>('LOTO Standards');
  options = input<Option[]>([]);

  private elementRef = inject(ElementRef);

  selectedValues = signal<number[]>([]);
  searchTerm = signal('');
  isOpen = signal(false);
  isDisabled = signal(false);

  filteredOptions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    return this.options().filter(option => {
      if (!term) return true;
      return option.label.toLowerCase().includes(term);
    });
  });

  selectedOptions = computed(() => {
    const byId = new Map(
      this.options().map(option => [Number(option.value), option])
    );
    return this.selectedValues()
      .map(id => byId.get(id))
      .filter((option): option is Option => !!option);
  });

  triggerText = computed(() => {
    const selected = this.selectedOptions();
    if (selected.length === 0) {
      return 'Select LOTO standards';
    }

    if (selected.length <= 2) {
      return selected.map(option => option.label).join(', ');
    }

    return `${selected[0].label}, ${selected[1].label} +${selected.length - 2} more`;
  });

  private onChange: (value: number[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    if (Array.isArray(value)) {
      this.selectedValues.set(
        value
          .map(item => Number(typeof item === 'object' && item !== null ? item.id : item))
          .filter(item => !Number.isNaN(item))
      );
      return;
    }
    this.selectedValues.set([]);
  }

  registerOnChange(fn: (value: number[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  toggleOpen(): void {
    if (this.isDisabled()) return;
    this.isOpen.update(current => !current);
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  isSelected(value: any): boolean {
    const id = Number(value);
    return !Number.isNaN(id) && this.selectedValues().includes(id);
  }

  addOption(option: Option): void {
    const id = Number(option.value);
    if (Number.isNaN(id) || this.selectedValues().includes(id)) return;
    const next = [...this.selectedValues(), id];
    this.selectedValues.set(next);
    this.searchTerm.set('');
    this.onChange(next);
    this.onTouched();
  }

  toggleOption(option: Option): void {
    const id = Number(option.value);
    if (Number.isNaN(id)) return;

    if (this.selectedValues().includes(id)) {
      this.removeOption(id);
      return;
    }

    this.addOption(option);
  }

  removeOption(id: number): void {
    const next = this.selectedValues().filter(value => value !== id);
    this.selectedValues.set(next);
    this.onChange(next);
    this.onTouched();
  }

  closePanel(): void {
    this.isOpen.set(false);
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closePanel();
    }
  }
}
