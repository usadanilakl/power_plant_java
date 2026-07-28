import { Component, input, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import {
  RfUnifiedImageViewerComponent,
  ViewerDataSource,
  ViewerConfig,
} from '../../../../shared/image/refactored/rf-unified-image-viewer/rf-unified-image-viewer.component';

/**
 * LOTO Standard Image Viewer Component
 *
 * Thin wrapper around RfUnifiedImageViewerComponent that adds the Images-
 * tab table with per-row remove ← arrow + drag-drop reorder. Remove and
 * reorder events are EMITTED to the parent (rf-loto-standard-form) which
 * runs them through the SAME onLotoPointRemoved / onLotoPointsReordered
 * handlers the LOTO Points tab (dual-table) uses. Reusing the parent's
 * handler keeps the persistence flow identical across both tabs — no
 * separate API-call site, no separate optimistic-mirror logic, no
 * divergence in SSE-echo handling.
 */
@Component({
  selector: 'app-loto-standard-image-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RfUnifiedImageViewerComponent,
  ],
  templateUrl: './loto-standard-image-viewer.component.html',
  styleUrls: ['./loto-standard-image-viewer.component.css'],
})
export class LotoStandardImageViewerComponent {
  lotoStandard = input<LotoStandardDto>(new LotoStandardDto());

  clickedLotoPoint = signal<LotoPointDto | null>(null);

  dataSource = computed<ViewerDataSource>(() => ({
    type: 'loto-standard',
    lotoStandard: this.lotoStandard(),
  }));

  viewerConfig: ViewerConfig = {
    showCarousel: true,
    showTable: true,
    tablePosition: 'left',
    collapsible: false,
    highlightMode: 'clicked',
    legend: true,
    emptyStateMessage: 'No images are associated with the LOTO points in this standard',
    enableRemoveFromStandard: true,
    enableReorder: true,
  };

  lotoPointClickedOutput = output<LotoPointDto>({ alias: 'lotoPointClicked' });
  lotoPointSelectedOutput = output<LotoPointDto[]>({ alias: 'lotoPointSelected' });
  lotoPointHoveredOutput = output<LotoPointDto | null>({ alias: 'lotoPointHovered' });
  /** Bubbled to rf-loto-standard-form → onLotoPointRemoved (same handler dual-table uses). */
  removeLotoPoint = output<LotoPointDto>();
  /** Bubbled to rf-loto-standard-form → onLotoPointsReordered (same handler dual-table uses). */
  reorderLotoPoints = output<LotoPointDto[]>();

  onLotoPointClicked(clickedPoint: LotoPointDto): void {
    this.clickedLotoPoint.set(clickedPoint);
    this.lotoPointClickedOutput.emit(clickedPoint);
  }

  onLotoPointSelected(selectedPoints: LotoPointDto[]): void {
    this.lotoPointSelectedOutput.emit(selectedPoints);
  }

  onLotoPointHovered(hoveredPoint: LotoPointDto | null): void {
    this.lotoPointHoveredOutput.emit(hoveredPoint);
  }

  onRemoveFromStandard(point: LotoPointDto): void {
    if (point?.id != null) this.removeLotoPoint.emit(point);
  }

  onLotoPointsReordered(reordered: LotoPointDto[]): void {
    this.reorderLotoPoints.emit(reordered);
  }
}
