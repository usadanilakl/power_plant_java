import {
  Component,
  Input,
  signal,
  computed,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import {
  RfUnifiedImageViewerComponent,
  ViewerDataSource,
  ViewerConfig,
} from '../../../../shared/image/refactored/rf-unified-image-viewer/rf-unified-image-viewer.component';

/**
 * LOTO Point File Viewer Component
 *
 * This component is now a lightweight wrapper around RfUnifiedImageViewerComponent.
 * It maintains backward compatibility while delegating all viewing logic to the unified viewer.
 *
 * **Refactored**: This component has been refactored to use the unified image viewer
 * for better code reusability and maintainability. All existing functionality is preserved.
 */
@Component({
  selector: 'app-loto-point-file-viewer',
  standalone: true,
  // forwardRef breaks the ES-module cycle:
  //   LotoPointFileViewer -> RfUnifiedImageViewer -> LotoPointDisplayTable
  //     -> RfLotoPointTable -> LotoPointFileViewer
  imports: [
    CommonModule,
    forwardRef(() => RfUnifiedImageViewerComponent),
  ],
  templateUrl: './loto-point-file-viewer.component.html',
  styleUrls: ['./loto-point-file-viewer.component.css'],
})
export class LotoPointFileViewerComponent {
  @Input() set lotoPoint(value: LotoPointDto | null) {
    this.lotoPointData.set(value);
  }

  lotoPointData = signal<LotoPointDto | null>(null);

  // Data source configuration for the unified viewer
  dataSource = computed<ViewerDataSource>(() => ({
    type: 'loto-point',
    lotoPoint: this.lotoPointData(),
  }));

  // UI configuration for the unified viewer
  viewerConfig: ViewerConfig = {
    showCarousel: true,
    showTable: false,
    tablePosition: 'none',
    collapsible: false,
    highlightMode: 'clicked',
    legend: true,
    emptyStateMessage: 'No images associated with this LOTO point\'s equipment.',
  };
}
