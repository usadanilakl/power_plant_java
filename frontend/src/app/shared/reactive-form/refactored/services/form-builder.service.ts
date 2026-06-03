import { Injectable, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { RfFormField } from '../../../../models/ui/form-field.model';

@Injectable({
  providedIn: 'root'
})
export class FormBuilderService {
  private fb = inject(FormBuilder);

  /**
   * Creates a FormGroup from field definitions and entity data
   */
  createFormFromFields(fields: RfFormField[], entity: any): FormGroup {
    const group: { [key: string]: any } = {};

    fields.forEach((field) => {
      if (field && field.name) {
        if (field.type === 'form-array') {
          this.addFormArrayControl(group, field, entity);
        } else if (field.type === 'group') {
          this.addFormGroupControl(group, field, entity);
        } else {
          this.addFormControl(group, field, entity);
        }
      }
    });

    return this.fb.group(group);
  }

  /**
   * Creates a FormArray control
   */
  private addFormArrayControl(group: { [key: string]: any }, field: RfFormField, entity: any): void {
    const arrayData = this.getNestedValue(entity, field.name) || [];
    const formArray = this.fb.array(
      arrayData.map((item: any) => this.createArrayItem(field.fields ?? [], item))
    );
    this.setNestedControl(group, field.name, formArray);
  }

  /**
   * Creates a FormGroup control for nested objects
   */
  private addFormGroupControl(group: { [key: string]: any }, field: RfFormField, entity: any): void {
    const nestedData = this.getNestedValue(entity, field.name) || {};
    const nestedGroup = this.createNestedGroup(field.fields ?? [], nestedData);
    this.setNestedControl(group, field.name, nestedGroup);
  }

  /**
   * Creates a regular FormControl.
   *
   * Prefer the explicit {@code field.initialValue} (when set) over the raw
   * entity value. The mapper layer already pre-extracts IDs from nested DTOs
   * (e.g. `fileType: file.fileType?.id`) into initialValue, so using it here
   * matches what value-select / multi-value-select / phrase-builder fields
   * expect — a primitive ID, not the full ValueDto object. Without this,
   * dropdowns rendered empty for existing items because the form control held
   * `{id, name, ...}` while the select looked up its label by ID.
   */
  private addFormControl(group: { [key: string]: any }, field: RfFormField, entity: any): void {
    let value = field.initialValue !== undefined
      ? field.initialValue
      : this.getNestedValue(entity, field.name);

    // Handle special field types
    value = this.normalizeValueByType(field.type, value);

    this.setNestedControl(
      group,
      field.name,
      new FormControl(value, field.validators || [])
    );
  }

  /**
   * Normalizes values based on field type
   */
  private normalizeValueByType(type: string, value: any): any {
    if (type === 'file') {
      return null;
    }

    if (type === 'checkbox-group' || type === 'multi-input') {
      return value || [];
    }

    // Extract `.id` from full Value/Equipment/etc. DTOs for any single-select
    // family (select, value-select, work-area-select, loto-standard-select,
    // user-select with strict mode). Without this, a mapper that hands the
    // raw entity object would leave the form control holding `{id, name, ...}`,
    // which the searchable-select can't match against its options (it compares
    // option.value == control.value, never matches an object).
    if (
      (type === 'select' ||
        type === 'value-select' ||
        type === 'work-area-select' ||
        type === 'loto-standard-select' ||
        type === 'user-select') &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      value.id != null
    ) {
      return value.id;
    }

    // Multi-selects: ensure array shape + extract `.id` from each element that
    // happens to be an object.
    if (type === 'multi-select' || type === 'multi-value-select') {
      if (!Array.isArray(value)) return [];
      return value.map((v: any) =>
        v && typeof v === 'object' && v.id != null ? v.id : v
      );
    }

    if (type === 'date' && !value) {
      return new Date().toISOString().split('T')[0];
    }

    if (type === 'time' && !value) {
      return new Date().toTimeString().slice(0, 5);
    }

    return value;
  }

  /**
   * Creates a FormGroup for array items
   */
  createArrayItem(fields: RfFormField[], data: any = {}): FormGroup {
    const group = this.fb.group({});
    fields.forEach((field) => {
      const value = data[field.name] ?? field.initialValue ?? '';
      group.addControl(field.name, this.fb.control(value, field.validators));
    });
    return group;
  }

  /**
   * Creates a nested FormGroup for group fields
   */
  private createNestedGroup(fields: RfFormField[], data: any = {}): FormGroup {
    const group = this.fb.group({});
    fields.forEach((field) => {
      // Prefer explicitly set initialValue over data[field.name]
      // This allows field configs to transform data (e.g., extract ID from object)
      let value = field.initialValue !== undefined ? field.initialValue : data[field.name];

      // Handle special field types
      value = this.normalizeValueByType(field.type, value);

      group.addControl(field.name, this.fb.control(value, field.validators));
    });
    return group;
  }

  /**
   * Sets a nested control in the form group
   */
  private setNestedControl(
    group: { [key: string]: any },
    path: string,
    control: FormControl | FormArray | FormGroup
  ): void {
    const pathParts = path.split('.');
    let currentGroup: any = group;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!currentGroup[part]) {
        currentGroup[part] = this.fb.group({});
      }
      currentGroup = currentGroup[part];
    }

    const lastPart = pathParts[pathParts.length - 1];
    if (currentGroup instanceof FormGroup) {
      currentGroup.addControl(lastPart, control);
    } else {
      currentGroup[lastPart] = control;
    }
  }

  /**
   * Gets nested value from an object using dot notation
   * Public to allow form component to access it for value normalization
   */
  public getNestedValue(obj: any, path: string): any {
    if (!obj || !path) {
      return null;
    }
    return path
      .split('.')
      .reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }
}
