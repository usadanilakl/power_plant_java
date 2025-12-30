import { Component, Input, forwardRef, signal, inject, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../../../../popup-projection/rf-popup-projection.component';
import { EquipmentShapeDrawerDialogComponent } from '../equipment-shape-drawer-dialog/equipment-shape-drawer-dialog.component';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';
import { FileDto } from '../../../../../models/file/file.model';
import { EquipmentMapperService } from '../../../../../features/equipment/refactored/services/equipment-mapper.service';
import { FileMenuService } from '../../../../../features/files/refactored/rf-file-left-menu/rf-file-menu.service';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';

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

  // Services
  private equipmentMapper = inject(EquipmentMapperService);
  protected fileMenuService = inject(FileMenuService);

  // State
  isDialogOpen = signal(false);
  drawnShapeInfo = signal<{ shape: RfShape; file: FileDto } | null>(null);
  displayText = computed(() => {
    const shapeInfo = this.drawnShapeInfo();
      console.log('Shape info:', shapeInfo);
    if (shapeInfo) {
      return `Shape on ${shapeInfo.file.name}`;
    }
    return this.coordValue() ? `Shape (File ID: ${this.coordValue()!.fileId})` : this.placeholder;
  });

  // ControlValueAccessor
  coordValue = signal<{ coordinates: string; fileId: number; originalPictureSize: string } | null>(null);
  value = signal <EquipmentDto | null>(null);
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
    this.coordValue.set({
      coordinates: this.equipmentMapper.mapRfShapeToCoordinates(data.shape),
      fileId: data.file.id ?? 0,
      originalPictureSize: this.equipmentMapper.formatPictureSize(
        data.shape.originalPictureWidth,
        data.shape.originalPictureHeight
      )
    });

    // this.onChange(this.value);
    // this.onTouched();
    // this.closeDialog();
  }
  onSaveSuccess(data: EquipmentDto | null) {
    this.value.set(data);

    this.onChange(this.value);
    this.onTouched();
    this.closeDialog();
  }

  clearShape() {
    if (!this.disabled) {
      this.drawnShapeInfo.set(null);
      this.value.set(null);
      this.onChange(this.value);
      this.onTouched();
    }
  }

  getDisplayText(): string {
    const shapeInfo = this.drawnShapeInfo();
    if (shapeInfo) {
      console.log('Shape info:', shapeInfo);
      return `Shape on ${shapeInfo.file.name}`;
    }
    return this.coordValue() ? `Shape (File ID: ${this.coordValue()!.fileId})` : this.placeholder;
  }

  hasShape(): boolean {
    return this.drawnShapeInfo() !== null || this.value !== null;
  }
}
