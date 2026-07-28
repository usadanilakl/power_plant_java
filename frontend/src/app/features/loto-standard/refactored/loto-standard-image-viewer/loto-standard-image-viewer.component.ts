import { Component, input, signal, computed, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import {
  RfUnifiedImageViewerComponent,
  ViewerDataSource,
  ViewerConfig,
} from '../../../../shared/image/refactored/rf-unified-image-viewer/rf-unified-image-viewer.component';
import { RfLotoStandardApiService } from '../services/rf-loto-standard-api.service';
import { RfLotoStandardStateService } from '../services/rf-loto-standard-state.service';
import { GlobalMessageService } from '../../../../shared/global-message/global-message.service';

/**
 * LOTO Standard Image Viewer Component
 *
 * This component is now a lightweight wrapper around RfUnifiedImageViewerComponent.
 * It maintains backward compatibility while delegating all viewing logic to the unified viewer.
 *
 * **Refactored**: This component has been refactored to use the unified image viewer
 * for better code reusability and maintainability. All existing functionality is preserved.
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
  private apiService = inject(RfLotoStandardApiService);
  private stateService = inject(RfLotoStandardStateService);
  private messageService = inject(GlobalMessageService);

  lotoStandard = input<LotoStandardDto>(new LotoStandardDto());

  // Track which LOTO point was clicked (for backward compatibility)
  clickedLotoPoint = signal<LotoPointDto | null>(null);

  // Data source configuration for the unified viewer
  dataSource = computed<ViewerDataSource>(() => ({
    type: 'loto-standard',
    lotoStandard: this.lotoStandard(),
  }));

  // UI configuration for the unified viewer. Opts into
  // enableRemoveFromStandard + enableReorder so the embedded LOTO Point
  // table renders the sticky-left "Remove from Standard" arrow AND
  // supports drag-drop reorder — the two per-point edits the user asked
  // to surface on the Images tab. When either event fires on the viewer
  // we call the shared LOTO Standard API (same code path the LOTO Points
  // tab uses via rf-loto-standard-form).
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

  // Outputs for backward compatibility
  lotoPointClickedOutput = output<LotoPointDto>({ alias: 'lotoPointClicked' });
  lotoPointSelectedOutput = output<LotoPointDto[]>({ alias: 'lotoPointSelected' });
  lotoPointHoveredOutput = output<LotoPointDto | null>({ alias: 'lotoPointHovered' });

  /**
   * Handle LOTO point click from unified viewer
   */
  onLotoPointClicked(clickedPoint: LotoPointDto): void {
    this.clickedLotoPoint.set(clickedPoint);
    this.lotoPointClickedOutput.emit(clickedPoint);
  }

  /**
   * Handle LOTO point selection from unified viewer
   */
  onLotoPointSelected(selectedPoints: LotoPointDto[]): void {
    this.lotoPointSelectedOutput.emit(selectedPoints);
  }

  /**
   * Handle LOTO point hover from unified viewer
   */
  onLotoPointHovered(hoveredPoint: LotoPointDto | null): void {
    this.lotoPointHoveredOutput.emit(hoveredPoint);
  }

  /**
   * Sticky-left arrow click → detach the point from the standard's
   * LOTO points list. Calls the same API the LOTO Points tab uses; the
   * standards state service auto-refetches via the SSE echo path.
   */
  onRemoveFromStandard(point: LotoPointDto): void {
    const standard = this.lotoStandard();
    if (!standard?.id || !point?.id) return;
    this.apiService.removeLotoPointFromStandard(standard.id, point.id).subscribe({
      next: () => {
        // Optimistic local remove — the SSE reactivity will echo it, but
        // touching the local list first avoids the visible lag.
        const updated = new LotoStandardDto({
          ...standard,
          lotoPoints: (standard.lotoPoints ?? []).filter(p => p.id !== point.id),
        });
        this.stateService.updateLotoStandardInList(updated);
      },
      error: (err) => {
        console.error('Failed to remove LOTO point from standard:', err);
        this.messageService.showError(
          err?.error?.message || err?.message || 'Failed to remove point from standard'
        );
      },
    });
  }

  /**
   * Drag-drop reorder on the Images tab's table. Persists via the same
   * reorderLotoPoints endpoint the LOTO Points tab uses.
   */
  onLotoPointsReordered(reordered: LotoPointDto[]): void {
    const standard = this.lotoStandard();
    if (!standard?.id) return;
    const orderedIds = reordered.map(p => p.id!).filter(id => id != null);
    if (orderedIds.length === 0) return;
    this.apiService.reorderLotoPoints(standard.id, orderedIds).subscribe({
      next: () => {
        // Local mirror so the current view snaps to the new order without
        // waiting for the SSE echo.
        const updated = new LotoStandardDto({
          ...standard,
          lotoPoints: reordered,
        });
        this.stateService.updateLotoStandardInList(updated);
      },
      error: (err) => {
        console.error('Failed to reorder LOTO points:', err);
        this.messageService.showError(
          err?.error?.message || err?.message || 'Failed to reorder points'
        );
      },
    });
  }
}
