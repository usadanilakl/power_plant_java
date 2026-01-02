import { Component, input, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { LotoPointDisplayTableComponent } from '../../../loto-points/refactored/loto-point-display-table/loto-point-display-table.component';
import {
  RfImageCarouselComponent,
  CarouselImage,
} from '../../../../shared/image/refactored/rf-image-carousel/rf-image-carousel.component';
import { InteractiveImageComponent } from '../../../../shared/image/refactored/interactive-image/interactive-image.component';
import { RfShape } from '../../../../shared/image/refactored/models/fr-shape.model';
import { INTERACTIVE_IMAGE_PRESETS } from '../../../../shared/image/refactored/models/interactive-image-config.model';

@Component({
  selector: 'app-loto-standard-image-viewer',
  standalone: true,
  imports: [
    CommonModule,
    LotoPointDisplayTableComponent,
    RfImageCarouselComponent,
    InteractiveImageComponent,
  ],
  templateUrl: './loto-standard-image-viewer.component.html',
  styleUrls: ['./loto-standard-image-viewer.component.css'],
})
export class LotoStandardImageViewerComponent {
  lotoStandard = input<LotoStandardDto>(new LotoStandardDto());

  // Track which LOTO point's images should be highlighted (from row click)
  clickedLotoPoint = signal<LotoPointDto | null>(null);

  // Track selected carousel image
  selectedCarouselImage = signal<CarouselImage | null>(null);

  // Aggregate all unique images from all LOTO points in the standard
  allCarouselImages = computed(() => {
    const standard = this.lotoStandard();
    if (!standard || !standard.lotoPoints) {
      return [];
    }

    const imagesMap = new Map<number, CarouselImage & { lotoPointId: number }>();

    standard.lotoPoints.forEach((lotoPoint) => {
      if (lotoPoint.equipmentList) {
        lotoPoint.equipmentList.forEach((equipment) => {
          if (equipment.mainFileObject && equipment.mainFileObject.id) {
            if (!imagesMap.has(equipment.mainFileObject.id)) {
              imagesMap.set(equipment.mainFileObject.id, {
                file: equipment.mainFileObject,
                equipmentTagNumber: equipment.tagNumber || undefined,
                lotoPointId: lotoPoint.id || 0,
              });
            }
          }
        });
      }
    });

    return Array.from(imagesMap.values());
  });

  hasImages = computed(() => this.allCarouselImages().length > 0);

  // Get current image URL - from carousel selection or first image
  currentImageUrl = computed(() => {
    const selected = this.selectedCarouselImage();
    if (selected && selected.file) {
      return selected.file.fileLink || '';
    }

    const images = this.allCarouselImages();
    if (images.length > 0) {
      return images[0].file.fileLink || '';
    }

    return '';
  });

  // Get shapes for the current image
  currentShapes = computed(() => {
    const selected = this.selectedCarouselImage();
    const standard = this.lotoStandard();
    const clickedPoint = this.clickedLotoPoint();

    if (!standard || !standard.lotoPoints) {
      return [];
    }

    const currentFileId = selected?.file.id || this.allCarouselImages()[0]?.file.id;
    if (!currentFileId) {
      return [];
    }

    const shapes: RfShape[] = [];

    standard.lotoPoints.forEach((lotoPoint) => {
      if (lotoPoint.equipmentList) {
        lotoPoint.equipmentList.forEach((equipment) => {
          if (
            equipment.mainFileObject?.id === currentFileId &&
            equipment.coordinates &&
            equipment.originalPictureSize
          ) {
            // Highlight equipment from clicked LOTO point
            const shouldHighlight = clickedPoint && clickedPoint.id === lotoPoint.id;
            const shape = this.createShapeFromEquipment(equipment, lotoPoint, shouldHighlight ?? false);
            if (shape) {
              shapes.push(shape);
            }
          }
        });
      }
    });

    return shapes;
  });

  // Image preset for view-only mode
  imagePreset = 'VIEW_ONLY' as keyof typeof INTERACTIVE_IMAGE_PRESETS;

  constructor() {
    // Auto-select first image when carousel images change
    effect(() => {
      const images = this.allCarouselImages();
      if (images.length > 0 && !this.selectedCarouselImage()) {
        this.selectedCarouselImage.set(images[0]);
      }
    });
  }

  /**
   * Handle row click (not selection) from the table
   * This should show the LOTO point's images highlighted
   */
  onLotoPointClicked(clickedPoint: LotoPointDto): void {
    console.log('LOTO Point row clicked:', clickedPoint);
    this.clickedLotoPoint.set(clickedPoint);

    // Find first image from this LOTO point and select it in carousel
    const pointImages = this.allCarouselImages().filter(
      img => img.lotoPointId === clickedPoint.id
    );

    if (pointImages.length > 0) {
      this.selectedCarouselImage.set(pointImages[0]);
    }
  }

  /**
   * Handle carousel image selection
   */
  onImageSelected(image: CarouselImage): void {
    console.log('Carousel image selected:', image);
    this.selectedCarouselImage.set(image);
  }

  /**
   * Handle table selection (for multi-select operations, not for image viewing)
   */
  onLotoPointSelected(selectedPoints: LotoPointDto[]): void {
    // This is for table selection/checkbox functionality, not image viewing
    // Image viewing is triggered by row click, not selection
  }

  /**
   * Handle row hover - can be used for preview
   */
  onLotoPointHovered(hoveredPoint: LotoPointDto | null): void {
    // Optional: Show preview on hover
  }

  private createShapeFromEquipment(
    equipment: EquipmentDto,
    lotoPoint: LotoPointDto,
    shouldHighlight: boolean
  ): RfShape | null {
    try {
      const coordinates = this.parseCoordinates(equipment.coordinates || '');
      const pictureSize = this.parsePictureSize(equipment.originalPictureSize || '');

      if (!coordinates.startX || !coordinates.startY || !coordinates.endX || !coordinates.endY) {
        return null;
      }

      // Calculate width and height from start/end coordinates
      const x = Math.min(coordinates.startX, coordinates.endX);
      const y = Math.min(coordinates.startY, coordinates.endY);
      const width = Math.abs(coordinates.endX - coordinates.startX);
      const height = Math.abs(coordinates.endY - coordinates.startY);

      const shape: RfShape = {
        id: equipment.id || 0,
        fileId: equipment.mainFileObject?.id || 0,
        type: 'rectangle',
        x: x,
        y: y,
        width: width,
        height: height,
        color: shouldHighlight ? '#ff0000' : '#0000ff',
        rotation: equipment.rotation || 0,
        originalPictureWidth: pictureSize.width,
        originalPictureHeight: pictureSize.height,
        originalWidth: width,
        originalHeight: height,
        isSelected: false,
        isBulkSelected: shouldHighlight || false,
        currentImgWidth: pictureSize.width,
        currentImgHeigth: pictureSize.height,
        scaleToCurrentImage: 1,
      };

      return shape;
    } catch (error) {
      console.error('Error creating shape from equipment:', error);
      return null;
    }
  }

  private parseCoordinates(coordString: string): { startX: number; startY: number; endX: number; endY: number } {
    try {
      // Parse format: "startX:485,startY:123,endX:600,endY:250"
      const parts = coordString.split(',');
      const coords: any = {};

      parts.forEach(part => {
        const [key, value] = part.split(':');
        if (key && value) {
          coords[key.trim()] = parseInt(value.trim());
        }
      });

      return {
        startX: coords.startX || 0,
        startY: coords.startY || 0,
        endX: coords.endX || 0,
        endY: coords.endY || 0,
      };
    } catch {
      return { startX: 0, startY: 0, endX: 0, endY: 0 };
    }
  }

  private parsePictureSize(sizeString: string): { width: number; height: number } {
    try {
      const parts = sizeString.split(',');
      const width = parseInt(parts[0]?.split(':')[1] || '0');
      const height = parseInt(parts[1]?.split(':')[1] || '0');
      return { width, height };
    } catch {
      return { width: 0, height: 0 };
    }
  }
}
