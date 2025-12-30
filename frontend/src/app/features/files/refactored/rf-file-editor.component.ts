import { CommonModule } from "@angular/common";
import { Component, computed, DestroyRef, inject, signal } from "@angular/core";
import { PdfDisplayIframeComponent } from "../../../shared/pdf-dislplay-iframe/pdf-dislplay-iframe.component";
import { InteractiveImageComponent } from "../../../shared/image/refactored/interactive-image/interactive-image.component";
import { CurrentFileService } from "../../../services/current-file.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { toSignal } from "@angular/core/rxjs-interop";
import { EquipmentMapperService } from "../../equipment/refactored/services/equipment-mapper.service";
import { PopupProjectionComponent } from "../../../shared/popup-projection/popup-projection.component";
import { LotoPointDto } from "../../../models/loto/loto-point.model";
import { ShapeManagerService } from "../../../shared/image/refactored/services/shape-manager.service";
import { RfShape } from "../../../shared/image/refactored/models/fr-shape.model";
import { LotoPointDisplayTableComponent } from "../../loto-points/refactored/loto-point-display-table/loto-point-display-table.component";
import { LotoPointDetailFormComponent } from "../../loto-points/loto-point-detail-form/loto-point-detail-form.component";
import { EquipmentService } from "../../../services/equipment.service";
import { EquipmentDto } from "../../../models/equipment/equipment.model";

@Component({
  selector: 'app-rf-file-editor',
  imports: [
    CommonModule,
    PdfDisplayIframeComponent,
    InteractiveImageComponent,
    PopupProjectionComponent,
    LotoPointDisplayTableComponent,
    LotoPointDetailFormComponent
],
  templateUrl: './rf-file-editor.component.html',
  styleUrl: './rf-file-editor.component.css',
  standalone: true,
})
export class RfFileEditroComponent {

  currentFileService = inject(CurrentFileService);
  equipmentMapper = inject(EquipmentMapperService);
  equipmentService = inject(EquipmentService);
  shapeManager = inject(ShapeManagerService);
  destroyRef = inject(DestroyRef);

  currentFile = toSignal(this.currentFileService.currentFile$, { initialValue: null });
  fileLink = computed(() => {
    const file = this.currentFile();
    if (!file) return '';
    return file.fileLink;
  });
  equipment = toSignal(this.currentFileService.elementsToRender$, { initialValue: null });

  shapes = computed(() => {
    const equipment = this.equipment();
    if (!equipment) return [];
    const shapes = this.equipmentMapper.mapAllToRfShapes(equipment);
    console.log('shapes', shapes);
    console.log('equipment', equipment);
    return shapes;
  });

  // Loto point table popup state
  isLotoPointTableOpen = signal<boolean>(false);

  // Loto point edit form state
  isLotoPointFormOpen = signal<boolean>(false);
  selectedLotoPoint = signal<LotoPointDto | null>(null);

  // Hover state for synchronized highlighting
  hoveredEquipmentId = signal<number | null>(null);
  hoveredLotoPoint = signal<LotoPointDto | null>(null);

  // Compute all loto points from current file's equipment
  allLotoPoints = computed(() => {
    const equipment = this.equipment();
    if (!equipment) return [];

    const lotoPoints: LotoPointDto[] = [];
    equipment.forEach(eq => {
      if (eq.lotoPoints && eq.lotoPoints.length > 0) {
        eq.lotoPoints.forEach(lp => {
          lotoPoints.push(lp);
        });
      }
    });
    return lotoPoints;
  });

  openLotoPointTable() {
    this.isLotoPointTableOpen.set(true);
  }

  closeLotoPointTable() {
    this.isLotoPointTableOpen.set(false);
    this.hoveredEquipmentId.set(null);
  }

  toggleLotoPointTable() {
    this.isLotoPointTableOpen.set(!this.isLotoPointTableOpen());
    if (!this.isLotoPointTableOpen()) {
      this.hoveredEquipmentId.set(null);
    }
  }

  onLotoPointSelected(lotoPoints: LotoPointDto[]) {
    if (lotoPoints.length === 0) return;

    // Find equipment that contains this loto point
    const selectedLotoPoint = lotoPoints[0];
    const equipment = this.equipment();

    if (equipment) {
      const matchingEquipment = equipment.find(eq =>
        eq.lotoPoints?.some(lp => lp.id === selectedLotoPoint.id)
      );

      if (matchingEquipment) {
        // Highlight the shape on the image
        this.shapeManager.selectShape(matchingEquipment.id!, true);
      }
    }
  }

  onLotoPointHovered(lotoPoint: LotoPointDto | null) {
    // Store the hovered LOTO point (for potential future use)
    this.hoveredLotoPoint.set(lotoPoint);

    if (!lotoPoint) {
      this.hoveredEquipmentId.set(null);
      return;
    }

    // Find equipment that contains this loto point
    const equipment = this.equipment();
    if (equipment) {
      const matchingEquipment = equipment.find(eq =>
        eq.lotoPoints?.some(lp => lp.id === lotoPoint.id)
      );

      if (matchingEquipment) {
        // Set the hovered equipment ID to highlight on the image
        this.hoveredEquipmentId.set(matchingEquipment.id!);
      } else {
        this.hoveredEquipmentId.set(null);
      }
    }
  }

  onShapeHovered(shape: RfShape | null) {
    if (!shape) {
      this.hoveredEquipmentId.set(null);
      this.hoveredLotoPoint.set(null);
      return;
    }

    // The shape ID corresponds to the equipment ID
    this.hoveredEquipmentId.set(shape.id);

    // Find the equipment and get its first LOTO point to highlight in the table
    const equipment = this.equipment();
    if (equipment) {
      const matchingEquipment = equipment.find(eq => eq.id === shape.id);
      if (matchingEquipment && matchingEquipment.lotoPoints && matchingEquipment.lotoPoints.length > 0) {
        // Highlight the first LOTO point in the table
        this.hoveredLotoPoint.set(matchingEquipment.lotoPoints[0]);
      } else {
        this.hoveredLotoPoint.set(null);
      }
    }
  }

  onShapeRightClicked(shape: RfShape) {
    // Find equipment by shape ID
    const equipment = this.equipment();
    if (!equipment) return;

    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (matchingEquipment && matchingEquipment.lotoPoints && matchingEquipment.lotoPoints.length > 0) {
      // Open the first loto point for editing
      this.selectedLotoPoint.set(matchingEquipment.lotoPoints[0]);
      this.isLotoPointFormOpen.set(true);
    }
  }

  onLotoPointFormClose() {
    this.isLotoPointFormOpen.set(false);
    this.selectedLotoPoint.set(null);
  }

  onLotoPointFormSubmit(lotoPoint: LotoPointDto) {
    // TODO: Implement save logic
    console.log('Saving loto point:', lotoPoint);
    this.onLotoPointFormClose();
  }

  onLotoPointFormDelete() {
    // TODO: Implement delete logic
    console.log('Deleting loto point:', this.selectedLotoPoint());
    this.onLotoPointFormClose();
  }

  onShapeUpdated(shape: RfShape) {
    // Find the equipment that matches this shape
    const equipment = this.equipment();
    if (!equipment) return;

    const matchingEquipment = equipment.find(eq => eq.id === shape.id);
    if (!matchingEquipment) return;

    // Convert the shape back to equipment coordinates and update
    const updatedEquipment = new EquipmentDto(matchingEquipment);

    // Update coordinates based on shape position/size
    if (shape.type === 'rectangle' || shape.type === 'image' || shape.type === 'svg-symbol') {
      const coordinates = JSON.stringify({
        startX: shape.x,
        startY: shape.y,
        endX: shape.x + shape.width,
        endY: shape.y + shape.height,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation || 0
      })
      .replace(/^"|"$/g, '')
      .replace(/\\/g, '')
      .replace(/"(\w+)":/g, '$1:');

      const originalPictureSize = `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`;

      updatedEquipment.coordinates = coordinates;
      updatedEquipment.originalPictureSize = originalPictureSize;

      // Save to backend
      this.equipmentService.updateEquipment(updatedEquipment)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response: any) => {
            console.log('Equipment updated successfully:', response);
          },
          error: (error: any) => {
            console.error('Error updating equipment:', error);
          }
        });
    }
  }
}

