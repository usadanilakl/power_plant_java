import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FloatingMenuComponent, MenuPosition } from '../../menu/floating-menu/floating-menu.component';
import { FieldSelectorComponent } from '../field-selector/field-selector.component';
import { RfReactiveFormComponent } from '../../reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { TableBulkEditService, BulkEditFieldDefinition } from '../../table/refactored/services/table-bulk-edit.service';
import { RfFormField } from '../../../models/ui/form-field.model';

@Component({
  selector: 'app-bulk-edit-menu',
  standalone: true,
  imports: [CommonModule, FloatingMenuComponent, FieldSelectorComponent, RfReactiveFormComponent],
  templateUrl: './bulk-edit-menu.component.html',
  styleUrl: './bulk-edit-menu.component.css'
})
export class BulkEditMenuComponent<T> {
  // Inputs
  items = input.required<T[]>();
  service = input.required<TableBulkEditService<T>>();
  open = input<boolean>(false);
  title = input<string>('Bulk Edit');

  // Outputs
  applied = output<T[]>();
  close = output<void>();

  // Menu position
  MenuPosition = MenuPosition;

  // Local state
  showFieldSelector = signal<boolean>(true);

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

  // Computed: Template values from service
  templateValues = computed(() => {
    const svc = this.service();
    return svc ? svc.templateValues() : {};
  });

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

  /**
   * Handle field selection change
   */
  onFieldSelectionChange(fieldNames: string[]): void {
    this.service().setFieldSelection(fieldNames);
  }

  /**
   * Handle form value changes
   */
  onFormValueChange(values: any): void {
    this.service().setTemplateValues(values);
  }

  /**
   * Apply bulk edit to items
   */
  onApply(): void {
    const svc = this.service();
    const items = this.items();

    svc.applyToItems(items).subscribe({
      next: (result) => {
        if (result.successCount > 0) {
          this.applied.emit(result.successful);

          if (result.failureCount === 0) {
            // All succeeded, close the menu
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
   * Convert BulkEditFieldDefinition to RfFormField
   */
  private convertToFormField(field: BulkEditFieldDefinition): RfFormField {
    return {
      name: field.name,
      label: field.label,
      type: field.type as any,
      readonly: field.readonly || false
    };
  }
}
