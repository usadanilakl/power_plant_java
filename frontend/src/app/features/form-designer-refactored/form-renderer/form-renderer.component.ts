import { Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PrintableFormDto } from '../models/printable-form.model';
import { FormArrayProcessingService } from '../services/form-array-processing.service';
import { FormRenderingService } from '../services/form-rendering.service';
import { FormContainerRendererComponent } from './form-container-renderer/form-container-renderer.component';
import { PrintService } from '../../../services/ui/print.service';

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormContainerRendererComponent,
  ],
  templateUrl: './form-renderer.component.html',
  styleUrl: './form-renderer.component.css',
})
export class FormRendererComponent {
  formDefinition = input<PrintableFormDto>();
  formData = input<any>({});
  readOnly = input<boolean>(false);

  formSubmit = output<any>();
  formChange = output<any>();

  private arrayProcessingService = inject(FormArrayProcessingService);
  private renderingService = inject(FormRenderingService);
  private printService = inject(PrintService);
  private destroyRef = inject(DestroyRef);

  readonly pixelsPerInch = 96;

  form: FormGroup = new FormGroup({});
  formArrayItemsCount = signal(0);

  sheetSize = computed(() => {
    const def = this.formDefinition();
    return def?.size || { width: 8.5, height: 11 };
  });

  processedFormDefinition = computed(() => {
    const def = this.formDefinition();
    const data = this.formData();
    if (!def) return null;

    this.formArrayItemsCount();

    const formValue = this.form?.value || data;
    return this.arrayProcessingService.processFormArrays(def, data, formValue);
  });

  pages = computed(() => {
    const processed = this.processedFormDefinition();
    if (!processed || !processed.formContainers) return [];
    return this.arrayProcessingService.groupContainersByPage(processed.formContainers);
  });

  constructor() {
    effect(() => {
      const def = this.formDefinition();
      const data = this.formData();
      if (def) {
        this.form = this.renderingService.createFormFromDefinition(def, data, this.form);
        this.subscribeToFormChanges();
      }
    });
  }

  private subscribeToFormChanges(): void {
    this.form.valueChanges.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      const originalData = this.formData() || {};
      const formValue = this.form.value;
      const mergedData = this.renderingService.deepMerge(originalData, formValue);
      this.formChange.emit(mergedData);
    });
  }

  onSubmit(): void {
    if (!this.form || this.form.invalid) {
      console.warn('Form is invalid', this.form?.errors);
      return;
    }

    const formValue = this.form.value;
    const data = this.formData();
    const mergedData = this.renderingService.deepMerge(data, formValue);
    this.formSubmit.emit(mergedData);
  }

  onArrayItemAdded(event: FormGroup): void {
    this.formArrayItemsCount.update(count => count + 1);
  }

  onArrayItemRemoved(event: { index: number; fieldName: string }): void {
    const control = this.form.get(event.fieldName);
    if (control instanceof FormArray) {
      control.removeAt(event.index);
    }
    this.formArrayItemsCount.update(count => count + 1);
    this.form.updateValueAndValidity();
  }

  print(): void {
    const def = this.formDefinition();
    if (def) {
      const originalData = this.formData() || {};
      const formValue = this.form.value;
      const mergedData = this.renderingService.deepMerge(originalData, formValue);
      this.printService.printForm(def, mergedData);
    }
  }
}
