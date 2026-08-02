import { Component, input, output, signal, computed, effect, inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoPointDto, LotoPointFieldName } from '../../../../models/loto/loto-point.model';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import {
  RfImageCarouselComponent,
  CarouselImage,
} from '../rf-image-carousel/rf-image-carousel.component';
import { InteractiveImageComponent } from '../interactive-image/interactive-image.component';
import { RfFileViewerHostComponent } from '../../../../features/files/refactored/rf-file-viewer-host/rf-file-viewer-host.component';
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
  /**
   * When true, the embedded LotoPointDisplayTable renders a sticky-left
   * "Remove from Standard" arrow column and emits {@code lotoPointRemoveFromStandard}
   * on click. Off by default so the shared viewer's use elsewhere (file
   * editor, equipment browser) is unaffected.
   */
  enableRemoveFromStandard?: boolean;
  /**
   * When true, the embedded LotoPointDisplayTable enables drag-drop
   * reorder and emits {@code lotoPointsReordered} with the new order.
   */
  enableReorder?: boolean;
  /**
   * When true, shapes on the P&ID are rendered with a small numbered
   * badge matching their position in the standard's ordered LOTO
   * points list — makes cross-referencing a shape on the drawing to a
   * row in the points table a glance-check instead of a hunt.
   * Consumed by {@code CanvasRenderService.drawIndexBadge} on the
   * canvas layer. Only meaningful when the data source is
   * {@code 'loto-standard'} (or a future {@code 'loto'} case) whose
   * shape list is derived from an ordered lotoPoints array. Default
   * undefined = off for legacy consumers (file editor, equipment
   * browser); opt in per-caller.
   */
  showPointIndexLabels?: boolean;
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
  // forwardRef on LotoPointDisplayTableComponent breaks the ES-module cycle:
  //   RfUnifiedImageViewer → LotoPointDisplayTable → RfLotoPointTable
  //     → LotoPointFileViewer → RfUnifiedImageViewer
  // Without this, LotoPointDisplayTableComponent is `undefined` at the moment
  // this @Component decorator evaluates (module still loading in cycle), and
  // Angular throws "Cannot read properties of undefined (reading 'ɵcmp')"
  // while resolving the imports array. Symptom: /file/edit renders blank.
  imports: [
    CommonModule,
    RfImageCarouselComponent,
    InteractiveImageComponent,
    RfFileViewerHostComponent,
    forwardRef(() => LotoPointDisplayTableComponent),
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

  /**
   * External list of equipment/shape IDs to highlight (e.g., selected LOTO points' equipment)
   */
  highlightedShapeIds = input<number[]>([]);

  /**
   * Force raster (JPG) rendering even if the file URL points to a PDF.
   * Use this when equipment shape overlays are required (shapes don't render on PDFs).
   * Swaps ".pdf" → ".jpg" in the URL and routes through InteractiveImageComponent.
   */
  forceRasterImage = input<boolean>(false);

  /**
   * Extra shapes to overlay on top of whatever the viewer computes from
   * {@link dataSource}. Consumers that need to draw shapes the viewer's own
   * data source can't produce (currently only file-connectors) supply them
   * here already mapped to {@link RfShape}. Default empty — existing
   * consumers are unaffected.
   * <p>
   * These are appended after the equipment/loto shapes so they render on top
   * (last-drawn wins on the canvas). Nothing filters by {@code fileId} here;
   * callers are responsible for supplying only shapes that belong on the
   * currently visible drawing.
   */
  additionalShapes = input<RfShape[]>([]);

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
  /**
   * Emitted when the operator clicks the sticky-left "Remove from Standard"
   * arrow on a row. Only fires when config.enableRemoveFromStandard = true.
   * Consumers (LotoStandardImageViewerComponent) call the standard's
   * removeLotoPointFromStandard API in response.
   */
  lotoPointRemoveFromStandard = output<LotoPointDto>();
  /**
   * Emitted when the operator drags rows into a new order. Only fires when
   * config.enableReorder = true. Consumers call reorderLotoPoints on the API.
   */
  lotoPointsReordered = output<LotoPointDto[]>();

  // ==================== INTERNAL STATE ====================

  selectedCarouselImage = signal<CarouselImage | null>(null);
  clickedLotoPoint = signal<LotoPointDto | null>(null);
  isCollapsed = signal<boolean>(true);

  /**
   * Drives {@code [scrollToItemId]} on the embedded LOTO-point table. Set when
   * the operator clicks a shape on the drawing so the row for the owning
   * LOTO point scrolls into view (and is highlighted via {@link clickedLotoPoint}).
   * A monotonically increasing tick appended to the id would let re-clicking
   * the SAME shape re-scroll; we live without it — the table's scroll effect
   * fires on any input change, and repeat clicks usually mean "I lost the
   * row", which the highlight itself will draw attention to.
   */
  scrollToLotoPointId = signal<number | null>(null);

  // ==================== SPLIT PANEL RESIZE ====================
  // Draggable split between the table panel and the image section. The table
  // panel used to be a fixed 400px — operators with wider tables (many custom
  // columns) couldn't see field names, and operators with lots of vertical
  // real estate wanted more room for the drawing.
  //
  // Width persists in localStorage keyed by ${TABLE_WIDTH_STORAGE_KEY} so the
  // choice survives navigation. Session-only would also be fine — trade-off
  // is whether operator preference should stay across desktop restarts.
  private static readonly TABLE_WIDTH_STORAGE_KEY = 'rf-unified-viewer.table-panel-width';
  private static readonly TABLE_WIDTH_MIN = 240;
  private static readonly TABLE_WIDTH_MAX = 900;
  private static readonly TABLE_WIDTH_DEFAULT = 400;

  tablePanelWidth = signal<number>(this.readStoredTableWidth());
  private isResizingTablePanel = false;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private resizeSide: 'left' | 'right' = 'left';

  private readStoredTableWidth(): number {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage?.getItem(RfUnifiedImageViewerComponent.TABLE_WIDTH_STORAGE_KEY) : null;
      const n = raw != null ? parseInt(raw, 10) : NaN;
      if (Number.isFinite(n)) return this.clampTableWidth(n);
    } catch {
      // localStorage disabled (SSR, private mode, permission). Fall through.
    }
    return RfUnifiedImageViewerComponent.TABLE_WIDTH_DEFAULT;
  }

  private clampTableWidth(w: number): number {
    return Math.max(
      RfUnifiedImageViewerComponent.TABLE_WIDTH_MIN,
      Math.min(RfUnifiedImageViewerComponent.TABLE_WIDTH_MAX, Math.round(w)),
    );
  }

  /**
   * Start of a split-panel resize. Captures pointer via pointer events so
   * the drag survives even if the cursor briefly leaves the handle (which
   * happens as the panel resizes and the handle moves under the cursor).
   * The 'side' argument tracks which side the handle is on so we know
   * whether to add or subtract cursor delta from the current width.
   */
  startTablePanelResize(event: PointerEvent, side: 'left' | 'right'): void {
    event.preventDefault();
    this.isResizingTablePanel = true;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.tablePanelWidth();
    this.resizeSide = side;
    (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
  }

  onTablePanelResizeMove(event: PointerEvent): void {
    if (!this.isResizingTablePanel) return;
    const delta = event.clientX - this.resizeStartX;
    const signedDelta = this.resizeSide === 'left' ? delta : -delta;
    this.tablePanelWidth.set(this.clampTableWidth(this.resizeStartWidth + signedDelta));
  }

  endTablePanelResize(event: PointerEvent): void {
    if (!this.isResizingTablePanel) return;
    this.isResizingTablePanel = false;
    (event.target as HTMLElement)?.releasePointerCapture?.(event.pointerId);
    try {
      window.localStorage?.setItem(
        RfUnifiedImageViewerComponent.TABLE_WIDTH_STORAGE_KEY,
        String(this.tablePanelWidth()),
      );
    } catch { /* ignore storage failures — width still applies for this session */ }
  }

  // ==================== COMPUTED DATA ====================

  /**
   * Aggregate all carousel images based on data source
   */
  carouselImages = computed(() => {
    const source = this.dataSource();
    // Deduped by file id — one carousel entry per unique file. Selection is
    // resolved by file id in {@link onLotoPointClicked}, not by any lotoPointId
    // stored here (a legacy scheme that misfired when >1 LOTO point referenced
    // the same file — only the first point's id survived and the rest silently
    // failed to switch the image).
    const imagesMap = new Map<number, CarouselImage>();

    switch (source.type) {
      case 'loto-point':
        if (source.lotoPoint?.equipmentList) {
          source.lotoPoint.equipmentList.forEach((equipment) => {
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
   * Effective image URL — if forceRasterImage is true and the URL points to a PDF,
   * swap the extension to .jpg so shapes render correctly.
   */
  effectiveImageUrl = computed(() => {
    const url = this.currentImageUrl();
    if (!url) return '';
    if (this.forceRasterImage() && url.toLowerCase().endsWith('.pdf')) {
      return url.replace(/\.pdf$/i, '.jpg');
    }
    return url;
  });

  /**
   * Extension of the current file URL (lowercase, no dot). Empty if none.
   * Used to decide between the built-in raster viewer and the generic file host.
   */
  currentExtension = computed(() => {
    const url = this.effectiveImageUrl();
    if (!url) return '';
    const dot = url.lastIndexOf('.');
    if (dot < 0) return '';
    return url.substring(dot + 1).toLowerCase();
  });

  /**
   * True when the current URL is a raster image this component can render directly.
   * Non-raster (e.g. PDF) falls back to {@code RfFileViewerHostComponent}.
   * Always true when forceRasterImage is enabled.
   */
  isRasterImage = computed(() => {
    if (this.forceRasterImage()) return true;
    const ext = this.currentExtension();
    return ['png', 'jpg', 'jpeg', 'tif', 'tiff', 'gif', 'bmp', 'webp'].includes(ext);
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
          const showLabels = this.config().showPointIndexLabels === true;
          source.lotoStandard.lotoPoints.forEach((lotoPoint, i) => {
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
                    // 1-based ordinal — matches how the point list is
                    // presented (row 1, row 2, …); only wired when the
                    // consumer opted in via config.showPointIndexLabels.
                    pointIndex: showLabels ? i + 1 : undefined,
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

    // Append caller-supplied overlays (currently file-connectors — the viewer's
    // data source can't produce them because they're a separate entity, so the
    // consumer fetches + maps and hands them in ready-to-render).
    const extra = this.additionalShapes();
    if (extra.length > 0) shapes.push(...extra);

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

  /**
   * Field-list passed to the embedded LotoPointDisplayTable. When the
   * consumer opts into {@code enableRemoveFromStandard}, the synthetic
   * {@code removeFromStandard} column is placed FIRST so the sticky-left
   * arrow is pinned to the left edge of the horizontal-scroll viewport
   * (same layout as the LOTO Standard editor's destination table).
   * Undefined = the mapper's default set.
   */
  viewerFieldsToDisplay = computed<LotoPointFieldName[] | undefined>(() => {
    const cfg = this.config();
    if (!cfg.enableRemoveFromStandard) return undefined;
    return [
      'removeFromStandard',
      'processingStatus', 'tagNumber', 'description', 'specificLocation',
      'location', 'eqType', 'isoPos', 'normPos',
      'isLabeled', 'isLockable', 'zeroEnergy', 'equipmentList',
      'comment',
    ];
  });

  /**
   * Carousel entries that belong to the currently highlighted LOTO point.
   * Empty until a point is selected. Length ≥ 2 → renders the "jump between
   * this point's P&IDs" chip strip near the drawing; length ≤ 1 → the strip
   * is redundant with the drawing itself and stays hidden.
   * <p>
   * We resolve by file id (matches how {@link onLotoPointClicked} switches),
   * NOT by re-running the shape filter — a LOTO point can legitimately live
   * on a P&ID even if its shape wasn't rendered on that file yet.
   */
  activePointCarouselImages = computed<CarouselImage[]>(() => {
    const point = this.externalClickedLotoPoint() || this.clickedLotoPoint();
    if (!point?.equipmentList) return [];
    const fileIds = new Set<number>();
    for (const eq of point.equipmentList) {
      const id = eq?.mainFileObject?.id;
      if (id != null) fileIds.add(id);
    }
    if (fileIds.size < 2) return [];
    return this.carouselImages().filter(img => img.file?.id != null && fileIds.has(img.file.id));
  });

  /** Convenience helper for the template — is a chip the currently selected image? */
  isActiveCarouselFile(fileId: number | null | undefined): boolean {
    const selected = this.selectedCarouselImage();
    return selected?.file?.id != null && selected.file.id === fileId;
  }

  /** Chip click — swap the drawing to this file without touching the highlight. */
  selectCarouselImage(image: CarouselImage): void {
    this.selectedCarouselImage.set(image);
    this.imageSelected.emit(image);
  }

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

    // Round-trip: shape click on the drawing → highlight that shape's owning
    // LOTO point in the table AND scroll its row into view. Equipment shapes
    // carry {@code shape.id === equipment.id}, so we find the LOTO point on
    // the current data source whose equipmentList contains that id.
    //
    // Skips for non-equipment shapes (file-connectors, drawing scratch) — those
    // aren't tied to a LOTO point. Also skips when the resolved point is
    // already the highlighted one (avoid a re-scroll on the same row).
    const point = this.findLotoPointOwningShape(shape);
    if (!point || point.id == null) return;
    if (this.clickedLotoPoint()?.id === point.id && this.scrollToLotoPointId() === point.id) return;
    this.clickedLotoPoint.set(point);
    this.scrollToLotoPointId.set(point.id);
    this.lotoPointClicked.emit(point);
  }

  /**
   * Which LOTO point owns the equipment behind this shape? Walks the current
   * data source. Returns null for shape types we can't attribute (e.g. file
   * connectors — those are file-level, not point-level).
   */
  private findLotoPointOwningShape(shape: RfShape): LotoPointDto | null {
    if (shape == null || shape.id == null) return null;
    if (shape.type === 'file-connector') return null;

    const source = this.dataSource();
    const equipmentId = shape.id;

    switch (source.type) {
      case 'loto-point':
        if (source.lotoPoint?.equipmentList?.some(eq => eq?.id === equipmentId)) {
          return source.lotoPoint;
        }
        return null;

      case 'loto-standard':
        if (!source.lotoStandard?.lotoPoints) return null;
        for (const point of source.lotoStandard.lotoPoints) {
          if (point?.equipmentList?.some(eq => eq?.id === equipmentId)) {
            return point;
          }
        }
        return null;

      case 'equipment-list':
      case 'file':
        // Equipment list is flat — no LOTO-point layer to resolve. Callers
        // that want row-scroll semantics on these modes wire it themselves.
        return null;

      default:
        return null;
    }
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

    // Resolve any file this LOTO point references and switch the carousel to it.
    //
    // Historically the carousel entry carried a single `lotoPointId` taken from
    // the FIRST LOTO point that referenced the file. Every subsequent LOTO
    // point sharing that file had no carousel entry keyed to its id, so
    // clicking those rows filtered to nothing and the image never switched
    // — even though the shape overlay would happily light up once the user
    // manually picked the file from the carousel. Fix: look up files from the
    // LOTO point itself and match carousel entries by file id.
    const fileIds = new Set<number>();
    (clickedPoint.equipmentList ?? []).forEach(eq => {
      const id = eq?.mainFileObject?.id;
      if (id != null) fileIds.add(id);
    });
    if (fileIds.size === 0) return;

    // If we're already showing one of the LOTO point's files, no switch needed.
    // Prevents a jarring image swap when the user is stepping through several
    // points that all live on the same P&ID.
    const currentSelected = this.selectedCarouselImage();
    if (currentSelected?.file?.id != null && fileIds.has(currentSelected.file.id)) return;

    const match = this.carouselImages().find(
      img => img.file?.id != null && fileIds.has(img.file.id)
    );
    if (match) {
      this.selectedCarouselImage.set(match);
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
