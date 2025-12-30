import { Component, inject, output, signal, computed, ViewChild, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InteractiveImageComponent } from '../../../../image/refactored/interactive-image/interactive-image.component';
import { FileDto } from '../../../../../models/file/file.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';
import { NestedItem } from '../../../../../models/ui/nested-item.model';
import { RfToggleMenuComponent } from "../../../../menu/refactored/rf-toggle-menu/rf-toggle-menu.component";
import { RfEquipmentService } from '../../../../../features/equipment/refactored/services/rf-equipment.service';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { EquipmentMapperService } from '../../../../../features/equipment/refactored/services/equipment-mapper.service';
import { EquipmentDialogFileService } from '../services/equipment-dialog-file.service';

@Component({
  selector: 'app-equipment-shape-drawer-dialog',
  standalone: true,
  imports: [CommonModule, InteractiveImageComponent, RfToggleMenuComponent],
  providers: [EquipmentDialogFileService],
  templateUrl: './equipment-shape-drawer-dialog.component.html',
  styleUrl: './equipment-shape-drawer-dialog.component.css',
})
export class EquipmentShapeDrawerDialogComponent {
  @ViewChild(InteractiveImageComponent)
  interactiveImage?: InteractiveImageComponent;

  // Services
  fileService = inject(EquipmentDialogFileService);
  equipmentService = inject(RfEquipmentService);
  equipmentMapper = inject(EquipmentMapperService);
  destroyRef = inject(DestroyRef);

  // Outputs
  shapeDrawn = output<{ shape: RfShape; file: FileDto }>();
  saveSuccess = output<EquipmentDto | null>();
  close = output<void>();

  // State
  drawnShape = signal<RfShape | null>(null);
  isDrawingMode = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

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

  equipmentShapes = computed(() => {
    const equipment = this.equipment();
    if (!equipment) return [];
    return this.equipmentMapper.mapAllToRfShapes(equipment);
  });

  onFileSelect(fileItem: NestedItem) {
    this.fileService.selectFileFromNestedItem(fileItem);
    this.drawnShape.set(null);
    this.isDrawingMode.set(false);
  }

  startDrawing() {
    this.isDrawingMode.set(true);
    this.drawnShape.set(null);
  }

  onConfirmShape() {
    const shape = this.drawnShape();
    const file = this.selectedFile();

    if (shape && file) {
      this.isLoading.set(true);
      this.error.set(null);

      const shapeWithFileContext: RfShape = { ...shape, fileId: file.id };

      // Save equipment immediately
      this.equipmentService
        .saveEquipmentFromShape(shapeWithFileContext)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (savedEquipment) => {
            this.isLoading.set(false);
            if (savedEquipment) {
              // Emit the saved equipment with ID
              this.saveSuccess.emit(savedEquipment);
              this.close.emit();
            } else {
              this.error.set('Failed to save the equipment.');
            }
          },
          error: (err) => {
            this.isLoading.set(false);
            this.error.set('An error occurred while saving the equipment.');
            console.error(err);
          },
        });
    }
  }

  onCancel() {
    this.fileService.reset();
    this.close.emit();
  }

  canConfirm(): boolean {
    return this.drawnShape() !== null && this.selectedFile() !== null;
  }

  onShapeDrawn($event: RfShape) {
    this.drawnShape.set($event);
    this.isDrawingMode.set(false);
    if(this.selectedFile()) {
      this.shapeDrawn.emit({ shape: $event, file: this.selectedFile()! });
    }
  }
}
