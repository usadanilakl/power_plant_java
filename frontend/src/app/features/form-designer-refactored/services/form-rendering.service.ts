import { Injectable, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { FormField } from '../../../models/ui/form-field.model';
import { PrintableFormDto } from '../models/printable-form.model';

@Injectable({ providedIn: 'root' })
export class FormRenderingService {
  private fb = inject(FormBuilder);

  createFormFromDefinition(
    formDefinition: PrintableFormDto,
    formData: any,
    existingForm?: FormGroup,
  ): FormGroup {
    if (!formDefinition || !formDefinition.formContainers) {
      return this.fb.group({});
    }

    const fields = this.getAllFormFields(formDefinition);
    const form = this.fb.group({});

    for (const field of fields) {
      const name = field.name || '';
      if (!name) continue;

      const existing = existingForm?.get(name);

      if (field.type === 'form-array') {
        if (existing instanceof FormArray) {
          this.addControlByPath(form, name, existing);
        } else {
          const arrayData = this.getNestedValue(formData, name) || [];
          this.addControlByPath(form, name, this.createFormArray(field, arrayData));
        }
      } else {
        if (existing) {
          this.addControlByPath(form, name, existing);
        } else {
          let value = this.getNestedValue(formData, name);
          value = this.normalizeFieldValue(field, value);
          this.addControlByPath(form, name, new FormControl(value, field.validators || []));
        }
      }
    }

    return form;
  }

  createFormArray(field: FormField, arrayData: any[]): FormArray {
    const formArray = this.fb.array([]);
    if (!Array.isArray(arrayData)) return formArray;

    let nestedFields = field.nestedForm?.formContainers
      ?.filter((c: any) => c.contentType === 'formField' && this.isFormField(c.content))
      .map((c: any) => c.content as FormField) || [];

    // Fallback: use fields array directly (e.g. JHA job steps)
    if (nestedFields.length === 0 && field.fields && field.fields.length > 0) {
      nestedFields = field.fields;
    }

    for (const item of arrayData) {
      formArray.push(this.createArrayItem(nestedFields, item) as any);
    }

    return formArray;
  }

  createArrayItem(fields: FormField[], data: any = {}): FormGroup {
    const group: any = {};

    for (const field of fields) {
      const name = field.name || '';
      if (!name) continue;

      const value = this.getNestedValue(data, name);

      if (field.type === 'form-array') {
        group[name] = this.createFormArray(field, value || []);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        group[name] = this.convertToFormGroup(value) as any;
      } else {
        group[name] = [value, field.validators || []];
      }
    }

    return this.fb.group(group);
  }

  convertToFormGroup(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object' || Array.isArray(obj)) {
      return new FormControl(obj);
    }

    const group: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const val = obj[key];
        group[key] = typeof val === 'object' && val !== null && !Array.isArray(val)
          ? this.convertToFormGroup(val)
          : new FormControl(val);
      }
    }
    return this.fb.group(group);
  }

  getAllFormFields(formDefinition: PrintableFormDto): FormField[] {
    if (!formDefinition || !formDefinition.formContainers) return [];

    const fields: FormField[] = [];
    const seen = new Set<string>();

    for (const container of formDefinition.formContainers) {
      if (
        (container.contentType === 'formField' || container.contentType === 'repeatingSection') &&
        this.isFormField(container.content)
      ) {
        const field = container.content as FormField;
        const name = field.name || '';
        if (name && !seen.has(name)) {
          fields.push(field);
          seen.add(name);
        }
      }
    }

    return fields;
  }

  deepMerge(target: any, source: any): any {
    if (!source || typeof source !== 'object') return target;
    if (!target || typeof target !== 'object') return source;

    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sv = source[key];
        const tv = target[key];

        if (Array.isArray(sv)) {
          result[key] = sv;
        } else if (
          typeof sv === 'object' && sv !== null &&
          typeof tv === 'object' && tv !== null && !Array.isArray(tv)
        ) {
          result[key] = this.deepMerge(tv, sv);
        } else {
          result[key] = sv;
        }
      }
    }

    return result;
  }

  getContainerStyles(container: any): any {
    return {
      ...container.style,
      position: 'absolute',
      left: `${container.position.x}px`,
      top: `${container.position.y}px`,
      width: `${container.size.width}px`,
      height: `${container.size.height}px`,
    };
  }

  getContentStyles(container: any): any {
    if (!container.contentStyle) return {};
    const styles = { ...container.contentStyle };
    if (styles.fontSize && typeof styles.fontSize === 'number') {
      styles.fontSize = `${styles.fontSize}px`;
    }
    return styles;
  }

  private addControlByPath(form: FormGroup, path: string, control: AbstractControl): void {
    const parts = path.split('.');
    if (parts.length === 1) {
      if (!form.contains(path)) {
        form.addControl(path, control);
      }
      return;
    }
    let current = form;
    for (let i = 0; i < parts.length - 1; i++) {
      let child = current.get(parts[i]);
      if (!child || !(child instanceof FormGroup)) {
        child = new FormGroup({});
        current.addControl(parts[i], child as AbstractControl);
      }
      current = child as FormGroup;
    }
    const leafName = parts[parts.length - 1];
    if (!current.contains(leafName)) {
      current.addControl(leafName, control);
    }
  }

  private normalizeFieldValue(field: FormField, value: any): any {
    if (field.type === 'file') {
      return null;
    }
    if (field.type === 'checkbox-group' || field.type === 'multi-select' || field.type === 'multi-input') {
      return value || [];
    }
    if (field.type === 'select' && typeof value === 'object' && value !== null) {
      return value.id;
    }
    return value;
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return null;
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }

  private isFormField(content: any): content is FormField {
    return content && typeof content === 'object' && 'name' in content && 'type' in content;
  }
}
