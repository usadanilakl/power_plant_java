import { Component, inject, output, signal, computed, ViewChild, DestroyRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InteractiveImageComponent } from '../../../../image/refactored/interactive-image/interactive-image.component';
import { FileDto } from '../../../../../models/file/file.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';
import { NestedItem } from '../../../../../models/ui/nested-item.model';
import { RfToggleMenuComponent } from "../../../../menu/refactored/rf-toggle-menu/rf-toggle-menu.component";
import { RfEquipmentService } from '../../../../../features/equipment/refactored/services/rf-equipment.service';
import { GuideDirective } from '../../../../guide/guide.directive';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { EquipmentMapperService } from '../../../../../features/equipment/refactored/services/equipment-mapper.service';
import { EquipmentDialogFileService } from '../services/equipment-dialog-file.service';

@Component({
  selector: 'app-equipment-shape-drawer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    InteractiveImageComponent,
    RfToggleMenuComponent,
    GuideDirective
  ],
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

  // Inputs
  /** Enable LOTO point creation mode - saves equipment and emits for parent to open LOTO form */
  enableLotoPointCreation = input<boolean>(false);

  // Outputs
  shapeDrawn = output<{ shape: RfShape; file: FileDto }>();
  saveSuccess = output<EquipmentDto | null>();
  /** Emitted when equipment is saved and ready for LOTO point creation (parent should open form) */
  equipmentReadyForLotoPoint = output<EquipmentDto>();
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
              // Enrich saved equipment with file context (same as browser)
              const enrichedEquipment = new EquipmentDto({
                ...savedEquipment,
                mainFileId: file.id,
                mainFileObject: file
              });

              this.saveSuccess.emit(enrichedEquipment);
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

      // If LOTO point creation is enabled, save equipment and emit for parent to handle
      if (this.enableLotoPointCreation()) {
        this.saveEquipmentForLotoPoint($event);
      }
    }
  }

  /**
   * Saves the drawn equipment shape and emits event for parent to open LOTO point form
   */
  private saveEquipmentForLotoPoint(shape: RfShape) {
    const file = this.selectedFile();
    if (!file) return;

    this.isLoading.set(true);
    this.error.set(null);

    const shapeWithFileContext: RfShape = { ...shape, fileId: file.id };

    this.equipmentService
      .saveEquipmentFromShape(shapeWithFileContext)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (savedEquipment) => {
          this.isLoading.set(false);
          if (savedEquipment) {
            // Enrich saved equipment with file context
            const enrichedEquipment = new EquipmentDto({
              ...savedEquipment,
              mainFileId: file.id,
              mainFileObject: file
            });

            // Emit for parent to handle LOTO point form
            this.equipmentReadyForLotoPoint.emit(enrichedEquipment);

            // Clear the drawn shape so user can continue drawing
            this.drawnShape.set(null);
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
