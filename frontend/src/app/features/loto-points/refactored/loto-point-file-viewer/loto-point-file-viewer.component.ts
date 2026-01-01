import {
  Component,
  Input,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import {
  RfImageCarouselComponent,
  CarouselImage,
} from '../../../../shared/image/refactored/rf-image-carousel/rf-image-carousel.component';
import { InteractiveImageComponent } from '../../../../shared/image/refactored/interactive-image/interactive-image.component';
import { RfShape } from '../../../../shared/image/refactored/models/fr-shape.model';
import { INTERACTIVE_IMAGE_PRESETS } from '../../../../shared/image/refactored/models/interactive-image-config.model';

@Component({
  selector: 'app-loto-point-file-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RfImageCarouselComponent,
    InteractiveImageComponent,
  ],
  templateUrl: './loto-point-file-viewer.component.html',
  styleUrls: ['./loto-point-file-viewer.component.css'],
})
export class LotoPointFileViewerComponent {
  @Input() set lotoPoint(value: LotoPointDto | null) {
    this.lotoPointData.set(value);
  }

  lotoPointData = signal<LotoPointDto | null>(null);
  selectedCarouselImage = signal<CarouselImage | null>(null);
  isCollapsed = signal<boolean>(false);

  // Extract unique files from equipment list
  carouselImages = computed(() => {
    const lotoPoint = this.lotoPointData();
    if (!lotoPoint || !lotoPoint.equipmentList) {
      return [];
    }

    const imagesMap = new Map<number, CarouselImage>();

    lotoPoint.equipmentList.forEach((equipment) => {
      if (equipment.mainFileObject && equipment.mainFileObject.id) {
        if (!imagesMap.has(equipment.mainFileObject.id)) {
          imagesMap.set(equipment.mainFileObject.id, {
            file: equipment.mainFileObject,
            equipmentTagNumber: equipment.tagNumber || undefined,
          });
        }
      }
    });

    return Array.from(imagesMap.values());
  });

  hasImages = computed(() => this.carouselImages().length > 0);

  // Get current image URL
  currentImageUrl = computed(() => {
    const selected = this.selectedCarouselImage();
    if (selected && selected.file) {
      return selected.file.fileLink || '';
    }

    const images = this.carouselImages();
    if (images.length > 0) {
      return images[0].file.fileLink || '';
    }

    return '';
  });

  // Get shapes for the current image - filter equipment by current file
  currentShapes = computed(() => {
    const selected = this.selectedCarouselImage();
    const lotoPoint = this.lotoPointData();

    if (!lotoPoint || !lotoPoint.equipmentList) {
      return [];
    }

    const currentFileId = selected?.file.id || this.carouselImages()[0]?.file.id;
    if (!currentFileId) {
      return [];
    }

    const shapes: RfShape[] = [];

    lotoPoint.equipmentList.forEach((equipment) => {
      if (
        equipment.mainFileObject?.id === currentFileId &&
        equipment.coordinates &&
        equipment.originalPictureSize
      ) {
        const shape = this.createShapeFromEquipment(equipment, lotoPoint);
        if (shape) {
          shapes.push(shape);
        }
      }
    });

    return shapes;
  });

  // Image preset for view-only mode
  imagePreset = 'VIEW_ONLY' as keyof typeof INTERACTIVE_IMAGE_PRESETS;

  constructor() {
    // Auto-select first image when carousel images change
    effect(() => {
      const images = this.carouselImages();
      if (images.length > 0 && !this.selectedCarouselImage()) {
        this.selectedCarouselImage.set(images[0]);
      }
    });
  }

  toggleCollapse() {
    this.isCollapsed.update((value) => !value);
  }

  onImageSelected(image: CarouselImage) {
    this.selectedCarouselImage.set(image);
  }

  private createShapeFromEquipment(
    equipment: EquipmentDto,
    lotoPoint: LotoPointDto
  ): RfShape | null {
    try {
      const coordinates = JSON.parse(equipment.coordinates || '{}');
      const pictureSize = this.parsePictureSize(equipment.originalPictureSize || '');

      if (!coordinates.startX || !coordinates.startY || !coordinates.endX || !coordinates.endY) {
        return null;
      }

      // Determine if this equipment belongs to the current loto point
      const isHighlighted = equipment.id && lotoPoint.equipmentIdList?.includes(equipment.id);

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
        color: isHighlighted ? '#ff0000' : '#0000ff',
        rotation: equipment.rotation || 0,
        originalPictureWidth: pictureSize.width,
        originalPictureHeight: pictureSize.height,
        originalWidth: width,
        originalHeight: height,
        isSelected: false,
        isBulkSelected: isHighlighted || false,
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
