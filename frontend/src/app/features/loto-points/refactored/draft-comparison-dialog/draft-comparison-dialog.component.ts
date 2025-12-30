import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfFormField } from '../../../../models/ui/form-field.model';

@Component({
  selector: 'app-draft-comparison-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './draft-comparison-dialog.component.html',
  styleUrls: ['./draft-comparison-dialog.component.css']
})
export class DraftComparisonDialogComponent {
  // Inputs - direct entity comparison
  serverVersion = input.required<LotoPointDto>(); // Version from server
  draftVersion = input.required<LotoPointDto>(); // Version from localStorage/draft
  draftTimestamp = input.required<string>(); // ISO timestamp of when draft was saved
  fields = input<RfFormField[]>([]); // Form fields configuration (optional)

  // Outputs
  useServer = output<void>(); // Use server version
  useDraft = output<void>(); // Use draft version
  cancel = output<void>();

  // Computed - calculate draft age from timestamp
  draftAge = computed(() => {
    const timestamp = this.draftTimestamp();
    const now = new Date();
    const draftTime = new Date(timestamp);
    const diffMs = now.getTime() - draftTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return draftTime.toLocaleDateString();
  });

  // Fields to compare - ONLY uses form fields if provided
  fieldsToCompare = computed(() => {
    const formFields = this.fields();

    // IMPORTANT: Only compare fields that are actually in the form
    // If no fields provided, don't show any comparison (shouldn't happen in practice)
    if (!formFields || formFields.length === 0) {
      console.warn('No form fields provided to draft comparison dialog');
      return [];
    }

    // Map form fields to comparison structure
    return formFields.map(field => ({
      key: field.name,
      label: field.label,
      type: field.type
    }));
  });

  // Get value from server or draft version
  getServerValue(key: string): any {
    return (this.serverVersion() as any)[key];
  }

  getDraftValue(key: string): any {
    return (this.draftVersion() as any)[key];
  }

  // Check if values differ (handles all field types including arrays and objects)
  isDifferent(key: string): boolean {
    const currentValue = this.getServerValue(key);
    const draftValue = this.getDraftValue(key);

    // Helper to check if value is effectively empty
    const isEffectivelyEmpty = (val: any): boolean => {
      if (val == null) return true;
      if (typeof val === 'object' && !Array.isArray(val)) {
        // Check if object is empty or only has null/0 id
        const keys = Object.keys(val).filter(k => {
          const v = val[k];
          if (v == null || v === '') return false;
          if (k === 'id' && (v === 0 || v === null)) return false;
          return true;
        });
        return keys.length === 0;
      }
      return false;
    };

    // If both are effectively empty, they're the same
    if (isEffectivelyEmpty(currentValue) && isEffectivelyEmpty(draftValue)) return false;

    // Handle null/undefined comparisons
    if (currentValue == null && draftValue == null) return false;

    // One is null/empty and the other isn't
    if (isEffectivelyEmpty(currentValue) || isEffectivelyEmpty(draftValue)) {
      return !isEffectivelyEmpty(currentValue) || !isEffectivelyEmpty(draftValue);
    }

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
      // Compare by ID if available
      if (currentValue.id !== undefined && draftValue.id !== undefined) {
        // Both have ID = 0 or null means both are empty/unselected
        if ((currentValue.id === 0 || currentValue.id === null) &&
            (draftValue.id === 0 || draftValue.id === null)) {
          return false;
        }

        // Different IDs or one is 0/null and the other isn't
        return currentValue.id !== draftValue.id;
      }

      // Check if both objects are effectively empty (no meaningful properties)
      const currentKeys = Object.keys(currentValue).filter(k => currentValue[k] != null && currentValue[k] !== '');
      const draftKeys = Object.keys(draftValue).filter(k => draftValue[k] != null && draftValue[k] !== '');

      // Both empty = same
      if (currentKeys.length === 0 && draftKeys.length === 0) return false;

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
      // Check if object is effectively empty (only has null/empty values or only has id=0/null)
      const meaningfulKeys = Object.keys(value).filter(k => {
        const val = value[k];
        // Filter out null, undefined, empty string, and id=0/null
        if (val == null || val === '') return false;
        if (k === 'id' && (val === 0 || val === null)) return false;
        return true;
      });

      // If no meaningful properties, treat as empty
      if (meaningfulKeys.length === 0) return '-';

      // Object with name property (most common - ValueDto, etc.)
      if (value.name) return value.name;

      // Object with id property but no name (show ID only if it's meaningful)
      if (value.id !== undefined && value.id !== 0 && value.id !== null) {
        return `ID: ${value.id}`;
      }

      // Coordinates object (for equipment shapes)
      if (value.coordinates) return `Coordinates: ${value.coordinates}`;

      // Generic object - show keys count
      return `{${meaningfulKeys.length} field${meaningfulKeys.length > 1 ? 's' : ''}}`;
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Handle primitives (string, number, etc.)
    return String(value);
  }

  onUseServer(): void {
    this.useServer.emit();
  }

  onUseDraft(): void {
    this.useDraft.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
