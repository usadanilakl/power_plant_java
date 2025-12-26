import { Component, Input, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../../../../popup-projection/rf-popup-projection.component';
import { EquipmentShapeDrawerDialogComponent } from '../equipment-shape-drawer-dialog/equipment-shape-drawer-dialog.component';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';
import { FileDto } from '../../../../../models/file/file.model';

@Component({
  selector: 'app-equipment-shape-drawer-input',
  standalone: true,
  imports: [CommonModule, RfPopupProjectionComponent, EquipmentShapeDrawerDialogComponent],
  templateUrl: './equipment-shape-drawer-input.component.html',
  styleUrl: './equipment-shape-drawer-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EquipmentShapeDrawerInputComponent),
      multi: true
    }
  ]
})
export class EquipmentShapeDrawerInputComponent implements ControlValueAccessor {
  @Input() label: string = 'Draw Equipment Shape';
  @Input() placeholder: string = 'No shape drawn';

  // State
  isDialogOpen = signal(false);
  drawnShapeInfo = signal<{ shape: RfShape; file: FileDto } | null>(null);

  // ControlValueAccessor
  value: { coordinates: string; fileId: number; originalPictureSize: string } | null = null;
  onChange: any = () => {};
  onTouched: any = () => {};
  disabled: boolean = false;

  writeValue(value: any): void {
    this.value = value;
    // Note: We store shape coordinates and file reference
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

  onShapeDrawn(data: { shape: RfShape; file: FileDto }) {
    this.drawnShapeInfo.set(data);

    // Extract shape data to store in form
    this.value = {
      coordinates: data.shape.coordinates || '',
      fileId: data.file.id ?? 0,
      originalPictureSize: data.file.originalSize || ''
    };

    this.onChange(this.value);
    this.onTouched();
    this.closeDialog();
  }

  clearShape() {
    if (!this.disabled) {
      this.drawnShapeInfo.set(null);
      this.value = null;
      this.onChange(this.value);
      this.onTouched();
    }
  }

  getDisplayText(): string {
    const shapeInfo = this.drawnShapeInfo();
    if (shapeInfo) {
      return `Shape on ${shapeInfo.file.name}`;
    }
    return this.value ? `Shape (File ID: ${this.value.fileId})` : this.placeholder;
  }

  hasShape(): boolean {
    return this.drawnShapeInfo() !== null || this.value !== null;
  }
}
