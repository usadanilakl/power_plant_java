
import { CommonModule } from '@angular/common';
import { Component, input, output, signal, ViewChild, ElementRef, effect, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Column } from '../../../../models/column.model';

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
  
  column = input.required<Column>();
  filterValue = input<string>('');
  uniqueValues = input<string[]>([]);
  
  filterChange = output<string>();
  optionSelected = output<string>();
  loadInitialOptions = output<string>();
  loadMoreOptions = output<string>();

  filterDropdownOpen = signal(false);
  filteredOptions = signal<string[]>([]);
  dropdownStyle = signal<{ [key: string]: string }>({});
  isLoadingMore = signal(false);

  constructor(private cdr: ChangeDetectorRef) {
    effect(() => {
      const values = this.uniqueValues();
      console.log('uniqueValues input received in child:', values);
      console.log('filterDropdownOpen:', this.filterDropdownOpen());
    });
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterChange.emit(value);
    
    // Filter options as user types
    const searchTerm = value.toLowerCase();
    const filtered = this.uniqueValues().filter(option =>
      option.toLowerCase().includes(searchTerm)
    );
    this.filteredOptions.set(filtered);
  }
  
  onInputFocus(event: Event): void {
    console.log('onInputFocus - uniqueValues:', this.uniqueValues());
    this.filterDropdownOpen.set(true);
    
    // Show all options or filtered based on current input
    const currentValue = (event.target as HTMLInputElement).value.toLowerCase();
    if (currentValue === '') {
      this.filteredOptions.set(this.uniqueValues());
    } else {
      const filtered = this.uniqueValues().filter(option =>
        option.toLowerCase().includes(currentValue)
      );
      this.filteredOptions.set(filtered);
    }
    
    console.log('Dropdown opened, options:', this.filteredOptions());
    
    // Position the dropdown below the input
    this.positionDropdown(event.target as HTMLInputElement);
  }

  onInputBlur(event: Event): void {
    setTimeout(() => {
      this.filterDropdownOpen.set(false);
    }, 200);
  }

  selectOption(option: string): void {
    this.filterChange.emit(option);
    this.filterDropdownOpen.set(false);
  }

  clearFilter(): void {
    this.filterChange.emit('');
    this.filterDropdownOpen.set(false);
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
// import { Column } from '../../../../models/column.model';

// @Component({
//   selector: 'app-column-filter-input',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './column-filter-input.component.html',
//   styleUrl: './column-filter-input.component.css'
// })
// export class ColumnFilterInputComponent {
//   @ViewChild('inputElement') inputElement?: ElementRef<HTMLInputElement>;
  
//   column = input.required<Column>();
//   filterValue = input<string>('');
//   uniqueValues = input<string[]>([]);
  
//   filterChange = output<string>();
//   optionSelected = output<string>();

//   filterDropdownOpen = signal(false);
//   filteredOptions = signal<string[]>([]);
//   dropdownStyle = signal<{ [key: string]: string }>({});

//   constructor(private cdr: ChangeDetectorRef) {
//     effect(() => {
//       const values = this.uniqueValues();
//       console.log('uniqueValues input received in child:', values);
//       console.log('filterDropdownOpen:', this.filterDropdownOpen());
//     });
//   }

  
//   onInputChange(event: Event): void {
//     const value = (event.target as HTMLInputElement).value;
//     this.filterChange.emit(value);
    
//     // Filter options as user types
//     const searchTerm = value.toLowerCase();
//     const filtered = this.uniqueValues().filter(option =>
//       option.toLowerCase().includes(searchTerm)
//     );
//     this.filteredOptions.set(filtered);
//   }
  
//   onInputFocus(event: Event): void {
//     console.log('onInputFocus - uniqueValues:', this.uniqueValues());
//     this.filterDropdownOpen.set(true);
    
//     // Show all options or filtered based on current input
//     const currentValue = (event.target as HTMLInputElement).value.toLowerCase();
//     if (currentValue === '') {
//       this.filteredOptions.set(this.uniqueValues());
//     } else {
//       const filtered = this.uniqueValues().filter(option =>
//         option.toLowerCase().includes(currentValue)
//       );
//       this.filteredOptions.set(filtered);
//     }
    
//     console.log('Dropdown opened, options:', this.filteredOptions());
    
//     // Position the dropdown below the input
//     this.positionDropdown(event.target as HTMLInputElement);
//   }

//   onInputBlur(event: Event): void {
//     setTimeout(() => {
//       this.filterDropdownOpen.set(false);
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
// }