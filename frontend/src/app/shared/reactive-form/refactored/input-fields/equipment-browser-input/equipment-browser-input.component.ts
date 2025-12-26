import { Component, Input, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../../../../popup-projection/rf-popup-projection.component';
import { EquipmentBrowserDialogComponent } from '../equipment-browser-dialog/equipment-browser-dialog.component';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';

@Component({
  selector: 'app-equipment-browser-input',
  standalone: true,
  imports: [CommonModule, RfPopupProjectionComponent, EquipmentBrowserDialogComponent],
  templateUrl: './equipment-browser-input.component.html',
  styleUrl: './equipment-browser-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EquipmentBrowserInputComponent),
      multi: true
    }
  ]
})
export class EquipmentBrowserInputComponent implements ControlValueAccessor {
  @Input() label: string = 'Select Equipment';
  @Input() placeholder: string = 'No equipment selected';

  // State
  isDialogOpen = signal(false);
  selectedEquipment = signal<EquipmentDto | null>(null);

  // ControlValueAccessor
  value: number | null = null; // Store equipment ID
  onChange: any = () => {};
  onTouched: any = () => {};
  disabled: boolean = false;

  writeValue(value: any): void {
    this.value = value;
    // Note: We only store the ID, not the full equipment object
    // The display will show "Equipment ID: {id}" until we load the full object
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  openDialog() {
    if (!this.disabled) {
      this.isDialogOpen.set(true);
    }
  }

  closeDialog() {
    this.isDialogOpen.set(false);
  }

  onEquipmentSelected(equipment: EquipmentDto) {
    this.selectedEquipment.set(equipment);
    this.value = equipment.id ?? null;
    this.onChange(this.value);
    this.onTouched();
    this.closeDialog();
  }

  clearSelection() {
    if (!this.disabled) {
      this.selectedEquipment.set(null);
      this.value = null;
      this.onChange(this.value);
      this.onTouched();
    }
  }

  getDisplayText(): string {
    const equipment = this.selectedEquipment();
    if (equipment) {
      return equipment.tagNumber || `Equipment #${equipment.id}`;
    }
    return this.value ? `Equipment ID: ${this.value}` : this.placeholder;
  }
}
