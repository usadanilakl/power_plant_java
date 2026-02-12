import { Component, Input, output, OnDestroy, OnInit, inject, computed, input } from '@angular/core';
import { FormArray, ReactiveFormsModule, FormGroup, FormBuilder, AbstractControl, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PrintableFormDto } from '../../models/printable-form.model';
import { FormContainerDto } from '../../models/form-container.model';
import { FormField } from '../../../../models/ui/form-field.model';
import { InvisibleInputFieldComponent } from '../invisible-input-field/invisible-input-field.component';
import { InvisibleSearchableSelectComponent } from '../invisible-searchable-select/invisible-searchable-select.component';
import { InvisibleSearchableMultiSelectComponent } from '../invisible-searchable-multi-select/invisible-searchable-multi-select.component';
import { CheckboxXComponent } from '../checkbox-x/checkbox-x.component';
import { RadioCheckboxesComponent } from '../radio-checkboxes/radio-checkboxes.component';

@Component({
  selector: 'app-nested-form-input',
  standalone: true,
  templateUrl: './nested-form-input.component.html',
  styleUrls: ['./nested-form-input.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InvisibleInputFieldComponent,
    InvisibleSearchableSelectComponent,
    InvisibleSearchableMultiSelectComponent,
    CheckboxXComponent,
    RadioCheckboxesComponent,
  ],
})
export class NestedFormInputComponent implements OnInit, OnDestroy {
  formField = input<FormField>();
  formArray = input<FormArray>(new FormArray<AbstractControl>([]));
  arrayIndexRange = input<{ start: number; end: number }>();
  @Input() fieldName: string = '';

  itemAdded = output<FormGroup>();
  itemRemoved = output<{ index: number; fieldName: string }>();

  formTemplate = computed<PrintableFormDto | null>(() => {
    const field = this.formField();
    if (!field) return null;

    // If nestedForm is available, use it directly
    if (field.nestedForm) return field.nestedForm as PrintableFormDto;

    // Auto-generate from fields array (e.g. JHA job steps)
    if (field.fields && field.fields.length > 0) {
      return this.buildTemplateFromFields(field.fields);
    }

    return null;
  });

  private fb = inject(FormBuilder);
  pixelsPerInch = 96;

  ngOnInit(): void {}

  getFormGroupsForCurrentContainer(): AbstractControl[] {
    const range = this.arrayIndexRange();
    if (range) {
      return this.formArray().controls.slice(range.start, range.end);
    }
    // No range specified — show all items
    return this.formArray().controls;
  }

  addItem(): void {
    const nextSequence = this.formArray().length + 1;
    const newGroup = this.createFormGroup({ sequence: nextSequence });
    // Ensure a sequence control exists even if not in the field template
    if (!newGroup.get('sequence')) {
      newGroup.addControl('sequence', new FormControl(nextSequence));
    }
    this.formArray().push(newGroup);
    this.itemAdded.emit(newGroup);
  }

  removeItem(index: number): void {
    const startIndex = this.arrayIndexRange()?.start ?? 0;
    const actualIndex = startIndex + index;

    if (actualIndex < 0 || actualIndex >= this.formArray().length) return;

    this.itemRemoved.emit({ index: actualIndex, fieldName: this.fieldName });
  }

  getSheetSize(): { width: number; height: number } {
    return this.formTemplate()?.size || { width: 8.5, height: 11 };
  }

  getContainers(): FormContainerDto[] {
    return this.formTemplate()?.formContainers || [];
  }

  private getAllFormFields(): FormField[] {
    const template = this.formTemplate();
    if (!template) {
      // Last resort: use fields directly
      return this.formField()?.fields || [];
    }
    return (template.formContainers || [])
      .filter(c => c.contentType === 'formField' && this.isFormField(c.content))
      .map(c => c.content as FormField);
  }

  private buildTemplateFromFields(fields: FormField[]): PrintableFormDto {
    const rowHeight = 30;
    const gap = 5;
    const containers: FormContainerDto[] = [];
    let yOffset = 0;

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const height = field.type === 'textarea' ? rowHeight * 2 : rowHeight;

      containers.push(new FormContainerDto({
        id: -(i + 1),
        contentType: 'formField',
        content: field,
        position: { x: 0, y: yOffset },
        size: { width: 8.5 * this.pixelsPerInch - 20, height },
        pageNumber: 1,
        style: { border: '1px solid #ccc' },
      }));

      yOffset += height + gap;
    }

    const totalHeight = yOffset / this.pixelsPerInch + 0.2;

    return new PrintableFormDto({
      formContainers: containers,
      size: { width: 8.5, height: Math.max(0.5, totalHeight) },
    });
  }

  private createFormGroup(data: any = {}): FormGroup {
    const group: { [key: string]: any } = {};
    const fields = this.getAllFormFields();

    fields.forEach(field => {
      if (field && field.name) {
        let value = this.getNestedValue(data, field.name);

        if (field.type === 'file') {
          value = null;
        } else if (field.type === 'checkbox-group' || field.type === 'multi-select') {
          value = value || [];
        } else if (field.type === 'select' && typeof value === 'object' && value !== null) {
          value = value.id;
        }

        this.setNestedControl(group, field.name, new FormControl(value || null, field.validators || []));
      }
    });

    return this.fb.group(this.convertToFormGroup(group));
  }

  private convertToFormGroup(obj: any): any {
    const result: any = {};
    for (const key in obj) {
      if (obj[key] instanceof FormControl || obj[key] instanceof FormArray || obj[key] instanceof FormGroup) {
        result[key] = obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = this.fb.group(this.convertToFormGroup(obj[key]));
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }

  private setNestedControl(group: { [key: string]: any }, path: string, control: any): void {
    const parts = path.split('.');
    let current = group;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = control;
  }

  getFormControl(formGroup: FormGroup, path: string): FormControl {
    const control = formGroup.get(path);
    if (!control) {
      const parts = path.split('.');
      let current: any = formGroup;
      for (let i = 0; i < parts.length - 1; i++) {
        let next = current.get(parts[i]);
        if (!next) {
          const newGroup = this.fb.group({});
          current.addControl(parts[i], newGroup);
          next = newGroup;
        }
        current = next;
      }
      const finalKey = parts[parts.length - 1];
      const newControl = new FormControl(null);
      current.addControl(finalKey, newControl);
      return newControl;
    }
    return control as FormControl;
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  getContainerStyles(container: FormContainerDto): any {
    const styles: any = {
      ...container.style,
      position: 'absolute',
      left: `${container.position.x}px`,
      top: `${container.position.y}px`,
      width: `${container.size.width}px`,
      height: `${container.size.height}px`,
    };
    if (this.isFormField(container.content) && container.content.style) {
      Object.assign(styles, container.content.style);
    }
    return styles;
  }

  getContentStyles(container: FormContainerDto): any {
    if (!container.contentStyle) return {};
    const styles = { ...container.contentStyle };
    if (styles.fontSize && typeof styles.fontSize === 'number') {
      styles.fontSize = `${styles.fontSize}px`;
    }
    return styles;
  }

  isFormField(content: any): content is FormField {
    return content && typeof content === 'object' && 'type' in content && 'name' in content;
  }

  asFormField(content: any): FormField { return content as FormField; }
  asFormGroup(control: AbstractControl): FormGroup { return control as FormGroup; }

  ngOnDestroy(): void {}
}
