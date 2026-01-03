import { Component, input, output, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import {
  RfImageCarouselComponent,
  CarouselImage,
} from '../rf-image-carousel/rf-image-carousel.component';
import { InteractiveImageComponent } from '../interactive-image/interactive-image.component';
import { RfShape } from '../models/fr-shape.model';
import { INTERACTIVE_IMAGE_PRESETS } from '../models/interactive-image-config.model';
import { EquipmentMapperService } from '../../../../features/equipment/refactored/services/equipment-mapper.service';
import { EquipmentModel } from '../../../../models/equipment/equipment.model';
import { LotoPointDisplayTableComponent } from '../../../../features/loto-points/refactored/loto-point-display-table/loto-point-display-table.component';
import { FileDto } from '../../../../models/file/file.model';

/**
 * Data source configuration for the viewer
 */
export interface ViewerDataSource {
  type: 'loto-point' | 'loto-standard' | 'equipment-list' | 'file';
  lotoPoint?: LotoPointDto | null;
  lotoStandard?: LotoStandardDto | null;
  equipmentList?: EquipmentModel[] | null;
  file?: FileDto | null;
}

/**
 * UI configuration for the viewer
 */
export interface ViewerConfig {
  showCarousel?: boolean;
  showTable?: boolean;
  tablePosition?: 'none' | 'left' | 'right' | 'popup';
  collapsible?: boolean;
  highlightMode?: 'clicked' | 'hovered' | 'both' | 'none';
  legend?: boolean;
  emptyStateMessage?: string;
}

/**
 * Unified Image Viewer Component
 *
 * This component consolidates all image viewing functionality across:
 * - LOTO Point File Viewer
 * - LOTO Standard Image Viewer
 * - File Editor (view mode)
 *
 * It provides a flexible, configurable interface for displaying images,
 * equipment shapes, and LOTO point data in various contexts.
 */
@Component({
  selector: 'app-rf-unified-image-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RfImageCarouselComponent,
    InteractiveImageComponent,
    LotoPointDisplayTableComponent,
  ],
  templateUrl: './rf-unified-image-viewer.component.html',
  styleUrls: ['./rf-unified-image-viewer.component.css'],
})
export class RfUnifiedImageViewerComponent {
  private equipmentMapper = inject(EquipmentMapperService);

  // ==================== INPUTS ====================

  /**
   * Viewing mode - controls interactivity
   */
  mode = input<keyof typeof INTERACTIVE_IMAGE_PRESETS>('VIEW_ONLY');

  /**
   * Data source configuration
   */
  dataSource = input.required<ViewerDataSource>();

  /**
   * UI configuration
   */
  config = input<ViewerConfig>({
    showCarousel: true,
    showTable: false,
    tablePosition: 'none',
    collapsible: false,
    highlightMode: 'clicked',
    legend: true,
    emptyStateMessage: 'No images available',
  });

  /**
   * External hover control (for synchronized highlighting)
   */
  externalHoveredShapeId = input<number | null>(null);

  /**
   * External clicked LOTO point (for highlighting)
   */
  externalClickedLotoPoint = input<LotoPointDto | null>(null);

  // ==================== OUTPUTS ====================

  imageSelected = output<CarouselImage>();
  shapeHovered = output<RfShape | null>();
  shapeClicked = output<RfShape>();
  shapeDoubleClicked = output<RfShape>();
  shapeRightClicked = output<RfShape>();
  shapeUpdated = output<RfShape>();
  shapeDrawn = output<RfShape>();
  lotoPointClicked = output<LotoPointDto>();
  lotoPointSelected = output<LotoPointDto[]>();
  lotoPointHovered = output<LotoPointDto | null>();

  // ==================== INTERNAL STATE ====================

  selectedCarouselImage = signal<CarouselImage | null>(null);
  clickedLotoPoint = signal<LotoPointDto | null>(null);
  isCollapsed = signal<boolean>(true);

  // ==================== COMPUTED DATA ====================

  /**
   * Aggregate all carousel images based on data source
   */
  carouselImages = computed(() => {
    const source = this.dataSource();
    const imagesMap = new Map<number, CarouselImage & { lotoPointId?: number }>();

    switch (source.type) {
      case 'loto-point':
        if (source.lotoPoint?.equipmentList) {
          source.lotoPoint.equipmentList.forEach((equipment) => {
            if (equipment.mainFileObject?.id) {
              if (!imagesMap.has(equipment.mainFileObject.id)) {
                imagesMap.set(equipment.mainFileObject.id, {
                  file: equipment.mainFileObject,
                  equipmentTagNumber: equipment.tagNumber || undefined,
                  lotoPointId: source.lotoPoint?.id || 0,
                });
              }
            }
          });
        }
        break;

      case 'loto-standard':
        if (source.lotoStandard?.lotoPoints) {
          source.lotoStandard.lotoPoints.forEach((lotoPoint) => {
            if (lotoPoint.equipmentList) {
              lotoPoint.equipmentList.forEach((equipment) => {
                if (equipment.mainFileObject?.id) {
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
        }
        break;

      case 'equipment-list':
        if (source.equipmentList) {
          source.equipmentList.forEach((equipment) => {
            if (equipment.mainFileObject?.id) {
              if (!imagesMap.has(equipment.mainFileObject.id)) {
                imagesMap.set(equipment.mainFileObject.id, {
                  file: equipment.mainFileObject,
                  equipmentTagNumber: equipment.tagNumber || undefined,
                });
              }
            }
          });
        }
        break;

      case 'file':
        if (source.file) {
          imagesMap.set(source.file.id || 0, {
            file: source.file,
          });
        }
        break;
    }

    return Array.from(imagesMap.values());
  });

  hasImages = computed(() => this.carouselImages().length > 0);

  /**
   * Current file ID for filtering shapes
   */
  currentFileId = computed(() => {
    const selected = this.selectedCarouselImage();
    if (selected?.file?.id) {
      return selected.file.id;
    }
    const firstImage = this.carouselImages()[0];
    return firstImage?.file?.id || null;
  });

  /**
   * Current image URL
   */
  currentImageUrl = computed(() => {
    const source = this.dataSource();

    // For file type, use the file directly (file editor case)
    if (source.type === 'file' && source.file) {
      return source.file.fileLink || '';
    }

    const selected = this.selectedCarouselImage();
    if (selected?.file) {
      return selected.file.fileLink || '';
    }

    const images = this.carouselImages();
    if (images.length > 0) {
      return images[0].file.fileLink || '';
    }

    return '';
  });

  /**
   * Get shapes for the current image
   */
  currentShapes = computed(() => {
    const fileId = this.currentFileId();
    const source = this.dataSource();
    const clickedPoint = this.externalClickedLotoPoint() || this.clickedLotoPoint();

    if (!fileId) return [];

    const shapes: RfShape[] = [];

    switch (source.type) {
      case 'loto-point':
        if (source.lotoPoint?.equipmentList) {
          source.lotoPoint.equipmentList.forEach((equipment) => {
            if (equipment.mainFileObject?.id === fileId &&
                equipment.coordinates &&
                equipment.originalPictureSize) {
              const shape = this.equipmentMapper.mapToRfShape(equipment, {
                shouldHighlight: true, // Always highlight in single LOTO point view
                highlightColor: '#ff0000',
                defaultColor: '#0000ff',
              });
              if (shape) shapes.push(shape);
            }
          });
        }
        break;

      case 'loto-standard':
        if (source.lotoStandard?.lotoPoints) {
          source.lotoStandard.lotoPoints.forEach((lotoPoint) => {
            if (lotoPoint.equipmentList) {
              lotoPoint.equipmentList.forEach((equipment) => {
                if (equipment.mainFileObject?.id === fileId &&
                    equipment.coordinates &&
                    equipment.originalPictureSize) {
                  const shouldHighlight = clickedPoint?.id === lotoPoint.id;
                  const shape = this.equipmentMapper.mapToRfShape(equipment, {
                    shouldHighlight: shouldHighlight,
                    highlightColor: '#ff0000',
                    defaultColor: '#0000ff',
                  });
                  if (shape) shapes.push(shape);
                }
              });
            }
          });
        }
        break;

      case 'equipment-list':
        if (source.equipmentList) {
          source.equipmentList.forEach((equipment) => {
            if (equipment.mainFileObject?.id === fileId &&
                equipment.coordinates &&
                equipment.originalPictureSize) {
              const shape = this.equipmentMapper.mapToRfShape(equipment);
              if (shape) shapes.push(shape);
            }
          });
        }
        break;

      case 'file':
        // For file type with equipment list (used by file editor)
        // The equipment list from CurrentFileService is already filtered to current file
        // Don't add additional fileId filtering - just map all equipment that has coordinates
        if (source.equipmentList) {
          source.equipmentList.forEach((equipment) => {
            if (equipment.coordinates && equipment.originalPictureSize) {
              const shape = this.equipmentMapper.mapToRfShape(equipment);
              if (shape) shapes.push(shape);
            }
          });
        }
        break;
    }

    return shapes;
  });

  /**
   * LOTO points for table display
   */
  lotoPointsForTable = computed(() => {
    const source = this.dataSource();

    switch (source.type) {
      case 'loto-standard':
        return source.lotoStandard?.lotoPoints || [];
      case 'equipment-list':
        // Extract LOTO points from equipment
        const lotoPoints: LotoPointDto[] = [];
        if (source.equipmentList) {
          source.equipmentList.forEach(eq => {
            if (eq.lotoPoints && eq.lotoPoints.length > 0) {
              eq.lotoPoints.forEach(lp => {
                if (!lotoPoints.find(p => p.id === lp.id)) {
                  lotoPoints.push(lp);
                }
              });
            }
          });
        }
        return lotoPoints;
      default:
        return [];
    }
  });

  /**
   * Should show table based on config and data
   */
  shouldShowTable = computed(() => {
    const cfg = this.config();
    return cfg.showTable && cfg.tablePosition !== 'none' && this.lotoPointsForTable().length > 0;
  });

  constructor() {
    // Auto-select first image when carousel images change
    effect(() => {
      const images = this.carouselImages();
      if (images.length > 0 && !this.selectedCarouselImage()) {
        this.selectedCarouselImage.set(images[0]);
      }
    });

    // Sync external clicked LOTO point
    effect(() => {
      const externalClicked = this.externalClickedLotoPoint();
      if (externalClicked) {
        this.clickedLotoPoint.set(externalClicked);
      }
    });
  }

  // ==================== EVENT HANDLERS ====================

  onImageSelected(image: CarouselImage): void {
    this.selectedCarouselImage.set(image);
    this.imageSelected.emit(image);
  }

  onShapeHovered(shape: RfShape | null): void {
    this.shapeHovered.emit(shape);
  }

  onShapeClicked(shape: RfShape): void {
    this.shapeClicked.emit(shape);
  }

  onShapeDoubleClicked(shape: RfShape): void {
    this.shapeDoubleClicked.emit(shape);
  }

  onShapeRightClicked(shape: RfShape): void {
    this.shapeRightClicked.emit(shape);
  }

  onShapeUpdated(shape: RfShape): void {
    this.shapeUpdated.emit(shape);
  }

  onShapeDrawn(shape: RfShape): void {
    this.shapeDrawn.emit(shape);
  }

  onLotoPointClicked(clickedPoint: LotoPointDto): void {
    this.clickedLotoPoint.set(clickedPoint);
    this.lotoPointClicked.emit(clickedPoint);

    // Find first image from this LOTO point and select it
    const pointImages = this.carouselImages().filter(
      img => (img as any).lotoPointId === clickedPoint.id
    );

    if (pointImages.length > 0) {
      this.selectedCarouselImage.set(pointImages[0]);
    }
  }

  onLotoPointSelected(selectedPoints: LotoPointDto[]): void {
    this.lotoPointSelected.emit(selectedPoints);
  }

  onLotoPointHovered(hoveredPoint: LotoPointDto | null): void {
    this.lotoPointHovered.emit(hoveredPoint);
  }

  toggleCollapse(): void {
    this.isCollapsed.update(value => !value);
  }
}
