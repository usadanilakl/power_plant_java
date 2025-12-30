import { Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { SearchableSelectInputComponent } from '../input-fields/searchable-select-input/searchable-select-input.component';
import { ChekcboxGroupComponent } from '../input-fields/chekcbox-group/chekcbox-group.component';
import { CheckboxLabelOnlyComponent } from '../input-fields/checkbox-label-only/checkbox-label-only.component';
import { RfRadioGroupComponent } from '../input-fields/radio-group/rf-radio-group.component';
import { SearchableMultiSelectInputComponent } from '../input-fields/searchable-multi-select-input/searchable-multi-select-input.component';
import { MultiTextInputComponent } from '../input-fields/multi-text-input/multi-text-input.component';
import { RfFormInputComponent } from '../input-fields/form-input/rf-form-input.component';
import { FormArrayInputComponent } from '../input-fields/form-array-input/form-array-input.component';
import { FormGroupInputComponent } from '../input-fields/form-group-input/form-group-input.component';
import { EquipmentBrowserInputComponent } from '../input-fields/equipment-browser-input/equipment-browser-input.component';
import { EquipmentShapeDrawerInputComponent } from '../input-fields/equipment-shape-drawer-input/equipment-shape-drawer-input.component';
import { EquipmentListManagerComponent } from '../input-fields/equipment-list-manager/equipment-list-manager.component';
import { RfValueSelectComponent } from '../../../../features/values/refactored/components/rf-value-select/rf-value-select.component';
import { RfMultiValueSelectComponent } from '../../../../features/values/refactored/components/rf-multi-value-select/rf-multi-value-select.component';
import { FormBuilderService } from '../services/form-builder.service';
import { FormValidationService } from '../services/form-validation.service';
import { FormDataService } from '../services/form-data.service';

@Component({
  selector: 'app-rf-reactive-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SearchableSelectInputComponent,
    ChekcboxGroupComponent,
    CheckboxLabelOnlyComponent,
    RfRadioGroupComponent,
    SearchableMultiSelectInputComponent,
    MultiTextInputComponent,
    RfFormInputComponent,
    FormArrayInputComponent,
    FormGroupInputComponent,
    EquipmentBrowserInputComponent,
    EquipmentShapeDrawerInputComponent,
    EquipmentListManagerComponent,
    RfValueSelectComponent,
    RfMultiValueSelectComponent,
  ],
  templateUrl: './rf-reactive-form.component.html',
  styleUrl: './rf-reactive-form.component.css',
})
export class RfReactiveFormComponent {
  // Inputs
  fields = input<RfFormField[]>([]);
  entity = input<any>({});
  layout = input<'row' | 'column' | 'reactive'>('column');
  groupLayout = input<'row' | 'column' | 'reactive' | 'grid'>('grid');
  title = input<string>('');
  submitButtonText = input<string>('Submit');
  deleteButtonText = input<string>('');

  // Outputs
  formSubmit = output<any>();
  formDelete = output<void>();
  addNewSelectOption = output<string>();
  formValueChange = output<any>();

  // Services
  private formBuilderService = inject(FormBuilderService);
  private validationService = inject(FormValidationService);
  private dataService = inject(FormDataService);
  private destroyRef = inject(DestroyRef);

  // State
  formErrors = signal<{ [key: string]: string }>({});
  form: FormGroup = new FormGroup({});

  // Computed
  Object = Object;
  groupedFields = computed(() => this.dataService.groupFields(this.fields()));

  constructor() {
    // Create form when fields change
    effect(() => {
      const fields = this.fields();
      if (fields && fields.length > 0) {
        this.createForm();
      }
    });

    // Patch form when entity changes
    effect(() => {
      const data = this.entity();
      if (data && this.form && Object.keys(this.form.controls).length > 0) {
        const normalizedData = this.normalizeEntityForPatch(data);
        this.form.patchValue(normalizedData, { emitEvent: true });
      }
    });
  }

  private createForm(): void {
    const entity = this.entity();
    const fields = this.fields();

    console.log("entity: ", entity)

    // Create form using service
    this.form = this.formBuilderService.createFormFromFields(fields, entity);

    // Setup conditional validators
    this.validationService.setupConditionalValidators(
      this.form,
      fields,
      this.destroyRef
    );

    // Setup value change subscription
    this.form.valueChanges
      .pipe(
        debounceTime(1000),
        distinctUntilChanged((prev, curr) => this.deepCompareByIds(prev, curr)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((formValue) => {
        const originalData = this.entity() || {};
        const mergedData = this.dataService.deepMerge(originalData, formValue);
        this.formValueChange.emit(mergedData);
      });
  }

  /**
   * Deep comparison that compares arrays and objects by IDs
   * This prevents false positives when object references change but IDs remain the same
   */
  private deepCompareByIds(obj1: any, obj2: any): boolean {
    // If both are null/undefined, they're equal
    if (obj1 == null && obj2 == null) return true;

    // If one is null/undefined and the other isn't, they're not equal
    if (obj1 == null || obj2 == null) return false;

    // If both are primitives, compare directly
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return obj1 === obj2;
    }

    // Handle arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;

      // Compare array elements by IDs if they have them
      for (let i = 0; i < obj1.length; i++) {
        const item1 = obj1[i];
        const item2 = obj2[i];

        // If items have IDs, compare by ID only
        if (this.hasComparableId(item1) && this.hasComparableId(item2)) {
          if (item1.id !== item2.id) return false;
        } else {
          // Otherwise deep compare the items
          if (!this.deepCompareByIds(item1, item2)) return false;
        }
      }
      return true;
    }

    // Handle objects with ID property
    // If both objects have valid IDs (not null/undefined), compare by ID only
    if (this.hasComparableId(obj1) && this.hasComparableId(obj2)) {
      return obj1.id === obj2.id;
    }

    // For plain objects without comparable IDs, do deep property comparison
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.deepCompareByIds(obj1[key], obj2[key])) return false;
    }

    return true;
  }

  /**
   * Check if an object has a valid ID that can be used for comparison
   * Returns true if the object has an 'id' property that is not null/undefined
   */
  private hasComparableId(obj: any): boolean {
    return obj != null &&
           typeof obj === 'object' &&
           'id' in obj &&
           obj.id != null;
  }

  /**
   * Normalizes entity data for form patching by extracting IDs from nested objects for select fields
   */
  private normalizeEntityForPatch(entity: any): any {
    if (!entity) return entity;

    const normalized: any = { ...entity };
    const fields = this.fields();

    fields.forEach((field) => {
      if (field.type === 'select') {
        const value = this.formBuilderService.getNestedValue(entity, field.name);
        if (value && typeof value === 'object' && value !== null && value.id) {
          // Extract ID from nested object for select fields
          this.setNestedValue(normalized, field.name, value.id);
        }
      }
    });

    return normalized;
  }

  /**
   * Sets a nested value in an object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  // Form array management
  getFormArray(name: string): FormArray {
    return this.form.get(name) as FormArray;
  }

  // Form group management
  getFormGroup(name: string): FormGroup {
    const control = this.form.get(name);
    if (!control || !(control instanceof FormGroup)) {
      return new FormGroup({});
    }
    return control as FormGroup;
  }

  addArrayItem(arrayName: string, fields: RfFormField[]): void {
    const formArray = this.getFormArray(arrayName);
    if (formArray) {
      formArray.push(this.formBuilderService.createArrayItem(fields));
      this.form.markAsDirty();
    }
  }

  removeArrayItem(arrayName: string, index: number): void {
    const formArray = this.getFormArray(arrayName);
    if (formArray) {
      formArray.removeAt(index);
      this.form.markAsDirty();
    }
  }

  // Form control access
  getFormControl(path: string): FormControl {
    const control = this.form.get(path);
    if (!control || !(control instanceof FormControl)) {
      return new FormControl();
    }
    return control as FormControl;
  }

  // Field visibility
  shouldShowField(field: RfFormField): boolean {
    return this.validationService.shouldShowField(this.form, field);
  }

  // Form submission
  onSubmit(): void {
    if (this.form.valid) {
      const originalData = this.entity() || {};
      const formValue = this.form.value;
      const mergedData = this.dataService.deepMerge(originalData, formValue);
      this.formSubmit.emit(mergedData);
    } else {
      this.form.markAllAsTouched();
      this.updateFormErrors();
    }
  }

  onDelete(): void {
    this.formDelete.emit();
  }

  onContextMenu(event: MouseEvent): boolean {
    event.preventDefault();
    return false;
  }

  // Utility methods
  getCurrentFormValues(): any {
    return this.form ? this.form.value : null;
  }

  private updateFormErrors(): void {
    const errors = this.validationService.getFormErrors(this.form, this.fields());
    this.formErrors.set(errors);
  }

  getFieldOptions(options: any): any[] {
    return this.dataService.getFieldOptions(options);
  }

  // Helper to convert groupLayout to form-group-input compatible layout
  getGroupInputLayout(): 'row' | 'column' | 'grid' {
    const layout = this.groupLayout();
    return layout === 'reactive' ? 'column' : layout;
  }
}
