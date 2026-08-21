
import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal, ViewChild, ElementRef, effect, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-column-filter-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './column-filter-input.component.html',
  styleUrl: './column-filter-input.component.css'
})
export class ColumnFilterInputComponent {
  @ViewChild('inputElement') inputElement?: ElementRef<HTMLInputElement>;
  @ViewChild('optionsList') optionsList?: ElementRef<HTMLDivElement>;
  
  uniqueValues = input<string[]>([]);
  isLoadingMore = input<boolean>(false);
  
  filterChange = output<string>();
  optionSelected = output<string>();
  loadInitialOptions = output<string>();
  loadMoreOptions = output<string>();

  filterDropdownOpen = signal(false);
  filteredOptions = signal<string[]>([]);
  dropdownStyle = signal<{ [key: string]: string }>({});
  filterValue = signal<string>('');

  /**
   * Separator between the values of a multi-select filter. One filter box can
   * hold several picks ("Dan Schomig | Danil Klokov"), which the search treats
   * as OR — which is what picking several options in a dropdown means. Chosen
   * because it survives a plain text box, needs no new state (the picks are
   * parsed back out of the box), and no lookup value in this app contains it.
   * Everything downstream — the emitted filter string, the criteria, the server
   * predicate — keeps its existing shape, so a single pick behaves exactly as
   * it did before.
   */
  static readonly VALUE_SEPARATOR = '|';

  /** The picked values, parsed straight back out of the box. */
  selectedValues = computed<string[]>(() => this.parseValues(this.filterValue()));

  /**
   * What the user is currently TYPING — the text after the last separator.
   * Type-ahead and the server-side option lookup use this rather than the whole
   * box, or the option list would go empty as soon as the first pick landed.
   */
  typedTerm = computed<string>(() => {
    const raw = this.filterValue();
    const at = raw.lastIndexOf(ColumnFilterInputComponent.VALUE_SEPARATOR);
    return (at === -1 ? raw : raw.slice(at + 1)).trim();
  });

  private parseValues(raw: string): string[] {
    return raw
      .split(ColumnFilterInputComponent.VALUE_SEPARATOR)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }

  /** True when this option is already one of the picks (case-insensitive). */
  isOptionSelected(option: string): boolean {
    const target = (option ?? '').trim().toLowerCase();
    return this.selectedValues().some((v) => v.toLowerCase() === target);
  }

  /**
   * Write a set of picks back into the box. The trailing separator is
   * deliberate: it leaves typedTerm() empty, so the dropdown immediately shows
   * the full option list again and the next pick can be typed straight away.
   */
  private applyValues(values: string[]): void {
    const next = values.length ? values.join(' | ') + ' | ' : '';
    this.filterValue.set(next);
    this.filterChange.emit(next);
  }

  private closeDropdownTimeout: any;

  constructor(private cdr: ChangeDetectorRef) {
    // Narrow the dropdown to options matching what's typed, on top of whatever the
    // server returned. Without this the option list stays the full set while the
    // table itself filters — the two get visibly out of sync.
    effect(() => {
      const all = this.uniqueValues();
      const q = this.typedTerm().toLowerCase();
      this.filteredOptions.set(
        q ? all.filter(o => (o ?? '').toLowerCase().includes(q)) : all
      );
    });
  }

  /**
   * Externally set this input's text without emitting — used when a criteria is
   * applied from outside the table (see TableComponent.syncColumnFilterInputs),
   * so the box shows the filter that is actually in effect. The parent owns the
   * search; emitting here would re-enter it.
   */
  setValue(value: string): void {
    if (this.filterValue() === value) return;
    this.filterValue.set(value);
    this.filterDropdownOpen.set(false);
  }

  /** Externally clear this input's text/dropdown without emitting (parent does the search). */
  reset(): void {
    this.filterValue.set('');
    this.filteredOptions.set(this.uniqueValues());
    this.filterDropdownOpen.set(false);
    if (this.closeDropdownTimeout) {
      clearTimeout(this.closeDropdownTimeout);
      this.closeDropdownTimeout = null;
    }
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterValue.set(value);
    this.loadInitialOptions.emit(this.typedTerm());
    this.filterChange.emit(value);
  }
  
  onInputFocus(event: Event): void {
    // Cancel any pending close
    if (this.closeDropdownTimeout) {
      clearTimeout(this.closeDropdownTimeout);
      this.closeDropdownTimeout = null;
    }

    const value = (event.target as HTMLInputElement).value;
    this.filterValue.set(value);
    this.filteredOptions.set([]);
    this.loadInitialOptions.emit(this.typedTerm());
    this.filterDropdownOpen.set(true);
    
    // Position the dropdown below the input
    this.positionDropdown(event.target as HTMLInputElement);
  }

  onInputClick(event: Event): void {
    event.stopPropagation();
    // Cancel any pending close
    if (this.closeDropdownTimeout) {
      clearTimeout(this.closeDropdownTimeout);
      this.closeDropdownTimeout = null;
    }
    if (!this.filterDropdownOpen()) {
      this.onInputFocus(event);
    }
  }

  
  onMouseEnter(): void {
    // Cancel any pending close when mouse enters the container
    if (this.closeDropdownTimeout) {
      clearTimeout(this.closeDropdownTimeout);
      this.closeDropdownTimeout = null;
    }
    
    // If input is focused and dropdown was closed, reopen it
    if (this.inputElement?.nativeElement === document.activeElement && !this.filterDropdownOpen()) {
      this.filterDropdownOpen.set(true);
      this.positionDropdown(this.inputElement.nativeElement);
    }
  }

  onMouseLeave(): void {
    this.closeDropdownTimeout = setTimeout(() => {
      this.filterDropdownOpen.set(false);
      this.closeDropdownTimeout = null;
    }, 300);
  }

  /**
   * Toggle an option in or out of the picks, so the dropdown reads as a
   * checklist. The dropdown deliberately STAYS OPEN — closing on the first
   * click is what made this single-choice.
   */
  selectOption(option: string): void {
    const target = (option ?? '').trim();
    if (!target) return;

    const picked = this.selectedValues();
    this.applyValues(
      this.isOptionSelected(target)
        ? picked.filter((v) => v.toLowerCase() !== target.toLowerCase())
        : [...picked, target]
    );

    if (this.closeDropdownTimeout) {
      clearTimeout(this.closeDropdownTimeout);
      this.closeDropdownTimeout = null;
    }
    this.inputElement?.nativeElement.focus();
  }

  clearFilter(): void {
    this.filterValue.set('');
    this.filterChange.emit('');
    this.filterDropdownOpen.set(false);
    if (this.closeDropdownTimeout) {
      clearTimeout(this.closeDropdownTimeout);
      this.closeDropdownTimeout = null;
    }
  }

  onOptionsScroll(event: Event): void {
    const scrollElement = event.target as HTMLDivElement;
    const scrollTop = scrollElement.scrollTop;
    const scrollHeight = scrollElement.scrollHeight;
    const clientHeight = scrollElement.clientHeight;
    
    // Trigger load more when user scrolls within 50px of the bottom
    if (scrollHeight - (scrollTop + clientHeight) < 50 && !this.isLoadingMore()) {
      this.loadMoreOptions.emit(this.typedTerm());
    }
  }

  private positionDropdown(inputElement: HTMLInputElement): void {
    setTimeout(() => {
      const rect = inputElement.getBoundingClientRect();
      const dropdown = document.querySelector('.filter-dropdown') as HTMLElement;
      
      if (dropdown) {
        const style: { [key: string]: string } = {
          top: (rect.bottom + 5) + 'px',
          left: rect.left + 'px',
          width: rect.width + 'px'
        };
        this.dropdownStyle.set(style);
        this.cdr.detectChanges();
      }
    }, 0);
  }
}


// import { CommonModule } from '@angular/common';
// import { Component, input, output, signal, ViewChild, ElementRef, effect, ChangeDetectorRef } from '@angular/core';
// import { FormsModule } from '@angular/forms';

// @Component({
//   selector: 'app-column-filter-input',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './column-filter-input.component.html',
//   styleUrl: './column-filter-input.component.css'
// })
// export class ColumnFilterInputComponent {
//   @ViewChild('inputElement') inputElement?: ElementRef<HTMLInputElement>;
//   @ViewChild('optionsList') optionsList?: ElementRef<HTMLDivElement>;
  
//   uniqueValues = input<string[]>([]);
  
//   filterChange = output<string>();
//   optionSelected = output<string>();
//   loadInitialOptions = output<string>();
//   loadMoreOptions = output<string>();

//   filterDropdownOpen = signal(false);
//   filteredOptions = signal<string[]>([]);
//   dropdownStyle = signal<{ [key: string]: string }>({});
//   isLoadingMore = signal(false);
//   filterValue = signal<string>('');

//   constructor(private cdr: ChangeDetectorRef) {
//     effect(() => {
//       this.filteredOptions.set(this.uniqueValues());
//     });
//   }

//   onInputChange(event: Event): void {
//     const value = (event.target as HTMLInputElement).value;
//     this.filterValue.set(value);
//     this.loadInitialOptions.emit(value);
//     this.filterChange.emit(value);
//   }
  
//   onInputFocus(event: Event): void {
//     const value = (event.target as HTMLInputElement).value;
//     this.filterValue.set(value);
//     this.filteredOptions.set([]);
//     this.loadInitialOptions.emit(value);
//     this.filterDropdownOpen.set(true);
    
//     // Position the dropdown below the input
//     this.positionDropdown(event.target as HTMLInputElement);
//   }

//   onInputBlur(event: Event): void {
//     setTimeout(() => {
//       this.filterDropdownOpen.set(false);
//       this.filteredOptions.set([]);
//     }, 200);
//   }

//   selectOption(option: string): void {
//     this.filterChange.emit(option);
//     this.filterDropdownOpen.set(false);
//   }

//   clearFilter(): void {
//     this.filterChange.emit('');
//     this.filterDropdownOpen.set(false);
//   }

//   onOptionsScroll(event: Event): void {
//     const scrollElement = event.target as HTMLDivElement;
//     const scrollTop = scrollElement.scrollTop;
//     const scrollHeight = scrollElement.scrollHeight;
//     const clientHeight = scrollElement.clientHeight;
    
//     // Trigger load more when user scrolls within 50px of the bottom
//     if (scrollHeight - (scrollTop + clientHeight) < 50 && !this.isLoadingMore()) {
//       this.isLoadingMore.set(true);
//       const currentSearchTerm = this.filterValue();
//       this.loadMoreOptions.emit(currentSearchTerm);
//     }
//   }

//   onLoadMoreComplete(): void {
//     this.isLoadingMore.set(false);
//   }

//   private positionDropdown(inputElement: HTMLInputElement): void {
//     setTimeout(() => {
//       const rect = inputElement.getBoundingClientRect();
//       const dropdown = document.querySelector('.filter-dropdown') as HTMLElement;
      
//       if (dropdown) {
//         const style: { [key: string]: string } = {
//           top: (rect.bottom + 5) + 'px',
//           left: rect.left + 'px',
//           width: rect.width + 'px'
//         };
//         this.dropdownStyle.set(style);
//         this.cdr.detectChanges();
//       }
//     }, 0);
//   }

//   closeDropdown(): void {
//     this.filterDropdownOpen.set(false);
//   }
// }