import { Component, computed, forwardRef, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormControl, FormArray, FormBuilder } from '@angular/forms';
import { InvisibleInputFieldComponent } from '../../inputs/invisible-input-field/invisible-input-field.component';
import { RadioCheckboxesComponent } from '../../inputs/radio-checkboxes/radio-checkboxes.component';
import { InvisibleSearchableSelectComponent } from '../../inputs/invisible-searchable-select/invisible-searchable-select.component';
import { CheckboxXComponent } from '../../inputs/checkbox-x/checkbox-x.component';
import { InvisibleSearchableMultiSelectComponent } from '../../inputs/invisible-searchable-multi-select/invisible-searchable-multi-select.component';
import { NestedFormInputComponent } from '../../inputs/nested-form-input/nested-form-input.component';
import { WorkAreaSelectComponent } from '../../../permit-builder/work-area/components/work-area-select/work-area-select.component';
import { FormContainerDto } from '../../models/form-container.model';
import { FormField } from '../../../../models/ui/form-field.model';
import { FormRenderingService } from '../../services/form-rendering.service';

@Component({
  selector: 'app-form-container-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InvisibleInputFieldComponent,
    RadioCheckboxesComponent,
    InvisibleSearchableSelectComponent,
    CheckboxXComponent,
    InvisibleSearchableMultiSelectComponent,
    forwardRef(() => NestedFormInputComponent),
    WorkAreaSelectComponent,
  ],
  templateUrl: './form-container-renderer.component.html',
  styleUrl: './form-container-renderer.component.css',
})
export class FormContainerRendererComponent {
  container = input.required<FormContainerDto>();
  form = input<FormGroup>();
  readOnly = input<boolean>(false);
  formData = input<any>({});

  arrayItemAdded = output<FormGroup>();
  arrayItemRemoved = output<{ index: number; fieldName: string }>();

  private renderingService = inject(FormRenderingService);
  private fb = inject(FormBuilder);

  containerWithNoLabel = computed(() => {
    const c = this.container();
    if (c.contentType === 'formField' && this.isFormField(c.content)) {
      const field = c.content as FormField;
      return new FormContainerDto({
        ...c,
        content: { ...field, label: '' },
      });
    }
    return c;
  });

  getContainerStyles(container: FormContainerDto): any {
    const styles = this.renderingService.getContainerStyles(container);
    // For form-array containers, use min-height instead of fixed height
    // so the Add button and items are not clipped
    if (this.isFormField(container.content) && (container.content as FormField).type === 'form-array') {
      styles['min-height'] = styles['height'];
      styles['height'] = 'auto';
      styles['overflow'] = 'visible';
    }
    if (this.isFormField(container.content) && (container.content as FormField).type === 'work-area-select') {
      styles['overflow'] = 'visible';
      styles['z-index'] = '100';
    }
    return styles;
  }

  getContentStyles(container: FormContainerDto): any {
    return this.renderingService.getContentStyles(container);
  }

  isFormField(content: any): content is FormField {
    return content && typeof content === 'object' && 'name' in content && 'type' in content;
  }

  asFormField(content: any): FormField {
    return content as FormField;
  }

  getFormControl(path: string): FormControl {
    const form = this.form();
    if (!form) return new FormControl();

    const control = form.get(path);
    if (!control) return new FormControl();
    return control as FormControl;
  }

  getFormArray(path: string): FormArray {
    const form = this.form();
    if (!form) return this.fb.array([]) as FormArray;

    const control = form.get(path);
    if (control instanceof FormArray) {
      return control;
    }

    // If not found, create and register in the parent form
    // so all components share the same connected reference
    const newArray = this.fb.array([]) as FormArray;
    form.addControl(path, newArray);
    return newArray;
  }

  getArrayIndexRange(): { start: number; end: number } | undefined {
    return (this.container() as any).arrayIndexRange;
  }

  getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return null;
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }

  onAddArrayItem(formGroup: FormGroup): void {
    this.arrayItemAdded.emit(formGroup);
  }

  onRemoveArrayItem(event: { index: number; fieldName: string }): void {
    this.arrayItemRemoved.emit(event);
  }
}
