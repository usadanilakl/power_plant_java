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
  lotoStandard = input<LotoStandardDto>(new LotoStandardDto());

  // Track which LOTO point was clicked (for backward compatibility)
  clickedLotoPoint = signal<LotoPointDto | null>(null);

  // Data source configuration for the unified viewer
  dataSource = computed<ViewerDataSource>(() => ({
    type: 'loto-standard',
    lotoStandard: this.lotoStandard(),
  }));

  // UI configuration for the unified viewer
  viewerConfig: ViewerConfig = {
    showCarousel: true,
    showTable: true,
    tablePosition: 'left',
    collapsible: false,
    highlightMode: 'clicked',
    legend: true,
    emptyStateMessage: 'No images are associated with the LOTO points in this standard',
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
}
