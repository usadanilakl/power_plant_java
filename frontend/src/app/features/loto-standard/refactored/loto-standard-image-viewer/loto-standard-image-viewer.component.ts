import { Component, input, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { LotoPointDisplayTableComponent } from '../../../loto-points/refactored/loto-point-display-table/loto-point-display-table.component';
import {
  RfImageCarouselComponent,
  CarouselImage,
} from '../../../../shared/image/refactored/rf-image-carousel/rf-image-carousel.component';
import { InteractiveImageComponent } from '../../../../shared/image/refactored/interactive-image/interactive-image.component';
import { RfShape } from '../../../../shared/image/refactored/models/fr-shape.model';
import { INTERACTIVE_IMAGE_PRESETS } from '../../../../shared/image/refactored/models/interactive-image-config.model';
import { EquipmentMapperService } from '../../../equipment/refactored/services/equipment-mapper.service';

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
  private equipmentMapper = inject(EquipmentMapperService);

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
        const shape = this.equipmentMapper.mapToRfShape(equipment, {
          shouldHighlight: shouldHighlight,
          highlightColor: '#ff0000',
          defaultColor: '#0000ff'
        });

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
}
