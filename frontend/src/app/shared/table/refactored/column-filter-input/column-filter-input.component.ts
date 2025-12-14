
import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  column = input.required<Column>();
  filterValue = input<string>('');
  items = input<any[]>([]);
  
  filterChange = output<string>();
  optionSelected = output<string>();

  filterDropdownOpen = signal(false);
  columnUniqueValues = signal<string[]>([]);
  filteredOptions = signal<string[]>([]);

  // Effect now properly tracks signal inputs
  private updateUniqueValues = effect(() => {
    const currentItems = this.items();
    const currentColumn = this.column();
    
    if (currentItems && currentItems.length > 0 && currentColumn) {
      const uniqueValues = this.getUniqueColumnValues(currentItems, currentColumn);
      this.columnUniqueValues.set(uniqueValues);
      this.filteredOptions.set(uniqueValues);
    }
  });

  /**
   * Get unique values for this column from all items
   */
  private getUniqueColumnValues(items: any[], column: Column): string[] {
    const values = new Set<string>();
    console.log('Get unique values for column:', column);
    items.forEach(item => {
      const value = this.getCellValue(item, column);
      if (value) {
        values.add(String(value).toLowerCase());
      }
    });
    
    return Array.from(values).sort();
  }

  /**
   * Get cell value from item using the column's accessor
   */
  private getCellValue(item: any, column: Column): any {
    // Use accessorFn if available
    if (column.accessorFn) {
      return column.accessorFn(item);
    }
    
    // Fall back to accessorKey
    if (!column.accessorKey) return '';
    
    const keys = column.accessorKey.split('.');
    return keys.reduce((obj, key) => obj?.[key], item);
  }

  /**
   * Handle input change
   */
  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterChange.emit(value);
  }

  /**
   * Open filter dropdown
   */
  onInputFocus(): void {
    this.filterDropdownOpen.set(true);
  }

  /**
   * Close dropdown when clicking outside
   */
  onInputBlur(): void {
    setTimeout(() => this.filterDropdownOpen.set(false), 200);
  }

  /**
   * Handle search input in the filter
   */
  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    const allValues = this.columnUniqueValues();
    
    if (searchTerm === '') {
      this.filteredOptions.set(allValues);
    } else {
      const filtered = allValues.filter(value => 
        value.includes(searchTerm)
      );
      this.filteredOptions.set(filtered);
    }
  }

  /**
   * Select an option from the dropdown
   */
  selectOption(option: string): void {
    this.filterChange.emit(option);
    this.optionSelected.emit(option);
    this.filterDropdownOpen.set(false);
  }

  /**
   * Clear the filter
   */
  clearFilter(): void {
    this.filterChange.emit('');
    this.filteredOptions.set(this.columnUniqueValues());
  }
}