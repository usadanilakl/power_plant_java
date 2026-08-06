import { CommonModule } from "@angular/common";
import { Component, computed, DestroyRef, effect, inject, signal } from "@angular/core";
import { PdfDisplayIframeComponent } from "../../../shared/pdf-dislplay-iframe/pdf-dislplay-iframe.component";
import { CurrentFileService } from "../../../services/current-file.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs/operators";
import { PopupProjectionComponent } from "../../../shared/popup-projection/popup-projection.component";
import { LotoPointDto } from "../../../models/loto/loto-point.model";
import { ShapeManagerService } from "../../../shared/image/refactored/services/shape-manager.service";
import { RfShape } from "../../../shared/image/refactored/models/fr-shape.model";
import { LotoPointDisplayTableComponent } from "../../loto-points/refactored/loto-point-display-table/loto-point-display-table.component";
import { RfLotoPointFormComponent } from "../../loto-points/refactored/rf-loto-point-form/rf-loto-point-form.component";
import { LotoPointDualFormComponent } from "../../loto-points/refactored/loto-point-dual-form/loto-point-dual-form.component";
import { EquipmentService } from "../../../services/equipment.service";
import { EquipmentDto } from "../../../models/equipment/equipment.model";
import { FileDto } from "../../../models/file/file.model";
import { RfFileApiService } from "./services/rf-file-api.service";
import {
  RfUnifiedImageViewerComponent,
  ViewerDataSource,
  ViewerConfig,
} from "../../../shared/image/refactored/rf-unified-image-viewer/rf-unified-image-viewer.component";

/**
 * File Editor Component
 *
 * This component is now a wrapper around RfUnifiedImageViewerComponent for image files,
 * while maintaining PDF display and LOTO point editing capabilities.
 *
 * **Refactored**: This component has been refactored to use the unified image viewer
 * for better code reusability. All existing functionality is preserved.
 */
@Component({
  selector: 'app-rf-file-editor',
  imports: [
    CommonModule,
    PdfDisplayIframeComponent,
    RfUnifiedImageViewerComponent,
    PopupProjectionComponent,
    LotoPointDisplayTableComponent,
    RfLotoPointFormComponent,
    LotoPointDualFormComponent,
  ],
  templateUrl: './rf-file-editor.component.html',
  styleUrl: './rf-file-editor.component.css',
  standalone: true,
})
export class RfFileEditroComponent {

  private currentFileService = inject(CurrentFileService);
  private equipmentService = inject(EquipmentService);
  private shapeManager = inject(ShapeManagerService);
  private fileApi = inject(RfFileApiService);
  private destroyRef = inject(DestroyRef);

  // File and equipment from service
  currentFile = toSignal(this.currentFileService.currentFile$, { initialValue: null });
  equipment = toSignal(this.currentFileService.elementsToRender$, { initialValue: null });

  fileLink = computed(() => {
    const file = this.currentFile();
    if (!file) return '';
    return file.fileLink;
  });

  // Check if current file is PDF
  isPdf = computed(() => {
    const link = this.fileLink();
    return link.endsWith('.pdf');
  });

  // Check if current file is image
  isImage = computed(() => {
    const link = this.fileLink();
    return link.endsWith('.jpg') || link.endsWith('.jpeg') || link.endsWith('.png');
  });

  // LOTO point table popup state
  isLotoPointTableOpen = signal<boolean>(false);

  // LOTO point edit form state
  isLotoPointFormOpen = signal<boolean>(false);
  selectedLotoPoint = signal<LotoPointDto | null>(null);

  /**
   * Unit-specific points (tag starts with 01/02) render the side-by-side
   * counterpart editor — same heuristic the loto-builder form-popup uses.
   * Non-unit points get the single rf-loto-point-form. This unifies the
   * file-editor with the loto-builder so users see the same form everywhere.
   */
  showDualForm = computed(() => {
    const tag = this.selectedLotoPoint()?.tagNumber;
    return !!(tag && (tag.startsWith('01') || tag.startsWith('02')));
  });

  // Hover state for synchronized highlighting
  hoveredEquipmentId = signal<number | null>(null);
  hoveredLotoPoint = signal<LotoPointDto | null>(null);

  // ==================== COUNTERPART SIDE-BY-SIDE ====================
  // Toggle + fetched counterpart file for the optional split-view that
  // renders the linked counterpart file's image/PDF next to the primary.
  // Counterpart pane is image/PDF-only (no shape-editing) — the user can
  // still right-click the row in the file table and "Open Counterpart File"
  // for full editing.
  showCounterpart = signal<boolean>(false);
  counterpartFile = signal<FileDto | null>(null);
  counterpartLoading = signal<boolean>(false);
  counterpartError = signal<string | null>(null);

  counterpartFileLink = computed(() => this.counterpartFile()?.fileLink ?? '');
  counterpartIsPdf = computed(() => this.counterpartFileLink().endsWith('.pdf'));
  counterpartIsImage = computed(() => {
    const l = this.counterpartFileLink();
    return l.endsWith('.jpg') || l.endsWith('.jpeg') || l.endsWith('.png');
  });
  /**
   * Render the counterpart's equipment as shape overlays — read-only on this
   * pane (no edit events wired) but the user can SEE which equipment is on
   * the counterpart for visual comparison. Equipment comes from the
   * counterpart's full FileDto (points field), which getFileById returns.
   */
  counterpartDataSource = computed<ViewerDataSource>(() => ({
    type: 'file',
    file: this.counterpartFile(),
    equipmentList: this.counterpartFile()?.points ?? null,
  }));

  /** True when the primary file has a counterpartId pointer (button enabled). */
  hasCounterpart = computed(() => !!this.currentFile()?.counterpartId);

  // ==================== SHAPE COORD-SPACE MISMATCH WARNING ====================
  // Shapes are stored in the picture-size coordinate space they were drawn on
  // (Equipment.originalPictureSize). At render time they linearly scale to the
  // current image's natural dimensions. If a new revision produced a JPG whose
  // dimensions/aspect differ from what shapes were drawn on, linear scaling can
  // only account for proportional resize — content-offset drift (different
  // margins, added/removed title block, different DPI) will visibly misplace
  // shapes and there is no automatic fix. Warn the user so they know a re-anchor
  // is needed. Probes the JPG in the background; nothing renders until the
  // probe completes.
  currentImageDims = signal<{ width: number; height: number } | null>(null);
  dimensionWarning = computed<{ pictureSize: string; delta: string } | null>(() => {
    const dims = this.currentImageDims();
    const equipment = this.equipment();
    if (!dims || !equipment || equipment.length === 0) return null;
    // Collect the unique originalPictureSize strings actually in play on this file.
    const seen = new Set<string>();
    for (const eq of equipment) {
      if (eq.originalPictureSize) seen.add(eq.originalPictureSize);
    }
    if (seen.size === 0) return null;
    const currentAspect = dims.width / dims.height;
    for (const raw of seen) {
      const m = raw.replace(/[{}]/g, '').match(/width:(\d+(?:\.\d+)?),\s*height:(\d+(?:\.\d+)?)/i);
      if (!m) continue;
      const ow = Number(m[1]);
      const oh = Number(m[2]);
      if (!ow || !oh) continue;
      const aspectDelta = Math.abs((ow / oh) - currentAspect) / currentAspect;
      const widthDelta = Math.abs(ow - dims.width) / ow;
      const heightDelta = Math.abs(oh - dims.height) / oh;
      // Any aspect drift ≥1% OR either linear dim off by ≥5% is a real risk of
      // visible shape misplacement — linear normalization can't correct for it.
      if (aspectDelta > 0.01 || widthDelta > 0.05 || heightDelta > 0.05) {
        return {
          pictureSize: `${ow}×${oh}`,
          delta: `now ${dims.width}×${dims.height} (aspect drift ${(aspectDelta * 100).toFixed(1)}%)`,
        };
      }
    }
    return null;
  });

  constructor() {
    // Probe the current image's natural dimensions off the DOM whenever the file
    // link changes. Uses a bare Image() so we don't depend on the interactive-image
    // component being loaded / measured. Nulls the signal first so the banner
    // hides during navigation instead of flashing stale info.
    effect(() => {
      const link = this.fileLink();
      this.currentImageDims.set(null);
      if (!link || !this.isImage()) return;
      const probe = new Image();
      probe.onload = () => {
        if (probe.naturalWidth > 0 && probe.naturalHeight > 0) {
          this.currentImageDims.set({ width: probe.naturalWidth, height: probe.naturalHeight });
        }
      };
      probe.onerror = () => { /* leave dims null — no banner */ };
      probe.src = link;
    });

    // Keep the counterpart pane in sync when the user navigates to a different
    // primary file. Without this, an open counterpart pane keeps showing the
    // OLD file's counterpart even after the user opens a new file.
    effect(() => {
      if (!this.showCounterpart()) return;
      const current = this.currentFile();
      const cpId = current?.counterpartId;
      if (!cpId) {
        this.counterpartFile.set(null);
        this.counterpartError.set('Current file has no counterpart linked.');
        return;
      }
      const cached = this.counterpartFile();
      if (cached && cached.id === cpId) return;
      this.loadCounterpart(cpId);
    });
  }

  private loadCounterpart(id: number): void {
    this.counterpartLoading.set(true);
    this.counterpartError.set(null);
    this.fileApi.getFileById(String(id)).pipe(
      map(r => FileDto.fromJson(r.responseData)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (dto) => {
        this.counterpartFile.set(dto);
        this.counterpartLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load counterpart:', err);
        this.counterpartError.set('Failed to load counterpart file');
        this.counterpartLoading.set(false);
      },
    });
  }

  // Compute all LOTO points from current file's equipment
  allLotoPoints = computed(() => {
    const equipment = this.equipment();
    if (!equipment) return [];

    const lotoPoints: LotoPointDto[] = [];
    const seenIds = new Set<number>();

    equipment.forEach(eq => {
      if (eq.lotoPoints && eq.lotoPoints.length > 0) {
        eq.lotoPoints.forEach(lp => {
          // Avoid duplicates
          if (lp.id && !seenIds.has(lp.id)) {
            seenIds.add(lp.id);
            lotoPoints.push(lp);
          }
        });
      }
    });
    return lotoPoints;
  });

  // Data source for unified viewer
  dataSource = computed<ViewerDataSource>(() => ({
    type: 'file',
    file: this.currentFile(),
    equipmentList: this.equipment(),
  }));

  // UI configuration for unified viewer
  // Note: Table is shown via popup, not in the viewer itself
  viewerConfig: ViewerConfig = {
    showCarousel: false,
    showTable: false,  // We handle table separately as popup
    tablePosition: 'none',
    collapsible: false,
    highlightMode: 'hovered',
    legend: false,
    emptyStateMessage: 'No equipment on this file',
  };

  /**
   * Toggle the counterpart side-by-side pane. First click fetches the linked
   * counterpart file (we may not have its full DTO in memory — context-menu
   * navigation works off the primary file's row data). Subsequent toggles
   * just flip the show flag; the counterpart stays cached.
   */
  toggleCounterpart(): void {
    // Simple toggle. The effect() in the constructor handles loading the right
    // counterpart based on the current file, so we don't duplicate fetch logic here.
    this.showCounterpart.set(!this.showCounterpart());
  }

  // ==================== FILE FORMAT TOGGLE ====================

  toggleFileFormat() {
    const currentFile = this.currentFile();
    if (!currentFile) return;

    const currentExtension = currentFile.fileLink?.split('.').pop();
    const newExtension = currentExtension === 'pdf' ? 'jpg' : 'pdf';
    this.currentFileService.switchFileFormat(newExtension);
  }

  // ==================== LOTO POINT TABLE METHODS ====================

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

    // Find equipment that contains this LOTO point
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
    // Store the hovered LOTO point
    this.hoveredLotoPoint.set(lotoPoint);

    if (!lotoPoint) {
      this.hoveredEquipmentId.set(null);
      return;
    }

    // Find equipment that contains this LOTO point
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

  // ==================== SHAPE EVENT HANDLERS (from unified viewer) ====================

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
      // Open the first LOTO point for editing
      this.selectedLotoPoint.set(matchingEquipment.lotoPoints[0]);
      this.isLotoPointFormOpen.set(true);
    }
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

  /**
   * Bulk-nudge helper for the "shape placement may be inaccurate" banner.
   * Selects every shape on the current file so the user can drag any one and
   * they all translate by the same visible delta (per-shape original-picture
   * scaling is handled in interactive-image.component's drag path). Same as
   * pressing Ctrl+A on the image, but discoverable from the warning banner
   * without needing keyboard focus on the canvas.
   */
  selectAllShapesForNudge(): void {
    const ids = this.shapeManager.shapes().map(s => s.id);
    if (ids.length === 0) return;
    this.shapeManager.selectMultipleShapes(ids);
  }

  // ==================== LOTO POINT FORM METHODS ====================

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
}
