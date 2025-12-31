import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BulkEditFieldDefinition } from '../../table/refactored/services/table-bulk-edit.service';

@Component({
  selector: 'app-field-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './field-selector.component.html',
  styleUrl: './field-selector.component.css'
})
export class FieldSelectorComponent {
  // Inputs
  fields = input.required<BulkEditFieldDefinition[]>();
  selectedFields = input<string[]>([]);

  // Outputs
  selectionChange = output<string[]>();

  // Local state
  searchTerm = signal<string>('');

  // Computed: Group fields by category
  groupedFields = computed(() => {
    const fields = this.fields();
    const grouped = new Map<string, BulkEditFieldDefinition[]>();

    fields.forEach(field => {
      const category = field.category || 'General';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(field);
    });

    return Array.from(grouped.entries()).map(([category, categoryFields]) => ({
      category,
      fields: categoryFields
    }));
  });

  // Computed: Filtered fields based on search
  filteredGroupedFields = computed(() => {
    const search = this.searchTerm().toLowerCase();
    if (!search) {
      return this.groupedFields();
    }

    return this.groupedFields()
      .map(group => ({
        category: group.category,
        fields: group.fields.filter(field =>
          field.label.toLowerCase().includes(search) ||
          field.name.toLowerCase().includes(search)
        )
      }))
      .filter(group => group.fields.length > 0);
  });

  // Computed: Are all fields selected?
  allSelected = computed(() => {
    const totalFields = this.fields().length;
    const selectedCount = this.selectedFields().length;
    return totalFields > 0 && selectedCount === totalFields;
  });

  // Computed: Are some but not all fields selected?
  someSelected = computed(() => {
    const selectedCount = this.selectedFields().length;
    return selectedCount > 0 && !this.allSelected();
  });

  /**
   * Toggle a single field selection
   */
  toggleField(fieldName: string): void {
    const currentSelection = this.selectedFields();
    const isSelected = currentSelection.includes(fieldName);

    const newSelection = isSelected
      ? currentSelection.filter(f => f !== fieldName)
      : [...currentSelection, fieldName];

    this.selectionChange.emit(newSelection);
  }

  /**
   * Check if a field is selected
   */
  isFieldSelected(fieldName: string): boolean {
    return this.selectedFields().includes(fieldName);
  }

  /**
   * Select all fields
   */
  selectAll(): void {
    const allFieldNames = this.fields().map(f => f.name);
    this.selectionChange.emit(allFieldNames);
  }

  /**
   * Deselect all fields
   */
  deselectAll(): void {
    this.selectionChange.emit([]);
  }

  /**
   * Update search term
   */
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchTerm.set('');
  }
}
