import {
  Component,
  inject,
  computed,
  signal,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { InteractiveImageComponent } from '../../../../shared/image/refactored/interactive-image/interactive-image.component';
import {
  getPreset,
  InteractiveImageConfig,
} from '../../../../shared/image/refactored/models/interactive-image-config.model';
import { RfShape } from '../../../../shared/image/refactored/models/fr-shape.model';
import { ContextMenuAction } from '../../../../shared/menu/context-menu/context-menu.component';
import { WorkAreaMapStateService } from './work-area-map-state.service';
import { WorkAreaMapInfoWindowComponent } from './work-area-map-info-window.component';

@Component({
  selector: 'app-work-area-map',
  standalone: true,
  imports: [
    CommonModule,
    InteractiveImageComponent,
    WorkAreaMapInfoWindowComponent,
  ],
  template: `
    <div class="map-panel">
      @if (state.plantMapImageUrl()) {
        <!-- Map toolbar (Edit mode only) -->
        @if (state.mode() === 'dev') {
          <div class="map-toolbar">
            <input
              type="file"
              accept=".pdf"
              #toolbarFileInput
              (change)="onFileSelected($event)"
              style="display: none"
            />
            <button class="toolbar-btn" (click)="toolbarFileInput.click()" [disabled]="state.isLoading()">
              {{ state.isLoading() ? 'Uploading...' : 'Change Map Image' }}
            </button>
            @if (selectedFileName()) {
              <span class="file-name">{{ selectedFileName() }}</span>
            }
          </div>
        }
        <div class="map-image-wrapper">
          <app-interactive-image
            [imageUrl]="state.plantMapImageUrl()"
            [shapesInput]="state.rfShapes()"
            [hoveredShapeId]="state.hoveredShapeId()"
            [selectedShapeIdInput]="state.selectedShapeId()"
            [config]="imageConfig()"
            [customContextMenuActions]="contextMenuActions()"
            (shapeHovered)="onShapeHovered($event)"
            (shapeClicked)="onShapeClicked($event)"
            (shapeUpdated)="onShapeUpdated($event)"
            (shapeDrawn)="onShapeDrawn($event)"
            (shapeDeleted)="onShapesDeleted($event)"
          ></app-interactive-image>

          <!-- Floating Info Window -->
          <app-work-area-map-info-window></app-work-area-map-info-window>
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">&#128506;</div>
          <p class="empty-title">No Plant Map Image</p>
          <p class="empty-message">
            Upload a PDF of the plant layout to start managing work areas on the map.
          </p>
          <div class="image-upload">
            <input
              type="file"
              accept=".pdf"
              #fileInput
              (change)="onFileSelected($event)"
              style="display: none"
            />
            <button class="action-btn" (click)="fileInput.click()" [disabled]="state.isLoading()">
              {{ state.isLoading() ? 'Uploading...' : 'Upload Plant Map (PDF)' }}
            </button>
            @if (selectedFileName()) {
              <span class="file-name">{{ selectedFileName() }}</span>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .map-panel {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--primary-background, #ffffff);
    }

    /* Map Toolbar */
    .map-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: var(--secondary-background, #f5f5f5);
      border-bottom: 1px solid var(--border-color, #e0e0e0);
      flex-shrink: 0;
    }

    .toolbar-btn {
      padding: 4px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 12px;
      color: #374151;
    }

    .toolbar-btn:hover:not(:disabled) { background: #f3f4f6; }
    .toolbar-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .file-name { font-size: 13px; color: #6b7280; }

    /* Map image wrapper (for floating info window positioning) */
    .map-image-wrapper {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #6b7280;
      gap: 8px;
    }

    .empty-icon { font-size: 48px; opacity: 0.5; }

    .empty-title {
      font-size: 18px; font-weight: 600;
      color: #374151; margin: 0;
    }

    .empty-message {
      font-size: 14px; color: #9ca3af;
      margin: 0; text-align: center; max-width: 400px;
    }

    .image-upload {
      display: flex; align-items: center;
      gap: 12px; margin-top: 16px;
    }

    .action-btn {
      padding: 8px 16px; border: none; border-radius: 6px;
      background: #2563eb; color: white;
      cursor: pointer; font-size: 13px;
    }

    .action-btn:hover:not(:disabled) { background: #1d4ed8; }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class WorkAreaMapComponent implements OnDestroy {
  state = inject(WorkAreaMapStateService);
  private isBrowser: boolean;

  selectedFileName = signal<string>('');

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /** Image config based on current mode */
  imageConfig = computed<InteractiveImageConfig>(() => {
    switch (this.state.mode()) {
      case 'dev':
        return getPreset('WORK_AREA_EDITOR');
      case 'operator':
        return getPreset('WORK_AREA_SELECTOR');
      case 'overview':
        return getPreset('WORK_AREA_OVERVIEW');
    }
  });

  /** Custom context menu actions based on mode */
  contextMenuActions = computed<ContextMenuAction[]>(() => {
    const mode = this.state.mode();
    if (mode === 'dev') {
      return [
        {
          id: 'edit',
          label: 'Edit Work Area',
          icon: 'edit',
          action: (shape: RfShape) => this.handleEditAction(shape),
        },
        {
          id: 'assign',
          label: 'Assign Work Area',
          icon: 'link',
          action: (shape: RfShape) => this.handleAssignAction(shape),
        },
        {
          id: 'delete',
          label: 'Delete Shape',
          icon: 'delete',
          action: (shape: RfShape) => this.handleDeleteAction(shape),
        },
      ];
    }
    return [
      {
        id: 'view',
        label: 'View Work Area',
        icon: 'visibility',
        action: (shape: RfShape) => this.handleViewAction(shape),
      },
    ];
  });

  ngOnDestroy(): void {}

  // --- Shape Events ---

  onShapeHovered(shape: RfShape | null): void {
    this.state.hoveredShapeId.set(shape?.id ?? null);
  }

  onShapeClicked(shape: RfShape): void {
    this.state.selectShape(shape.id);
    this.state.showShapeInfoWindow(shape.id);
  }

  onShapeUpdated(shape: RfShape): void {
    if (this.state.mode() !== 'dev') return;
    this.state.saveShape(shape);
  }

  onShapeDrawn(shape: RfShape): void {
    if (this.state.mode() !== 'dev') return;
    this.state.saveShape(shape, true);
  }

  onShapesDeleted(shapeIds: number[]): void {
    if (this.state.mode() !== 'dev') return;
    shapeIds.forEach(id => this.state.deleteShape(id));
  }

  // --- Context Menu Action Handlers ---

  /**
   * Edit the work area on this shape. With exactly one area we can go straight to
   * its form; with several there is no "the" work area, so open the info window
   * and let the user pick via that card's own Edit button (picking workAreaIds[0]
   * silently edited an arbitrary area).
   */
  private handleEditAction(shape: RfShape): void {
    const shapeDto = this.state.shapes().find(s => s.id === shape.id);
    const areas = shapeDto
      ? this.state.workAreas().filter(w => shapeDto.workAreaIds.includes(w.id))
      : [];

    if (areas.length === 1) {
      this.state.selectShape(shape.id);
      this.state.openWorkAreaForm(areas[0]);
      return;
    }

    if (areas.length > 1) {
      this.state.selectShape(shape.id);
      this.state.showShapeInfoWindow(shape.id);
      return;
    }

    this.handleAssignAction(shape);
  }

  private handleAssignAction(shape: RfShape): void {
    this.state.selectShape(shape.id);
  }

  private handleDeleteAction(shape: RfShape): void {
    if (confirm('Delete this shape from the map?')) {
      this.state.deleteShape(shape.id);
    }
  }

  private handleViewAction(shape: RfShape): void {
    this.state.selectShape(shape.id);
    this.state.showShapeInfoWindow(shape.id);
  }

  // --- File Upload ---

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFileName.set(file.name);
      this.state.uploadMapImage(file);
    }
    input.value = '';
  }
}
