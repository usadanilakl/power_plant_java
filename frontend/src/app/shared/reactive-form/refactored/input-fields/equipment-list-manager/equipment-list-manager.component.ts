import { Component, Input, forwardRef, signal, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../../../../popup-projection/rf-popup-projection.component';
import { EquipmentBrowserDialogComponent } from '../equipment-browser-dialog/equipment-browser-dialog.component';
import { EquipmentShapeDrawerDialogComponent } from '../equipment-shape-drawer-dialog/equipment-shape-drawer-dialog.component';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';
import { FileDto } from '../../../../../models/file/file.model';
import { EquipmentMapperService } from '../../../../../features/equipment/refactored/services/equipment-mapper.service';
import { sign } from 'crypto';

interface EquipmentListItem {
  id?: number;
  coordinates?: string;
  fileId?: number;
  fileName?: string;
  originalPictureSize?: string;
  tagNumber?: string;
  isExisting: boolean; // true = browsed existing, false = newly drawn
}

@Component({
  selector: 'app-equipment-list-manager',
  standalone: true,
  imports: [
    CommonModule,
    RfPopupProjectionComponent,
    EquipmentBrowserDialogComponent,
    EquipmentShapeDrawerDialogComponent
  ],
  templateUrl: './equipment-list-manager.component.html',
  styleUrl: './equipment-list-manager.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EquipmentListManagerComponent),
      multi: true
    }
  ]
})
export class EquipmentListManagerComponent implements ControlValueAccessor {
  @Input() label: string = 'Equipment List';
  @Input() allowBrowse: boolean = true;  // Allow selecting existing equipment
  @Input() allowDraw: boolean = true;    // Allow drawing new shapes

  // Services
  private equipmentMapper = inject(EquipmentMapperService);

  // State
  isBrowserOpen = signal(false);
  isDrawerOpen = signal(false);
  isVeiewerOpen = signal(false);
  equipmentList = signal<EquipmentListItem[]>([]);

  // ControlValueAccessor
  value = signal<EquipmentListItem[]>([]);
  onChange: any = () => {};
  onTouched: any = () => {};
  disabled: boolean = false;

  writeValue(value: any): void {
    if (Array.isArray(value)) {
      this.equipmentList.set(value.map(item => ({
        ...item,
        fileId: item.mainFileId,
        fileName: item.mainFileObject?.name,
        isExisting: !!item.id // If has ID, it's existing equipment
      })));
      this.value.set(value);
    } else {
      this.equipmentList.set([]);
      this.value.set([]);
    }
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

  // Browser Dialog
  openBrowser() {
    if (!this.disabled && this.allowBrowse) {
      this.isBrowserOpen.set(true);
    }
  }

  closeBrowser() {
    this.isBrowserOpen.set(false);
  }

  openViewer(item: EquipmentListItem) {
    console.log('Open viewer for equipment with ID:', item);
    if(!item || !item.fileId) return;
    this.isVeiewerOpen.set(true);
  }
  closeViewer() {
    this.isVeiewerOpen.set(false);
  }

  onEquipmentSelected(equipment: EquipmentDto) {
    const newItem: EquipmentListItem = {
      id: equipment.id,
      coordinates: equipment.coordinates || '',
      fileId: equipment.files?.[0] ? parseInt(equipment.files[0]) : undefined,
      fileName: equipment.files?.[0] || '',
      originalPictureSize: equipment.originalPictureSize || '',
      tagNumber: equipment.tagNumber || '',
      isExisting: true
    };

    this.addItem(newItem);
    this.closeBrowser();
  }

  // Drawer Dialog
  openDrawer() {
    if (!this.disabled && this.allowDraw) {
      this.isDrawerOpen.set(true);
    }
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
  }

  onShapeDrawn(data: { shape: RfShape; file: FileDto }) {
    const newItem: EquipmentListItem = {
      coordinates: this.equipmentMapper.mapRfShapeToCoordinates(data.shape),
      fileId: data.file.id ?? undefined,
      fileName: data.file.name,
      originalPictureSize: this.equipmentMapper.formatPictureSize(
        data.shape.originalPictureWidth,
        data.shape.originalPictureHeight
      ),
      tagNumber: `New Equipment`, // Placeholder
      isExisting: false
    };

    this.addItem(newItem);
    this.closeDrawer();
  }

  // List Management
  private addItem(item: EquipmentListItem) {
    const currentList = this.equipmentList();
    const updatedList = [...currentList, item];
    this.equipmentList.set(updatedList);
    this.value.set(updatedList);
    this.onChange(this.value());
    this.onTouched();
  }

  removeItem(index: number) {
    if (!this.disabled) {
      const currentList = this.equipmentList();
      const updatedList = currentList.filter((_, i) => i !== index);
      this.equipmentList.set(updatedList);
      this.value.set(updatedList);
      this.onChange(this.value());
      this.onTouched();
    }
  }

  clearAll() {
    if (!this.disabled) {
      this.equipmentList.set([]);
      this.value.set([]);
      this.onChange(this.value());
      this.onTouched();
    }
  }

  // Display helpers
  getItemDisplay(item: EquipmentListItem): string {
    return `Shape on File #${item.fileName || item.fileId || 'Unknown'}`;
  }

  getItemIcon(item: EquipmentListItem): string {
    return item.isExisting ? 'existing' : 'new';
  }

  hasItems(): boolean {
    return this.equipmentList().length > 0;
  }
}
