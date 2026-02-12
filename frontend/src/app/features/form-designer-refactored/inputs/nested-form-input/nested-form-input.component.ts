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
  @Input() fieldName: string = '';

  itemAdded = output<FormGroup>();
  itemRemoved = output<{ index: number; fieldName: string }>();

  formTemplate = computed<PrintableFormDto>(() => this.formField()?.nestedForm as PrintableFormDto);

  private fb = inject(FormBuilder);
  pixelsPerInch = 96;

  ngOnInit(): void {}

  getFormGroupsForCurrentContainer(): AbstractControl[] {
    const start = this.formField()?.arrayIndexRange?.start;
    const end = this.formField()?.arrayIndexRange?.end;
    return this.formArray().controls.slice(start, end);
  }

  addItem(): void {
    const newGroup = this.createFormGroup();
    this.formArray().push(newGroup);
    this.itemAdded.emit(newGroup);
  }

  removeItem(index: number): void {
    const startIndex = this.formField()?.arrayIndexRange?.start ?? 0;
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
    if (!this.formTemplate()) return [];
    return (this.formTemplate().formContainers || [])
      .filter(c => c.contentType === 'formField' && this.isFormField(c.content))
      .map(c => c.content as FormField);
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
