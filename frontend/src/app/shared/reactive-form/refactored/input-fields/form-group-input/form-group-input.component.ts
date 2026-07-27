import { Component, computed, inject, input, signal, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { RfFormField } from '../../../../../models/ui/form-field.model';
import { SearchableSelectInputComponent } from '../searchable-select-input/searchable-select-input.component';
import { EquipmentBrowserInputComponent } from '../equipment-browser-input/equipment-browser-input.component';
import { EquipmentListManagerComponent } from '../equipment-list-manager/equipment-list-manager.component';
import { RfValueSelectComponent } from '../../../../../features/values/refactored/components/rf-value-select/rf-value-select.component';
import { ZeroEnergyPhraseBuilderComponent } from '../zero-energy-phrase-builder/zero-energy-phrase-builder.component';
import { RfLotoPointApiService } from '../../../../../features/loto-points/refactored/services/rf-loto-point-api.service';

@Component({
  selector: 'app-form-group-input',
  standalone: true,
  // forwardRef on EquipmentListManagerComponent breaks the ES-module bulk-edit cycle:
  //   form-group-input -> equipment-list-manager -> equipment-unified-dialog
  //     -> rf-loto-point-table -> loto-point-bulk-edit-form -> bulk-edit-menu
  //     -> rf-reactive-form -> form-group-input
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SearchableSelectInputComponent,
    EquipmentBrowserInputComponent,
    forwardRef(() => EquipmentListManagerComponent),
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
  context = input<any>(null);

  // Edit for All state
  editSharedEnabled = signal(false);

  private lotoPointApi = inject(RfLotoPointApiService);

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

  // Toggle "Edit for All" mode - fetches usage count and shows confirmation
  async onEditForAllClick(): Promise<void> {
    if (this.editSharedEnabled()) {
      this.editSharedEnabled.set(false);
      this.getFormControl('editShared')?.setValue(false);
      return;
    }

    const id = this.context()?.zeroEnergyId;
    if (!id) return;

    try {
      const response = await firstValueFrom(this.lotoPointApi.getZeroEnergyUsageCount(id));
      const count = response.responseData;

      if (confirm(`This zero energy is shared by ${count} LOTO point(s). Changes will affect all of them. Continue?`)) {
        this.editSharedEnabled.set(true);
        this.getFormControl('editShared')?.setValue(true);
      }
    } catch (e) {
      console.error('Failed to fetch zero energy usage count', e);
    }
  }

  /**
   * Bound to the editShared checkbox inside the zero-energy phrase builder edit dialog.
   * Writes the value into the surrounding form group's `editShared` form control so
   * it reaches the backend on save.
   */
  onEditSharedToggleFromDialog(value: boolean): void {
    this.editSharedEnabled.set(value);
    this.getFormControl('editShared')?.setValue(value);
  }
}
