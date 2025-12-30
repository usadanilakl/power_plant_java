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
import { RfEquipmentEditorComponent } from "../../../../../features/equipment/refactored/rf-equipment-editor/rf-equipment-editor.component";

interface EquipmentListItem {
  id?: number;
  coordinates?: string;
  fileId?: number;
  fileName?: string;
  originalPictureSize?: string;
  tagNumber?: string;
  source: 'browsed' | 'drawn'; // Track how equipment was added
}

@Component({
  selector: 'app-equipment-list-manager',
  standalone: true,
  imports: [
    CommonModule,
    RfPopupProjectionComponent,
    EquipmentBrowserDialogComponent,
    EquipmentShapeDrawerDialogComponent,
    RfEquipmentEditorComponent
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
  selectedEquipment = signal<EquipmentListItem | null>(null);

  // ControlValueAccessor
  value = signal<EquipmentListItem[]>([]);
  onChange: any = () => {};
  onTouched: any = () => {};
  disabled: boolean = false;

  writeValue(value: any): void {
    if (Array.isArray(value)) {
      this.equipmentList.set(value.map(item => ({
        ...item,
        fileId: item.mainFileId ?? item.fileId,
        // Fix: Use mainFileObject name, fallback to fileName if available
        fileName: item.mainFileObject?.name ?? item.fileName ?? (item.mainFileId ? `File #${item.mainFileId}` : undefined),
        source: item.source ?? 'browsed' // Default to browsed for draft-loaded items
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
    // Only open viewer for existing equipment with IDs
    if (!item || !item.id) {
      console.warn('Cannot open viewer: equipment has no ID', item);
      return;
    }
    this.selectedEquipment.set(item);
    this.isVeiewerOpen.set(true);
  }
  closeViewer() {
    this.selectedEquipment.set(null);
    this.isVeiewerOpen.set(false);
  }

  onEquipmentSelected(equipment: EquipmentDto) {
    const newItem: EquipmentListItem = {
      id: equipment.id,
      coordinates: equipment.coordinates || '',
      fileId: equipment.mainFileId ?? undefined,
      fileName: equipment.mainFileObject?.name ?? (equipment.mainFileId ? `File #${equipment.mainFileId}` : ''),
      originalPictureSize: equipment.originalPictureSize || '',
      tagNumber: equipment.tagNumber || '',
      source: 'browsed'
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

  onEquipmentSaved(equipment: EquipmentDto | null) {
    if (!equipment) {
      console.error('No equipment saved');
      this.closeDrawer();
      return;
    }

    const newItem: EquipmentListItem = {
      id: equipment.id,
      coordinates: equipment.coordinates || '',
      fileId: equipment.mainFileId ?? undefined,
      fileName: equipment.mainFileObject?.name ?? (equipment.mainFileId ? `File #${equipment.mainFileId}` : ''),
      originalPictureSize: equipment.originalPictureSize || '',
      tagNumber: equipment.tagNumber || `Equipment #${equipment.id}`,
      source: 'drawn'
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
    return item.source === 'browsed' ? 'existing' : 'new';
  }

  hasItems(): boolean {
    return this.equipmentList().length > 0;
  }
}
