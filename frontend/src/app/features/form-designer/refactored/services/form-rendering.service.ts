import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { FormField } from '../../../../models/ui/form-field.model';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';

/**
 * Handles form generation from form definitions
 */
@Injectable({
  providedIn: 'root'
})
export class FormRenderingService {
  private fb = inject(FormBuilder);

  /**
   * Creates a FormGroup from a form definition and initial data
   */
  createFormFromDefinition(
    formDefinition: PrintableFormDto,
    formData: any,
    existingForm?: FormGroup
  ): FormGroup {
    if (!formDefinition || !formDefinition.formContainers) {
      return this.fb.group({});
    }

    const fields = this.getAllFormFields(formDefinition);
    const form = this.fb.group({});

    for (const field of fields) {
      const fieldName = field.name || '';
      if (!fieldName) continue;

      // Check if control already exists in existing form
      const existingControl = existingForm?.get(fieldName);

      if (field.type === 'form-array') {
        if (existingControl instanceof FormArray) {
          // Reuse existing FormArray to prevent data loss
          form.addControl(fieldName, existingControl);
        } else {
          const arrayData = this.getNestedValue(formData, fieldName) || [];
          const formArray = this.createFormArray(field, arrayData);
          form.addControl(fieldName, formArray);
        }
      } else {
        if (existingControl) {
          // Reuse existing control
          form.addControl(fieldName, existingControl);
        } else {
          const value = this.getNestedValue(formData, fieldName);
          const validators = field.validators || [];
          form.addControl(fieldName, new FormControl(value, validators));
        }
      }
    }

    return form;
  }

  /**
   * Creates a FormArray from field definition and data
   */
  createFormArray(field: FormField, arrayData: any[]): FormArray {
    const formArray = this.fb.array([]);

    if (!Array.isArray(arrayData)) {
      return formArray;
    }

    const nestedFields = field.nestedForm?.formContainers
      ?.filter((c: any) => c.contentType === 'formField' && this.isFormField(c.content))
      .map((c: any) => c.content as FormField) || [];

    for (const item of arrayData) {
      const group = this.createArrayItem(nestedFields, item);
      formArray.push(group as any);
    }

    return formArray;
  }

  /**
   * Creates a single form array item
   */
  createArrayItem(fields: FormField[], data: any = {}): FormGroup {
    const group: any = {};

    for (const field of fields) {
      const fieldName = field.name || '';
      if (!fieldName) continue;

      const value = this.getNestedValue(data, fieldName);

      if (field.type === 'form-array') {
        const nestedData = value || [];
        group[fieldName] = this.createFormArray(field, nestedData);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Convert nested object to FormGroup
        group[fieldName] = this.convertToFormGroup(value) as any;
      } else {
        const validators = field.validators || [];
        group[fieldName] = [value, validators];
      }
    }

    return this.fb.group(group);
  }

  /**
   * Converts a plain object to a FormGroup recursively
   */
  convertToFormGroup(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object' || Array.isArray(obj)) {
      return new FormControl(obj);
    }

    const group: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          group[key] = this.convertToFormGroup(value);
        } else {
          group[key] = new FormControl(value);
        }
      }
    }

    return this.fb.group(group);
  }

  /**
   * Extracts all form fields from a form definition
   */
  getAllFormFields(formDefinition: PrintableFormDto): FormField[] {
    if (!formDefinition || !formDefinition.formContainers) {
      return [];
    }

    const fields: FormField[] = [];
    const seen = new Set<string>();

    for (const container of formDefinition.formContainers) {
      if (container.contentType === 'formField' && this.isFormField(container.content)) {
        const field = container.content as FormField;
        const fieldName = field.name || '';

        // Avoid duplicates (important for paginated form arrays)
        if (fieldName && !seen.has(fieldName)) {
          fields.push(field);
          seen.add(fieldName);
        }
      }
    }

    return fields;
  }

  /**
   * Deep merges form values with original entity data
   */
  deepMerge(target: any, source: any): any {
    if (!source || typeof source !== 'object') {
      return target;
    }

    if (!target || typeof target !== 'object') {
      return source;
    }

    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (Array.isArray(sourceValue)) {
          // For arrays, use source value
          result[key] = sourceValue;
        } else if (
          typeof sourceValue === 'object' &&
          sourceValue !== null &&
          typeof targetValue === 'object' &&
          targetValue !== null &&
          !Array.isArray(targetValue)
        ) {
          // Recursively merge objects
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          // For primitives, use source value
          result[key] = sourceValue;
        }
      }
    }

    return result;
  }

  /**
   * Gets value at nested path in an object
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) {
      return null;
    }
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }

  /**
   * Type guard for FormField
   */
  private isFormField(content: any): content is FormField {
    return content && typeof content === 'object' && 'name' in content && 'type' in content;
  }

  /**
   * Gets styles for a container
   */
  getContainerStyles(container: any): any {
    const styles: any = {
      ...container.style,
      position: 'absolute',
      left: `${container.position.x}px`,
      top: `${container.position.y}px`,
      width: `${container.size.width}px`,
      height: `${container.size.height}px`,
    };

    return styles;
  }

  /**
   * Gets styles for container content
   */
  getContentStyles(container: any): any {
    if (!container.contentStyle) {
      return {};
    }
    const styles = { ...container.contentStyle };
    if (styles.fontSize && typeof styles.fontSize === 'number') {
      styles.fontSize = `${styles.fontSize}px`;
    }
    return styles;
  }
}
