import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoPointDto, LotoPointModel } from '../../../../models/loto/loto-point.model';
import { DraftMetadata } from '../../../../shared/draft/base-draft.service';
import { LotoPointLocalStorageService } from '../services/rf-loto-point-local-storage.service';
import { RfFormField } from '../../../../models/ui/form-field.model';

@Component({
  selector: 'app-draft-comparison-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './draft-comparison-dialog.component.html',
  styleUrls: ['./draft-comparison-dialog.component.css']
})
export class DraftComparisonDialogComponent {
  private localStorageService = inject(LotoPointLocalStorageService);

  // Inputs
  currentVersion = input.required<LotoPointDto>(); // Saved version from server
  draft = input.required<DraftMetadata<LotoPointModel>>(); // Draft from localStorage
  fields = input<RfFormField[]>([]); // Form fields configuration (optional)

  // Outputs
  useCurrent = output<void>();
  useDraft = output<void>();
  cancel = output<void>();

  // Computed
  draftAge = computed(() => {
    return this.localStorageService.getDraftAge(this.draft());
  });

  // Fields to compare - derived from form fields or fallback to common fields
  fieldsToCompare = computed(() => {
    const formFields = this.fields();

    // If fields provided, use ALL of them (smart formatting will handle complex types)
    if (formFields && formFields.length > 0) {
      return formFields.map(field => ({
        key: field.name,
        label: field.label,
        type: field.type
      }));
    }

    // Fallback to common fields if no fields provided (backwards compatible)
    return [
      { key: 'tagNumber', label: 'Tag Number', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'unit', label: 'Unit', type: 'text' },
      { key: 'specificLocation', label: 'Specific Location', type: 'text' },
      { key: 'generalLocation', label: 'General Location', type: 'text' },
      { key: 'tagged', label: 'Tagged', type: 'text' },
      { key: 'normalPosition', label: 'Normal Position', type: 'text' },
      { key: 'isolatedPosition', label: 'Isolated Position', type: 'text' },
      { key: 'zeroEnergyMethod', label: 'Zero Energy Method', type: 'text' }
    ];
  });

  // Get value from current or draft
  getCurrentValue(key: string): any {
    return (this.currentVersion() as any)[key];
  }

  getDraftValue(key: string): any {
    return (this.draft().formData as any)[key];
  }

  // Check if values differ (handles all field types including arrays and objects)
  isDifferent(key: string): boolean {
    const currentValue = this.getCurrentValue(key);
    const draftValue = this.getDraftValue(key);

    // Handle null/undefined comparisons
    if (currentValue == null && draftValue == null) return false;
    if (currentValue == null || draftValue == null) return true;

    // Handle array comparisons
    if (Array.isArray(currentValue) && Array.isArray(draftValue)) {
      // Different lengths = different
      if (currentValue.length !== draftValue.length) return true;

      // Empty arrays are same
      if (currentValue.length === 0) return false;

      // Compare arrays of objects by ID
      if (currentValue[0] && typeof currentValue[0] === 'object' && currentValue[0].id) {
        const currentIds = currentValue.map(item => item.id).sort();
        const draftIds = draftValue.map(item => item.id).sort();
        return JSON.stringify(currentIds) !== JSON.stringify(draftIds);
      }

      // Compare arrays of primitives
      return JSON.stringify(currentValue.sort()) !== JSON.stringify(draftValue.sort());
    }

    // Handle object comparisons
    if (typeof currentValue === 'object' && typeof draftValue === 'object') {
      // Compare by ID if available AND non-zero (ValueDto objects have id: 0 when empty)
      if (currentValue.id !== undefined && draftValue.id !== undefined) {
        // Both have ID = 0 means both are empty/unselected
        if (currentValue.id === 0 && draftValue.id === 0) return false;

        // Different IDs or one is 0 and the other isn't
        return currentValue.id !== draftValue.id;
      }

      // Deep comparison for other objects
      return JSON.stringify(currentValue) !== JSON.stringify(draftValue);
    }

    // Handle primitive comparisons (string, number, boolean)
    return currentValue !== draftValue;
  }

  // Format value for display (handles all field types)
  formatValue(value: any): string {
    // Handle null/undefined
    if (value == null) return '-';

    // Handle arrays (equipment lists, form arrays, etc.)
    if (Array.isArray(value)) {
      if (value.length === 0) return '(empty)';

      // If array of objects with names
      if (value[0] && typeof value[0] === 'object' && value[0].name) {
        return value.map(item => item.name).join(', ');
      }

      // If array of objects with IDs
      if (value[0] && typeof value[0] === 'object' && value[0].id) {
        return `${value.length} item${value.length > 1 ? 's' : ''} (IDs: ${value.map(item => item.id).join(', ')})`;
      }

      // Array of primitives
      return value.join(', ');
    }

    // Handle objects (ValueDto, nested groups, etc.)
    if (typeof value === 'object') {
      // Object with name property (most common)
      if (value.name) return value.name;

      // Object with id property
      if (value.id !== undefined) return `ID: ${value.id}`;

      // Coordinates object (for equipment shapes)
      if (value.coordinates) return `Coordinates: ${value.coordinates}`;

      // Generic object - show keys count
      const keys = Object.keys(value).filter(k => value[k] != null);
      return `{${keys.length} field${keys.length > 1 ? 's' : ''}}`;
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Handle primitives (string, number, etc.)
    return String(value);
  }

  onUseCurrent(): void {
    this.useCurrent.emit();
  }

  onUseDraft(): void {
    this.useDraft.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
