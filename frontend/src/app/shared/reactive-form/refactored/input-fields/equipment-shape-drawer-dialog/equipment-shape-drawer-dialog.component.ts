import { Component, inject, output, signal, computed, effect, ViewChild, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfFileStateService } from '../../../../../features/files/refactored/services/rf-file-state.service';
import { CurrentFileService } from '../../../../../services/current-file.service';
import { InteractiveImageComponent } from '../../../../image/refactored/interactive-image/interactive-image.component';
import { FileDto } from '../../../../../models/file/file.model';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';
import { NestedItem } from '../../../../../models/ui/nested-item.model';
import { RfFileLeftMenuComponent } from "../../../../../features/files/refactored/rf-file-left-menu/rf-file-left-menu.component";
import { RfToggleMenuComponent } from "../../../../menu/refactored/rf-toggle-menu/rf-toggle-menu.component";
import { FileMenuService } from '../../../../../features/files/refactored/rf-file-left-menu/rf-file-menu.service';
import { RfEquipmentService } from '../../../../../features/equipment/refactored/services/rf-equipment.service';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { EquipmentMapperService } from '../../../../../features/equipment/refactored/services/equipment-mapper.service';

@Component({
  selector: 'app-equipment-shape-drawer-dialog',
  standalone: true,
  imports: [CommonModule, InteractiveImageComponent, RfFileLeftMenuComponent, RfToggleMenuComponent],
  templateUrl: './equipment-shape-drawer-dialog.component.html',
  styleUrl: './equipment-shape-drawer-dialog.component.css'
})
export class EquipmentShapeDrawerDialogComponent {
  @ViewChild(InteractiveImageComponent) interactiveImage?: InteractiveImageComponent;

  // Services
  fileStateService = inject(RfFileStateService);
  currentFileService = inject(CurrentFileService);
  menuService = inject(FileMenuService);
  equipmentService = inject(RfEquipmentService);
  equipmentMapper = inject(EquipmentMapperService);
  destroyRef = inject(DestroyRef);

  // Outputs
  shapeDrawn = output<{ shape: RfShape; file: FileDto }>();
  saveSuccess = output<EquipmentDto | null>();
  close = output<void>();

  // State
  selectedFile = signal<FileDto | null>(null);
  drawnShape = signal<RfShape | null>(null);
  isDrawingMode = signal(false);

  menuItems = this.menuService.menuItems;
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Data
  filesMap = toSignal(this.currentFileService.fileMapByType$);
  // equipment = toSignal(this.currentFileService.elementsToRender$, { initialValue: null });
  equipment = computed(() => {
    const file = this.selectedFile();
    if (!file) return [];
    return file.points;
  });
  equipmentShapes = computed(() => {
    const equipment = this.equipment();
    if (!equipment) return [];
    return this.equipmentMapper.mapAllToRfShapes(equipment);
  });

  files = computed(() =>{
    if(!this.filesMap() ||!this.filesMap()!.get('pid')) return [];
    console.log('files', this.filesMap());
    return this.filesMap()?.get('pid') ?? [];
  })

  currentFileLink = computed(() => {
    const file = this.selectedFile();
    return file ? file.fileLink : '';
  });

  constructor() {
    // Watch for selected file changes
    effect(() => {
      const file = this.selectedFile();
      if (file) {
        this.currentFileService.setCurrentFile(file);
      }
    });
  }
  onFileSelect(fileItem: NestedItem) {

    this.menuService.getFileFromNestedItem(fileItem, this.selectedFile)
    this.drawnShape.set(null);
    this.isDrawingMode.set(false);
  }
  // onFileSelect(file: FileDto) {
  //   this.selectedFile.set(file);
  //   this.drawnShape.set(null);
  //   this.isDrawingMode.set(false);
  // }

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
      
      // The shape needs to be associated with the file it was drawn on.
      // We'll add the fileId to the shape before sending it to the service.
      const shapeWithFileContext: RfShape = { ...shape, fileId: file.id };

      this.equipmentService.saveEquipmentFromShape(shapeWithFileContext)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (savedEquipment) => {
            this.isLoading.set(false);
            if (savedEquipment) {
              this.saveSuccess.emit(savedEquipment);
              this.close.emit(); // Close dialog on success
            } else {
              this.error.set('Failed to save the equipment. The operation returned no data.');
            }
          },
          error: (err) => {
            this.isLoading.set(false);
            this.error.set('An error occurred while saving the equipment.');
            console.error(err);
            this.saveSuccess.emit(null);
          }
        });
    }
  }

  onCancel() {
    this.close.emit();
  }

  isFileSelected(file: FileDto): boolean {
    return this.selectedFile()?.id === file.id;
  }

  canConfirm(): boolean {
    return this.drawnShape() !== null && this.selectedFile() !== null;
  }
  onShapeDrawn($event: RfShape) {
    this.drawnShape.set($event);
    this.isDrawingMode.set(false);
    if(this.selectedFile())this.shapeDrawn.emit({ shape: $event, file: this.selectedFile()! });
  }
}
