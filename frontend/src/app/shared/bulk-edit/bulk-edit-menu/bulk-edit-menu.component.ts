import { Component, input, output, signal, computed, effect, forwardRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FloatingMenuComponent, MenuPosition } from '../../menu/floating-menu/floating-menu.component';
import { FieldSelectorComponent } from '../field-selector/field-selector.component';
import { RfReactiveFormComponent } from '../../reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { ClipboardFormComponent } from '../../reactive-form/refactored/form-clipboard/clipboard-form.component';
import { TableBulkEditService, BulkEditFieldDefinition } from '../../table/refactored/services/table-bulk-edit.service';
import { RfFormField } from '../../../models/ui/form-field.model';

/** Preset data stored in localStorage */
interface BulkEditPreset {
  selectedFields: string[];
  templateValues: Record<string, any>;
  savedAt: number;
}

@Component({
  selector: 'app-bulk-edit-menu',
  standalone: true,
  // forwardRef on rf-reactive-form breaks the import cycle (see loto-point-bulk-edit-form).
  imports: [CommonModule, FloatingMenuComponent, FieldSelectorComponent, forwardRef(() => RfReactiveFormComponent), ClipboardFormComponent],
  templateUrl: './bulk-edit-menu.component.html',
  styleUrl: './bulk-edit-menu.component.css'
})
export class BulkEditMenuComponent<T> implements OnInit, OnDestroy {
  // Inputs
  items = input.required<T[]>();
  service = input.required<TableBulkEditService<T>>();
  open = input<boolean>(false);
  title = input<string>('Bulk Edit');
  /** Unique key for localStorage persistence (e.g., 'loto-point-bulk-edit') */
  storageKey = input<string>('');
  /** Whether to keep the dialog open after applying changes */
  persistAfterApply = input<boolean>(true);

  // Outputs
  applied = output<T[]>();
  close = output<void>();
  /**
   * Emitted before applying changes - allows parent to intercept and handle custom logic
   * If handled, the parent should call applyChanges() on the service directly
   */
  beforeApply = output<{ items: T[], proceed: () => void }>();

  // Menu position
  MenuPosition = MenuPosition;

  // Local state
  showFieldSelector = signal<boolean>(true);
  /** Track last successful apply for UI feedback */
  lastApplyResult = signal<{ count: number; timestamp: number } | null>(null);
  /** Whether preset was loaded from storage */
  hasLoadedPreset = signal<boolean>(false);

  // Local copy of template values to prevent infinite loop
  private localTemplateValues = signal<Partial<T>>({});
  private isUpdatingFromService = false;
  private presetLoaded = false;

  // Computed: Available fields from service
  availableFields = computed(() => {
    const svc = this.service();
    return svc ? svc.getAvailableFields() : [];
  });

  // Computed: Selected field names from service
  selectedFieldNames = computed(() => {
    const svc = this.service();
    return svc ? svc.selectedFieldNames() : [];
  });

  // Use local signal for template values to prevent infinite updates
  templateValues = this.localTemplateValues.asReadonly();

  constructor() {
    // Sync service template values to local signal
    effect(() => {
      const svc = this.service();
      if (svc) {
        const serviceValues = svc.templateValues();
        this.isUpdatingFromService = true;
        this.localTemplateValues.set(serviceValues);
        this.isUpdatingFromService = false;
      }
    });

    // Save preset to localStorage when values change
    effect(() => {
      const key = this.storageKey();
      const selectedFields = this.selectedFieldNames();
      const templateValues = this.templateValues();

      // Only save if we have a storage key and preset has been loaded (to avoid overwriting on init)
      if (key && this.presetLoaded && (selectedFields.length > 0 || Object.keys(templateValues).length > 0)) {
        this.savePresetToStorage();
      }
    });

    // Load preset when dialog opens
    effect(() => {
      const isOpen = this.open();
      const key = this.storageKey();

      if (isOpen && key && !this.presetLoaded) {
        this.loadPresetFromStorage();
      }
    });
  }

  ngOnInit(): void {
    // Initial preset load handled by effect
  }

  ngOnDestroy(): void {
    // Save preset on destroy
    if (this.storageKey()) {
      this.savePresetToStorage();
    }
  }

  // Computed: Is updating from service
  isUpdating = computed(() => {
    const svc = this.service();
    return svc ? svc.isUpdating() : false;
  });

  // Computed: Error message from service
  errorMessage = computed(() => {
    const svc = this.service();
    return svc ? svc.errorMessage() : null;
  });

  // Computed: Progress from service
  progress = computed(() => {
    const svc = this.service();
    return svc ? svc.progress() : 0;
  });

  // Computed: Can apply from service
  canApply = computed(() => {
    const svc = this.service();
    return svc ? svc.canApply() : false;
  });

  // Computed: Form fields for selected fields only
  formFields = computed(() => {
    const selected = this.selectedFieldNames();
    const available = this.availableFields();

    return available
      .filter(field => selected.includes(field.name))
      .map(field => this.convertToFormField(field));
  });

  // Computed: Item count
  itemCount = computed(() => this.items().length);

  // Computed: Title with count
  menuTitle = computed(() => {
    const count = this.itemCount();
    const baseTitle = this.title();
    return `${baseTitle} (${count} item${count !== 1 ? 's' : ''})`;
  });

  // Computed: Show success message after apply
  showSuccessMessage = computed(() => {
    const result = this.lastApplyResult();
    if (!result) return false;
    // Show for 3 seconds after apply
    return Date.now() - result.timestamp < 3000;
  });

  // Clipboard configuration for bulk edit
  clipboardEntityType = input<string>(''); // Entity type for clipboard (e.g., 'LotoPoint')

  // Provide default functions for clipboard validation and formatting
  private defaultHasValidData = (entity: T): boolean => {
    if (!entity) return false;
    return Object.values(entity).some(value => value != null);
  };

  private defaultGetItemSummary = (item: T): string => {
    return JSON.stringify(item).substring(0, 50) + '...';
  };

  clipboardHasValidData = input<(entity: T) => boolean>(this.defaultHasValidData); // Function to validate clipboard items
  clipboardGetItemSummary = input<(item: T) => string>(this.defaultGetItemSummary); // Function to format clipboard item summary

  clipboardInitialEntity = computed(() => {
    // Use template values as initial entity for clipboard
    return this.templateValues() as T;
  });

  /**
   * Handle field selection change
   */
  onFieldSelectionChange(fieldNames: string[]): void {
    this.service().setFieldSelection(fieldNames);
  }

  /**
   * Handle form value changes
   * Only update if not coming from service to prevent infinite loop
   */
  onFormValueChange(values: any): void {
    // Don't update service if we're currently syncing from service
    if (this.isUpdatingFromService) {
      return;
    }

    this.service().setTemplateValues(values);
  }

  /**
   * Apply bulk edit to items
   * Emits beforeApply event to allow parent to intercept
   */
  onApply(): void {
    const svc = this.service();
    const items = this.items();

    // Emit beforeApply to allow parent to intercept
    // Parent can show confirmation dialogs, etc.
    this.beforeApply.emit({
      items,
      proceed: () => this.executeApply()
    });
  }

  /**
   * Execute the actual apply operation
   * Can be called directly by parent after handling beforeApply
   */
  executeApply(): void {
    const svc = this.service();
    const items = this.items();

    svc.applyToItems(items).subscribe({
      next: (result) => {
        if (result.successCount > 0) {
          this.applied.emit(result.successful);

          // Record success for UI feedback
          this.lastApplyResult.set({
            count: result.successCount,
            timestamp: Date.now()
          });

          // Clear success message after 3 seconds
          setTimeout(() => {
            this.lastApplyResult.set(null);
          }, 3000);

          // Only close if persistAfterApply is false
          if (!this.persistAfterApply() && result.failureCount === 0) {
            this.onClose();
          }
        }
      },
      error: (error) => {
        console.error('Bulk edit failed:', error);
      }
    });
  }

  /**
   * Close the menu
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Toggle field selector visibility
   */
  toggleFieldSelector(): void {
    this.showFieldSelector.update(show => !show);
  }

  /**
   * Handle clipboard item selection
   */
  onClipboardItemSelected(item: any): void {
    console.log('[BulkEditMenu] Clipboard item selected:', item);
    console.log('[BulkEditMenu] Zero energy in clipboard item:', item.zeroEnergy);
    this.service().setTemplateValues(item);
  }

  /**
   * Clear all field selections and template values
   * Also clears the localStorage preset
   */
  onClearAll(): void {
    const svc = this.service();
    if (svc) {
      svc.setFieldSelection([]);
      svc.setTemplateValues({});
    }

    // Clear from localStorage
    const key = this.storageKey();
    if (key) {
      try {
        localStorage.removeItem(this.getStorageKeyName());
      } catch (e) {
        console.warn('[BulkEditMenu] Failed to clear preset from localStorage:', e);
      }
    }

    this.hasLoadedPreset.set(false);
  }

  /**
   * Save current preset to localStorage
   */
  private savePresetToStorage(): void {
    const key = this.storageKey();
    if (!key) return;

    try {
      const preset: BulkEditPreset = {
        selectedFields: this.selectedFieldNames(),
        templateValues: this.templateValues() as Record<string, any>,
        savedAt: Date.now()
      };

      localStorage.setItem(this.getStorageKeyName(), JSON.stringify(preset));
    } catch (e) {
      console.warn('[BulkEditMenu] Failed to save preset to localStorage:', e);
    }
  }

  /**
   * Load preset from localStorage
   */
  private loadPresetFromStorage(): void {
    const key = this.storageKey();
    if (!key) {
      this.presetLoaded = true;
      return;
    }

    try {
      const stored = localStorage.getItem(this.getStorageKeyName());
      if (stored) {
        const preset: BulkEditPreset = JSON.parse(stored);

        // Validate preset has required fields
        if (preset.selectedFields && Array.isArray(preset.selectedFields)) {
          const svc = this.service();
          if (svc) {
            // Set field selection first
            if (preset.selectedFields.length > 0) {
              svc.setFieldSelection(preset.selectedFields);
            }

            // Then set template values
            if (preset.templateValues && Object.keys(preset.templateValues).length > 0) {
              svc.setTemplateValues(preset.templateValues as Partial<T>);
            }

            this.hasLoadedPreset.set(true);
          }
        }
      }
    } catch (e) {
      console.warn('[BulkEditMenu] Failed to load preset from localStorage:', e);
    }

    this.presetLoaded = true;
  }

  /**
   * Get the full storage key name
   */
  private getStorageKeyName(): string {
    return `bulk-edit-preset-${this.storageKey()}`;
  }

  /**
   * Convert BulkEditFieldDefinition to RfFormField
   * Preserves nested fields for group types
   */
  private convertToFormField(field: BulkEditFieldDefinition): RfFormField {
    const formField: RfFormField = {
      name: field.name,
      label: field.label,
      type: field.type as any,
      categoryAlias: field.categoryAlias, // Use categoryAlias for value-select fields
      readonly: field.readonly || false
    };

    // Preserve nested fields for group types (e.g., zeroEnergy)
    if ((field as any).fields) {
      (formField as any).fields = (field as any).fields;
    }

    return formField;
  }
}
