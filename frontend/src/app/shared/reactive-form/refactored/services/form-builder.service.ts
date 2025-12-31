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
   * Creates a regular FormControl
   */
  private addFormControl(group: { [key: string]: any }, field: RfFormField, entity: any): void {
    let value = this.getNestedValue(entity, field.name);
    
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

    if (type === 'checkbox-group' || type === 'multi-select' || type === 'multi-input') {
      return value || [];
    }

    if (type === 'select' && typeof value === 'object' && value !== null) {
      return value.id;
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

      console.log(`Creating nested field "${field.name}":`, {
        hasInitialValue: field.initialValue !== undefined,
        initialValue: field.initialValue,
        dataValue: data[field.name],
        chosenValue: value
      });

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
