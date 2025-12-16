
import { CommonModule } from '@angular/common';
import { Component, input, output, signal, ViewChild, ElementRef, effect, ChangeDetectorRef } from '@angular/core';
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
  
  filterChange = output<string>();
  optionSelected = output<string>();
  loadInitialOptions = output<string>();
  loadMoreOptions = output<string>();

  filterDropdownOpen = signal(false);
  filteredOptions = signal<string[]>([]);
  dropdownStyle = signal<{ [key: string]: string }>({});
  isLoadingMore = signal(false);
  filterValue = signal<string>('');

  private closeDropdownTimeout: any;

  constructor(private cdr: ChangeDetectorRef) {
    effect(() => {
      this.filteredOptions.set(this.uniqueValues());
    });
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterValue.set(value);
    this.loadInitialOptions.emit(value);
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
    this.loadInitialOptions.emit(value);
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
    // Set a 1 second delay before closing
    this.closeDropdownTimeout = setTimeout(() => {
      this.filterDropdownOpen.set(false);
      this.closeDropdownTimeout = null;
    }, 1000);
  }

  selectOption(option: string): void {
    this.filterValue.set(option);
    this.filterChange.emit(option);
    this.filterDropdownOpen.set(false);
    if (this.closeDropdownTimeout) {
      clearTimeout(this.closeDropdownTimeout);
      this.closeDropdownTimeout = null;
    }
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
      this.isLoadingMore.set(true);
      const currentSearchTerm = this.filterValue();
      this.loadMoreOptions.emit(currentSearchTerm);
    }
  }

  onLoadMoreComplete(): void {
    this.isLoadingMore.set(false);
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