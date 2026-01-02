import { Component, inject, computed, DestroyRef, effect, output, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { InteractiveImageComponent } from '../../../../../shared/image/refactored/interactive-image/interactive-image.component';
import { LotoBuilderInfoWindowComponent } from '../loto-builder-info-window/loto-builder-info-window.component';
import { CurrentFileService } from '../../../../../services/current-file.service';
import { EquipmentMapperService } from '../../../../equipment/refactored/services/equipment-mapper.service';
import { EquipmentService } from '../../../../../services/equipment.service';
import { RfLotoPointStateService } from '../../../../loto-points/refactored/services/rf-loto-point-state.service';
import { RfShape } from '../../../../../shared/image/refactored/models/fr-shape.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';

@Component({
  selector: 'app-loto-builder-right-panel',
  standalone: true,
  imports: [
    CommonModule,
    InteractiveImageComponent,
    LotoBuilderInfoWindowComponent,
  ],
  templateUrl: './loto-builder-right-panel.component.html',
  styleUrl: './loto-builder-right-panel.component.css',
})
export class LotoBuilderRightPanelComponent {
  protected builderState = inject(LotoBuilderStateService);
  private currentFileService = inject(CurrentFileService);
  private equipmentMapper = inject(EquipmentMapperService);
  private equipmentService = inject(EquipmentService);
  private lotoPointStateService = inject(RfLotoPointStateService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  // Output event for close button
  closeRequested = output<void>();

  /**
   * Get current file's image URL
   */
  currentImageUrl = computed(() => {
    const file = this.builderState.currentFile();
    return file?.fileLink || '';
  });

  /**
   * Get current shapes from equipment
   */
  currentShapes = computed(() => {
    const equipment = this.builderState.currentEquipment();
    if (!equipment || equipment.length === 0) return [];

    const shapes = this.equipmentMapper.mapAllToRfShapes(equipment);
    return shapes;
  });

  /**
   * Get hovered shape ID
   */
  hoveredShapeId = computed(() => {
    return this.builderState.hoveredShapeId();
  });

  constructor() {
    // Sync currentShapes with builder state whenever equipment changes
    effect(() => {
      const shapes = this.currentShapes();
      this.builderState.currentShapes.set(shapes);
    });

    // Subscribe to current file changes to update builder state
    this.currentFileService.currentFile$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (file) => {
          if (file) {
            this.builderState.setCurrentFile(file);
          }
        },
        error: (error) => {
          console.error('Error loading file:', error);
        }
      });

    // Subscribe to current file service to load equipment when file changes
    this.currentFileService.elementsToRender$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (equipment) => {
          if (equipment) {
            this.builderState.setCurrentEquipment(equipment);
          }
        },
        error: (error) => {
          console.error('Error loading equipment:', error);
        }
      });

    // Subscribe to LOTO point selection from left menu
    toObservable(this.lotoPointStateService.selectedItem, { injector: this.injector })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lotoPoint) => {
          if (lotoPoint) {
            this.highlightLotoPointEquipment(lotoPoint);
          }
        },
        error: (error) => {
          console.error('Error handling LOTO point selection:', error);
        }
      });
  }

  /**
   * Handle shape hover
   */
  onShapeHovered(shape: RfShape | null): void {
    if (!shape) {
      this.builderState.hoveredShapeId.set(null);
      this.builderState.hoveredLotoPoint.set(null);
      return;
    }

    this.builderState.hoveredShapeId.set(shape.id);

    // Find the equipment and get its first LOTO point
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (matchingEquipment?.lotoPoints && matchingEquipment.lotoPoints.length > 0) {
      this.builderState.hoveredLotoPoint.set(matchingEquipment.lotoPoints[0]);
    } else {
      this.builderState.hoveredLotoPoint.set(null);
    }
  }

  /**
   * Handle shape click - show info window
   */
  onShapeClicked(shape: RfShape): void {
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (matchingEquipment?.lotoPoints && matchingEquipment.lotoPoints.length > 0) {
      const lotoPoint = matchingEquipment.lotoPoints[0];
      this.builderState.showLotoPointInfoWindow(lotoPoint);
    }
  }

  /**
   * Handle shape double click - enable editing (already handled by interactive-image)
   */
  onShapeDoubleClicked(shape: RfShape): void {
    console.log('Shape double clicked - editing enabled by interactive-image', shape);
  }

  /**
   * Handle shape right click - open context menu / LOTO point form
   */
  onShapeRightClicked(shape: RfShape): void {
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (matchingEquipment?.lotoPoints && matchingEquipment.lotoPoints.length > 0) {
      // Open form for existing LOTO point
      this.builderState.openLotoPointForm(matchingEquipment.lotoPoints[0]);
    } else {
      // Open empty form with "select existing" option
      this.builderState.openLotoPointForm(null);
      // Store the equipment for later association
      if (matchingEquipment) {
        this.builderState.setPendingEquipment(matchingEquipment);
      }
    }
  }

  /**
   * Handle shape update (after drag/resize)
   */
  onShapeUpdated(shape: RfShape): void {
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (!matchingEquipment) return;

    // Update equipment coordinates
    const updatedEquipment = new EquipmentDto(matchingEquipment);

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
            this.builderState.hasUnsavedChanges.set(false);
          },
          error: (error: any) => {
            console.error('Error updating equipment:', error);
          }
        });
    }
  }

  /**
   * Handle new shape drawn (right-click drag)
   */
  onShapeDrawn(shape: RfShape): void {
    console.log('New shape drawn:', shape);

    // Only handle shapes with position and size properties
    if (shape.type !== 'rectangle' && shape.type !== 'image' && shape.type !== 'svg-symbol') {
      console.warn('Cannot create equipment from shape type:', shape.type);
      return;
    }

    // Create new equipment from shape
    const newEquipment = new EquipmentDto({
      coordinates: JSON.stringify({
        startX: shape.x,
        startY: shape.y,
        endX: shape.x + shape.width,
        endY: shape.y + shape.height,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation || 0
      }).replace(/^"|"$/g, '').replace(/\\/g, '').replace(/"(\w+)":/g, '$1:'),
      originalPictureSize: `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`,
      mainFileObject: this.builderState.currentFile(),
    });

    // Save equipment to backend
    this.equipmentService.updateEquipment(newEquipment)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          console.log('Equipment created successfully:', response);
          const savedEquipment = EquipmentDto.fromJson(response.responseData);

          // Store as pending equipment
          this.builderState.setPendingEquipment(savedEquipment);

          // Open LOTO point form
          this.builderState.openLotoPointForm(null);
        },
        error: (error: any) => {
          console.error('Error creating equipment:', error);
        }
      });
  }

  /**
   * Handle save button click
   */
  onSave(): void {
    // Currently, equipment is auto-saved when updated or drawn
    // This method can be used for explicit save operations or batch saves
    console.log('Save button clicked');

    // Clear the unsaved changes flag
    this.builderState.hasUnsavedChanges.set(false);

    // TODO: Add any additional save logic here
    // For example: save form data, validate LOTO points, etc.
  }

  /**
   * Handle close button click
   */
  onClose(): void {
    this.closeRequested.emit();
  }

  /**
   * Highlight equipment associated with selected LOTO point
   */
  private highlightLotoPointEquipment(lotoPoint: LotoPointDto): void {
    // Find equipment that has this LOTO point
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq =>
      eq.lotoPoints && eq.lotoPoints.some(lp => lp.id === lotoPoint.id)
    );

    if (matchingEquipment) {
      // Highlight the equipment by setting it as hovered
      this.builderState.hoveredShapeId.set(matchingEquipment.id);
      this.builderState.hoveredLotoPoint.set(lotoPoint);

      // Show the info window
      this.builderState.showLotoPointInfoWindow(lotoPoint);
    } else {
      console.log('No equipment found for LOTO point:', lotoPoint.tagNumber);
    }
  }
}
