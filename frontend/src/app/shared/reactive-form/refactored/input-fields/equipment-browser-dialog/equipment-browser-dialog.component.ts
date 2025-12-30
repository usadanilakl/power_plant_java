import { Component, inject, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentFileService } from '../../../../../services/current-file.service';
import { InteractiveImageComponent } from '../../../../image/refactored/interactive-image/interactive-image.component';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { EquipmentMapperService } from '../../../../../features/equipment/refactored/services/equipment-mapper.service';
import { EquipmentDialogFileService } from '../services/equipment-dialog-file.service';
import { RfToggleMenuComponent } from '../../../../menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
import { NestedItem } from '../../../../../models/ui/nested-item.model';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';

@Component({
  selector: 'app-equipment-browser-dialog',
  standalone: true,
  imports: [CommonModule, InteractiveImageComponent, RfToggleMenuComponent],
  providers: [EquipmentDialogFileService],
  templateUrl: './equipment-browser-dialog.component.html',
  styleUrl: './equipment-browser-dialog.component.css'
})
export class EquipmentBrowserDialogComponent {
  // Services
  fileService = inject(EquipmentDialogFileService);
  equipmentMapper = inject(EquipmentMapperService);
  currentFileService = inject(CurrentFileService);

  // Outputs
  equipmentSelected = output<EquipmentDto>();
  close = output<void>();

  // State
  selectedEquipment = signal<EquipmentDto | null>(null);

  // Delegated to shared service
  selectedFile = this.fileService.selectedFile;
  menuItems = this.fileService.menuItems;
  currentFileLink = this.fileService.currentFileLink;

  // Equipment from selected file
  equipment = computed(() => {
    const file = this.selectedFile();
    if (!file) return [];
    return file.points ?? [];
  });

  // Equipment shapes for InteractiveImageComponent
  equipmentShapes = computed(() => {
    const eq = this.equipment();
    if (!eq) return [];
    return eq.map((e: EquipmentDto) => this.equipmentMapper.mapToRfShape(e)).filter(s => s !== null);
  });

  onFileSelect(fileItem: NestedItem) {
    this.fileService.selectFileFromNestedItem(fileItem);
    this.selectedEquipment.set(null);
  }

  onConfirmSelection() {
    const equipment = this.selectedEquipment();
    const file = this.selectedFile();

    if (equipment && file) {
      // Ensure mainFileObject and mainFileId are populated from the current file context
      const enrichedEquipment = new EquipmentDto({
        ...equipment,
        mainFileId: file.id,
        mainFileObject: file
      });

      this.equipmentSelected.emit(enrichedEquipment);
      this.fileService.reset();
    }
  }

  onCancel() {
    this.fileService.reset();
    this.close.emit();
  }

  onEquipmentSelected(shape: RfShape) {
    console.log('Selected equipment:', shape.id);
    const selectedId = shape.id;
    if (selectedId !== null) {
      const eq = this.equipment();
      if (eq) {
        const selected = eq.find((e: EquipmentDto) => e.id === selectedId);
        if (selected) {
          console.log('Selected equipment:', selected);
          this.selectedEquipment.set(selected);
        }
      }
    }
  }
}
