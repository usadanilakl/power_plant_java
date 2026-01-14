import { Component, computed, forwardRef, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormControl, FormArray, FormBuilder } from '@angular/forms';
import { InvisibleInputFieldComponent } from '../../../inputs/invisible-input-field/invisible-input-field.component';
import { RadioCheckboxesComponent } from '../../../inputs/radio-checkboxes/radio-checkboxes.component';
import { InvisibleSearchableSelectComponent } from '../../../inputs/invisible-searchable-select/invisible-searchable-select.component';
import { ChekcboxXComponent } from '../../../inputs/chekcbox-x/chekcbox-x.component';
import { InvisibleSearchableMultiSelectComponent } from '../../../inputs/invisible-searchable-multi-select/invisible-searchable-multi-select.component';
import { NestedFormInputComponent } from '../../../inputs/nested-form-input/nested-form-input.component';
import { FormContainerDto } from '../../../../../models/forms/form-container.model';
import { FormField } from '../../../../../models/ui/form-field.model';
import { FormRenderingService } from '../../services/form-rendering.service';

@Component({
  selector: 'app-form-container-renderer-refactored',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InvisibleInputFieldComponent,
    RadioCheckboxesComponent,
    InvisibleSearchableSelectComponent,
    ChekcboxXComponent,
    InvisibleSearchableMultiSelectComponent,
    forwardRef(() => NestedFormInputComponent)
  ],
  templateUrl: './form-container-renderer-refactored.component.html',
  styleUrl: './form-container-renderer-refactored.component.css'
})
export class FormContainerRendererRefactoredComponent {
  // Inputs
  container = input.required<FormContainerDto>();
  form = input<FormGroup>();
  readOnly = input<boolean>(false);
  formData = input<any>({});

  // Outputs
  arrayItemAdded = output<FormGroup>();
  arrayItemRemoved = output<{ index: number, fieldName: string }>();

  // Services
  private renderingService = inject(FormRenderingService);
  private fb = inject(FormBuilder);

  /**
   * Container with label removed for cleaner rendering
   */
  containerWithNoLabel = computed(() => {
    const c = this.container();
    if (c.contentType === 'formField' && this.isFormField(c.content)) {
      const field = c.content as FormField;
      return new FormContainerDto({
        ...c,
        content: {
          ...field,
          label: ''
        }
      });
    }
    return c;
  });

  /**
   * Gets container positioning and sizing styles
   */
  getContainerStyles(container: FormContainerDto): any {
    return this.renderingService.getContainerStyles(container);
  }

  /**
   * Gets content text styles
   */
  getContentStyles(container: FormContainerDto): any {
    return this.renderingService.getContentStyles(container);
  }

  /**
   * Type guard for FormField
   */
  isFormField(content: any): content is FormField {
    return content && typeof content === 'object' && 'name' in content && 'type' in content;
  }

  /**
   * Type cast helper for FormField
   */
  asFormField(content: any): FormField {
    return content as FormField;
  }

  /**
   * Gets a FormControl from the form by path
   */
  getFormControl(path: string): FormControl {
    const form = this.form();
    if (!form) {
      console.warn(`Form not available. Creating a new FormControl.`);
      return new FormControl();
    }

    const control = form.get(path);
    if (!control) {
      console.warn(`Control ${path} not found in form. Creating a new FormControl.`);
      return new FormControl();
    }
    return control as FormControl;
  }

  /**
   * Gets a FormArray from the form by path
   */
  getFormArray(path: string): FormArray {
    const form = this.form();
    if (!form) {
      console.error(`Form not available.`);
      return this.fb.array([]) as FormArray;
    }

    const control = form.get(path);
    if (!control) {
      console.error(`FormArray not found at path: ${path}`);
      return this.fb.array([]) as FormArray;
    }
    if (!(control instanceof FormArray)) {
      console.error(`Control at path ${path} is not a FormArray`);
      return this.fb.array([]) as FormArray;
    }
    return control as FormArray;
  }

  /**
   * Gets nested value from object by path
   */
  getNestedValue(obj: any, path: string): any {
    if (!obj || !path) {
      return null;
    }
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }

  /**
   * Handles when a new item is added to a form array
   */
  onAddArrayItem(formGroup: FormGroup): void {
    this.arrayItemAdded.emit(formGroup);
  }

  /**
   * Handles when an item is removed from a form array
   */
  onRemoveArrayItem(event: { index: number, fieldName: string }): void {
    this.arrayItemRemoved.emit(event);
  }
}
