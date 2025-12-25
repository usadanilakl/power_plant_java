import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { FormArrayProcessingService } from '../services/form-array-processing.service';
import { FormRenderingService } from '../services/form-rendering.service';
import { FormContainerRendererRefactoredComponent } from './form-container-renderer-refactored/form-container-renderer-refactored.component';

@Component({
  selector: 'app-form-renderer-refactored',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormContainerRendererRefactoredComponent
  ],
  templateUrl: './form-renderer-refactored.component.html',
  styleUrl: './form-renderer-refactored.component.css'
})
export class FormRendererRefactoredComponent {
  // Inputs
  formDefinition = input<PrintableFormDto>();
  formData = input<any>({});
  readOnly = input<boolean>(false);

  // Outputs
  formSubmit = output<any>();

  // Services
  private arrayProcessingService = inject(FormArrayProcessingService);
  private renderingService = inject(FormRenderingService);

  // Constants
  readonly pixelsPerInch = 96;

  // State
  form!: FormGroup;
  formArrayItemsCount = signal(0);

  // Computed properties
  sheetSize = computed(() => {
    const def = this.formDefinition();
    return def?.size || { width: 8.5, height: 11 };
  });

  /**
   * Processed form definition with form arrays split across pages
   */
  processedFormDefinition = computed(() => {
    const def = this.formDefinition();
    const data = this.formData();

    if (!def) return null;

    // Trigger recomputation when form array items change
    this.formArrayItemsCount();

    const formValue = this.form?.value || data;
    return this.arrayProcessingService.processFormArrays(def, data, formValue);
  });

  /**
   * Pages grouped from processed form definition
   */
  pages = computed(() => {
    const processed = this.processedFormDefinition();
    if (!processed || !processed.formContainers) {
      return [];
    }

    return this.arrayProcessingService.groupContainersByPage(processed.formContainers);
  });

  constructor() {
    // Initialize form when definition or data changes
    effect(() => {
      const def = this.formDefinition();
      const data = this.formData();

      if (def) {
        this.form = this.renderingService.createFormFromDefinition(def, data, this.form);
      }
    });
  }

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (!this.form || this.form.invalid) {
      console.warn('Form is invalid', this.form?.errors);
      return;
    }

    const formValue = this.form.value;
    const data = this.formData();

    // Deep merge form values with original entity data
    const mergedData = this.renderingService.deepMerge(data, formValue);

    this.formSubmit.emit(mergedData);
  }

  /**
   * Handles when array item is added
   */
  onArrayItemAdded(event: FormGroup): void {
    // Increment counter to trigger recomputation of processedFormDefinition
    this.formArrayItemsCount.update(count => count + 1);
  }

  /**
   * Handles when array item is removed
   */
  onArrayItemRemoved(event: { index: number; fieldName: string }): void {
    const control = this.form.get(event.fieldName);
    if (control && control instanceof FormGroup) {
      const formArray = control.get(event.fieldName);
      if (formArray) {
        (formArray as any).removeAt(event.index);
      }
    }

    // Increment counter to trigger recomputation
    this.formArrayItemsCount.update(count => count + 1);
    this.form.updateValueAndValidity();
  }

  /**
   * Print functionality
   */
  print(): void {
    window.print();
  }
}
