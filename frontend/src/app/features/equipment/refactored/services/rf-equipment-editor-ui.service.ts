
import { Injectable, inject } from '@angular/core';
import { RfEquipmentEditorStateService } from './rf-equipment-editor-state.service';
import { RfEquipmentEditorDataService } from './rf-equipment-editor-data.service';
import { ShapeManagerService } from '../../../../shared/image/refactored/services/shape-manager.service';
import { EquipmentMapperService } from './equipment-mapper.service';
import { RfShape } from '../../../../shared/image/refactored/models/fr-shape.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';

@Injectable()
export class RfEquipmentEditorUiService {
  private stateService = inject(RfEquipmentEditorStateService);
  private dataService = inject(RfEquipmentEditorDataService);
  private shapeManager = inject(ShapeManagerService);
  private equipmentMapper = inject(EquipmentMapperService);

  /**
   * Handle loto point selection from table
   */
  handleLotoPointSelection(lotoPoints: LotoPointDto[]): void {
    if (lotoPoints.length === 0) return;

    const selectedLotoPoint = lotoPoints[0];
    const equipment = this.stateService.allEquipment();

    const matchingEquipment = equipment.find(eq =>
      eq.lotoPoints?.some(lp => lp.id === selectedLotoPoint.id)
    );

    if (matchingEquipment?.id) {
      this.highlightEquipment(matchingEquipment.id);
    }
  }

  /**
   * Handle shape right-click to open loto point form
   */
  handleShapeRightClick(shape: RfShape): void {
    const equipment = this.stateService.allEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (matchingEquipment?.lotoPoints && matchingEquipment.lotoPoints.length > 0) {
      this.stateService.openLotoPointForm(matchingEquipment.lotoPoints[0]);
    }
  }

  /**
   * Handle shape selection
   */
  handleShapeSelection(shape: RfShape): void {
    if (shape.id) {
      this.stateService.setHighlightedEquipmentId(shape.id);
    }
  }

  /**
   * Handle shape update (drag/resize)
   */
  handleShapeUpdate(shape: RfShape): void {
    const equipment = this.stateService.allEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);
    
    if (!matchingEquipment) return;

    const updatedEquipment = this.createUpdatedEquipmentFromShape(matchingEquipment, shape);
    
    this.dataService.updateEquipmentCoordinates(updatedEquipment).subscribe({
      next: () => {
        console.log('Equipment coordinates updated successfully');
      },
      error: (error) => {
        console.error('Failed to update equipment coordinates:', error);
      }
    });
  }

  /**
   * Highlight equipment on the image
   */
  highlightEquipment(equipmentId: number): void {
    this.shapeManager.selectShape(equipmentId, true);
    this.stateService.setHighlightedEquipmentId(equipmentId);
  }

  /**
   * Submit loto point form (create or update)
   */
  submitLotoPointForm(lotoPoint: LotoPointDto): void {
    if (!lotoPoint) return;

    if (lotoPoint.id) {
      // Update existing
      this.dataService.updateLotoPoint(lotoPoint).subscribe({
        next: () => {
          this.stateService.closeLotoPointForm();
        }
      });
    } else {
      // Create new
      this.dataService.createLotoPoint(lotoPoint).subscribe({
        next: () => {
          this.stateService.closeLotoPointForm();
        }
      });
    }
  }

  /**
   * Delete loto point
   */
  deleteLotoPoint(lotoPointId: number): void {
    if (!lotoPointId) return;

    this.dataService.deleteLotoPoint(lotoPointId).subscribe({
      next: () => {
        this.stateService.closeLotoPointForm();
      }
    });
  }

  /**
   * Create updated equipment DTO from shape changes
   */
  private createUpdatedEquipmentFromShape(equipment: EquipmentDto, shape: RfShape): EquipmentDto {
    const updatedEquipment = new EquipmentDto(equipment);

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
    }

    return updatedEquipment;
  }

  /**
   * Get shapes for InteractiveImageComponent
   */
  getShapesFromEquipment(): RfShape[] {
    const equipment = this.stateService.allEquipment();
    return this.equipmentMapper.mapAllToRfShapes(equipment);
  }
}
