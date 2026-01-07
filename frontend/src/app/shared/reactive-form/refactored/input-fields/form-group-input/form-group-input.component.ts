import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RfFormField } from '../../../../../models/ui/form-field.model';
import { SearchableSelectInputComponent } from '../searchable-select-input/searchable-select-input.component';
import { EquipmentBrowserInputComponent } from '../equipment-browser-input/equipment-browser-input.component';
import { EquipmentListManagerComponent } from '../equipment-list-manager/equipment-list-manager.component';
import { RfValueSelectComponent } from '../../../../../features/values/refactored/components/rf-value-select/rf-value-select.component';
import { ZeroEnergyPhraseBuilderComponent } from '../zero-energy-phrase-builder/zero-energy-phrase-builder.component';

@Component({
  selector: 'app-form-group-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SearchableSelectInputComponent,
    EquipmentBrowserInputComponent,
    EquipmentListManagerComponent,
    RfValueSelectComponent,
    ZeroEnergyPhraseBuilderComponent
  ],
  templateUrl: './form-group-input.component.html',
  styleUrl: './form-group-input.component.css',
})
export class FormGroupInputComponent {
  label = input<string>('');
  fields = input<RfFormField[]>([]);
  formGroup = input.required<FormGroup>();
  layout = input<'row' | 'column' | 'grid'>('column');

  // Helper to get field options
  getFieldOptions = computed(() => {
    return (options: any): any[] => {
      if (!options) return [];
      if (typeof options === 'function') return options();
      if (Array.isArray(options)) return options;
      return [];
    };
  });

  // Helper to get FormControl from FormGroup
  getFormControl(name: string): FormControl {
    const control = this.formGroup().get(name);
    if (!control || !(control instanceof FormControl)) {
      return new FormControl();
    }
    return control as FormControl;
  }

  // Helper to get value from a sibling field (for zero-energy-phrase-builder to access templateEquipment)
  getFieldValue(name: string): any {
    const control = this.formGroup().get(name);
    return control?.value || [];
  }

  // Handle clipboard paste for zero-energy-phrase-builder - updates templateEquipment field
  onZeroEnergyClipboardPaste(event: { phraseId: number; templateEquipment: any[]; templateEquipmentIds: number[] }): void {
    const templateEquipmentControl = this.formGroup().get('templateEquipment');
    if (templateEquipmentControl && event.templateEquipment) {
      templateEquipmentControl.setValue(event.templateEquipment);
      templateEquipmentControl.markAsDirty();
    }
  }
}
