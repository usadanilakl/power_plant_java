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

  // Track current file ID explicitly for shape filtering
  currentFileId = computed(() => {
    const selected = this.selectedCarouselImage();
    if (selected?.file?.id) {
      return selected.file.id;
    }
    // Fallback to first image's file ID
    const firstImage = this.allCarouselImages()[0];
    return firstImage?.file?.id || null;
  });

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
    const fileId = this.currentFileId();
    const standard = this.lotoStandard();
    const clickedPoint = this.clickedLotoPoint();

    // Early returns for invalid state
    if (!fileId) {
      console.log('[currentShapes] No file ID available');
      return [];
    }

    if (!standard?.lotoPoints || standard.lotoPoints.length === 0) {
      console.log('[currentShapes] No LOTO points in standard');
      return [];
    }

    const shapes: RfShape[] = [];

    // Iterate through all LOTO points and their equipment
    standard.lotoPoints.forEach((lotoPoint) => {
      if (!lotoPoint.equipmentList) return;

      lotoPoint.equipmentList.forEach((equipment) => {
        // Only process equipment for the current file
        if (equipment.mainFileObject?.id !== fileId) return;

        // Validate required data exists
        if (!equipment.coordinates || !equipment.originalPictureSize) {
          console.warn('[currentShapes] Equipment missing coordinates or picture size:', {
            equipmentId: equipment.id,
            tagNumber: equipment.tagNumber,
            hasCoordinates: !!equipment.coordinates,
            hasPictureSize: !!equipment.originalPictureSize
          });
          return;
        }

        // Highlight equipment from clicked LOTO point
        const shouldHighlight = clickedPoint?.id === lotoPoint.id;
        const shape = this.createShapeFromEquipment(equipment, lotoPoint, shouldHighlight);

        if (shape) {
          shapes.push(shape);
        } else {
          console.warn('[currentShapes] Failed to create shape for equipment:', equipment.tagNumber);
        }
      });
    });

    console.log('[currentShapes] File ID:', fileId, '| Shapes count:', shapes.length);
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

      // Validate coordinates - all must be non-zero
      if (!coordinates.startX || !coordinates.startY || !coordinates.endX || !coordinates.endY) {
        console.warn('[createShape] Invalid coordinates:', {
          equipmentTag: equipment.tagNumber,
          rawCoordinates: equipment.coordinates,
          parsed: coordinates
        });
        return null;
      }

      // Validate picture size
      if (!pictureSize.width || !pictureSize.height) {
        console.warn('[createShape] Invalid picture size:', {
          equipmentTag: equipment.tagNumber,
          rawSize: equipment.originalPictureSize,
          parsed: pictureSize
        });
        return null;
      }

      // Calculate width and height from start/end coordinates
      const x = Math.min(coordinates.startX, coordinates.endX);
      const y = Math.min(coordinates.startY, coordinates.endY);
      const width = Math.abs(coordinates.endX - coordinates.startX);
      const height = Math.abs(coordinates.endY - coordinates.startY);

      // Validate that width and height are non-zero
      if (width === 0 || height === 0) {
        console.warn('[createShape] Zero width or height:', {
          equipmentTag: equipment.tagNumber,
          width,
          height,
          coordinates
        });
        return null;
      }

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
      console.error('[createShape] Error creating shape:', {
        equipmentTag: equipment.tagNumber,
        error
      });
      return null;
    }
  }

  private parseCoordinates(coordString: string): { startX: number; startY: number; endX: number; endY: number } {
    try {
      if (!coordString) {
        return { startX: 0, startY: 0, endX: 0, endY: 0 };
      }

      // Remove curly braces if present (handles JSON-like format)
      const cleanedString = coordString.replace(/[{}]/g, '').trim();

      // Parse format: "startX:485,startY:123,endX:600,endY:250" or "StartX:485,StartY:123,EndX:600,EndY:250"
      const parts = cleanedString.split(',');
      const coords: any = {};

      parts.forEach(part => {
        const [key, value] = part.split(':');
        if (key && value) {
          // Normalize key to lowercase for case-insensitive matching
          const normalizedKey = key.trim().toLowerCase();
          const parsedValue = parseFloat(value.trim()); // Use parseFloat to handle decimals
          if (!isNaN(parsedValue)) {
            coords[normalizedKey] = parsedValue;
          }
        }
      });

      return {
        startX: coords.startx || 0,
        startY: coords.starty || 0,
        endX: coords.endx || 0,
        endY: coords.endy || 0,
      };
    } catch (error) {
      console.error('[parseCoordinates] Parse error:', { coordString, error });
      return { startX: 0, startY: 0, endX: 0, endY: 0 };
    }
  }

  private parsePictureSize(sizeString: string): { width: number; height: number } {
    try {
      if (!sizeString) {
        return { width: 0, height: 0 };
      }

      // Remove curly braces if present
      const cleanedString = sizeString.replace(/[{}]/g, '').trim();

      // Parse format: "width:1920,height:1080" or "Width:1920,Height:1080"
      const parts = cleanedString.split(',');
      const size: any = {};

      parts.forEach(part => {
        const [key, value] = part.split(':');
        if (key && value) {
          const normalizedKey = key.trim().toLowerCase();
          const parsedValue = parseFloat(value.trim());
          if (!isNaN(parsedValue)) {
            size[normalizedKey] = parsedValue;
          }
        }
      });

      return {
        width: size.width || 0,
        height: size.height || 0
      };
    } catch (error) {
      console.error('[parsePictureSize] Parse error:', { sizeString, error });
      return { width: 0, height: 0 };
    }
  }
}
