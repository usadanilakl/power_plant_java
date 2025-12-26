import { Component, inject, output, signal, computed, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfFileStateService } from '../../../../../features/files/refactored/services/rf-file-state.service';
import { CurrentFileService } from '../../../../../services/current-file.service';
import { InteractiveImageComponent } from '../../../../image/refactored/interactive-image/interactive-image.component';
import { FileDto } from '../../../../../models/file/file.model';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { EquipmentMapperService } from '../../../../../features/equipment/refactored/services/equipment-mapper.service';

@Component({
  selector: 'app-equipment-browser-dialog',
  standalone: true,
  imports: [CommonModule, InteractiveImageComponent],
  templateUrl: './equipment-browser-dialog.component.html',
  styleUrl: './equipment-browser-dialog.component.css'
})
export class EquipmentBrowserDialogComponent {
  @ViewChild(InteractiveImageComponent) interactiveImage?: InteractiveImageComponent;

  // Services
  fileStateService = inject(RfFileStateService);
  currentFileService = inject(CurrentFileService);
  equipmentMapper = inject(EquipmentMapperService);

  // Outputs
  equipmentSelected = output<EquipmentDto>();
  close = output<void>();

  // State
  selectedFile = signal<FileDto | null>(null);
  selectedEquipment = signal<EquipmentDto | null>(null);

  // Data
  files = toSignal(this.fileStateService.allLoadedFiles$, { initialValue: [] });
  equipment = toSignal(this.currentFileService.elementsToRender$, { initialValue: null });

  currentFileLink = computed(() => {
    const file = this.selectedFile();
    return file ? file.fileLink : '';
  });

  // Equipment shapes for InteractiveImageComponent
  equipmentShapes = computed(() => {
    const eq = this.equipment();
    if (!eq) return [];
    // Convert equipment to RfShape format
    return eq.map((e: EquipmentDto) => this.equipmentMapper.mapToRfShape(e)).filter(s => s !== null);
  });

  constructor() {
    // Watch for selected file changes and load its equipment
    effect(() => {
      const file = this.selectedFile();
      if (file) {
        this.currentFileService.setCurrentFile(file);
      }
    });

    // Watch for shape selection changes and map to equipment
    effect(() => {
      const imageComponent = this.interactiveImage;
      if (imageComponent) {
        const selectedId = imageComponent.singleSelectedShapeId();
        if (selectedId !== null) {
          const eq = this.equipment();
          if (eq) {
            const selected = eq.find((e: EquipmentDto) => e.id === selectedId);
            if (selected) {
              this.selectedEquipment.set(selected);
            }
          }
        }
      }
    }, { allowSignalWrites: true });
  }

  onFileSelect(file: FileDto) {
    this.selectedFile.set(file);
    this.selectedEquipment.set(null);
  }

  onConfirmSelection() {
    const equipment = this.selectedEquipment();
    if (equipment) {
      this.equipmentSelected.emit(equipment);
    }
  }

  onCancel() {
    this.close.emit();
  }

  isFileSelected(file: FileDto): boolean {
    return this.selectedFile()?.id === file.id;
  }
}
