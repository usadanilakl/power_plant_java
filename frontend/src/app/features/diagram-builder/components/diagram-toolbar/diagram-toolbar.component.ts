import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramDrawingService } from '../../services/diagram-drawing.service';
import { DiagramGridService } from '../../services/diagram-grid.service';
import { DiagramShapeManagerService } from '../../services/diagram-shape-manager.service';
import { AlignmentType, DiagramToolType, DistributeType } from '../../models/diagram-shape.model';

@Component({
  selector: 'app-diagram-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diagram-toolbar">
      <!-- Drawing tools -->
      <div class="tool-group">
        <span class="group-label">Tools</span>
        <div class="tool-buttons">
          @for (tool of drawingTools; track tool.id) {
            <button
              class="tool-btn"
              [class.active]="drawingService.activeTool() === tool.id"
              [title]="tool.label"
              (click)="drawingService.setTool(tool.id)">
              {{ tool.icon }}
            </button>
          }
        </div>
      </div>

      <!-- Alignment tools -->
      <div class="tool-group">
        <span class="group-label">Align</span>
        <div class="tool-buttons">
          @for (align of alignmentTools; track align.type) {
            <button
              class="tool-btn"
              [title]="align.label"
              [disabled]="shapeManager.selectedShapes().length < 2"
              (click)="onAlign.emit(align.type)">
              {{ align.icon }}
            </button>
          }
        </div>
      </div>

      <!-- Distribute tools -->
      <div class="tool-group">
        <span class="group-label">Distribute</span>
        <div class="tool-buttons">
          <button class="tool-btn" title="Distribute Horizontally"
            [disabled]="shapeManager.selectedShapes().length < 3"
            (click)="onDistribute.emit('horizontal')">⟺</button>
          <button class="tool-btn" title="Distribute Vertically"
            [disabled]="shapeManager.selectedShapes().length < 3"
            (click)="onDistribute.emit('vertical')">⟺̃</button>
        </div>
      </div>

      <!-- Canvas tools -->
      <div class="tool-group">
        <span class="group-label">Canvas</span>
        <div class="tool-buttons">
          <button class="tool-btn"
            [class.active]="gridService.gridVisible()"
            title="Toggle Grid"
            (click)="gridService.toggleGrid()">⊞</button>
          <button class="tool-btn"
            [class.active]="gridService.snapEnabled()"
            title="Snap to Grid"
            (click)="gridService.toggleSnap()">⊡</button>
          <button class="tool-btn" title="Zoom In" (click)="onZoomIn.emit()">+</button>
          <button class="tool-btn" title="Zoom Out" (click)="onZoomOut.emit()">−</button>
          <button class="tool-btn" title="Fit to View" (click)="onZoomFit.emit()">⊟</button>
        </div>
      </div>

      <!-- Group -->
      <div class="tool-group">
        <span class="group-label">Group</span>
        <div class="tool-buttons">
          <button class="tool-btn" title="Group (Ctrl+G)"
            [disabled]="shapeManager.selectionCount() < 2"
            (click)="onGroup.emit()">⊞</button>
          <button class="tool-btn" title="Ungroup (Ctrl+Shift+G)"
            [disabled]="!shapeManager.hasGroupInSelection()"
            (click)="onUngroup.emit()">⊟</button>
        </div>
      </div>

      <!-- Actions -->
      <div class="tool-group">
        <span class="group-label">Actions</span>
        <div class="tool-buttons">
          <button class="tool-btn danger" title="Delete Selected (Del)"
            [disabled]="!shapeManager.hasSelection()"
            (click)="onDelete.emit()">✕</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .diagram-toolbar {
      display: flex;
      gap: 12px;
      padding: 6px 12px;
      background: #1e1e1e;
      border-bottom: 1px solid #333;
      align-items: center;
      flex-wrap: wrap;
    }
    .tool-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .group-label {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
    }
    .tool-buttons {
      display: flex;
      gap: 2px;
    }
    .tool-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #444;
      background: #2a2a2a;
      color: #ccc;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .tool-btn:hover:not(:disabled) {
      background: #3a3a3a;
      border-color: #666;
    }
    .tool-btn.active {
      background: #1565c0;
      border-color: #2196f3;
      color: #fff;
    }
    .tool-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .tool-btn.danger:hover:not(:disabled) {
      background: #c62828;
      border-color: #f44336;
    }
  `]
})
export class DiagramToolbarComponent {
  drawingService = inject(DiagramDrawingService);
  gridService = inject(DiagramGridService);
  shapeManager = inject(DiagramShapeManagerService);

  onAlign = output<AlignmentType>();
  onDistribute = output<DistributeType>();
  onDelete = output<void>();
  onGroup = output<void>();
  onUngroup = output<void>();
  onZoomIn = output<void>();
  onZoomOut = output<void>();
  onZoomFit = output<void>();

  drawingTools: { id: DiagramToolType; icon: string; label: string }[] = [
    { id: 'select', icon: '⇱', label: 'Select' },
    { id: 'draw-rectangle', icon: '▭', label: 'Rectangle' },
    { id: 'draw-circle', icon: '○', label: 'Circle' },
    { id: 'draw-line', icon: '╱', label: 'Line' },
    { id: 'draw-text', icon: 'T', label: 'Text' },
    { id: 'place-symbol', icon: '⚙', label: 'P&ID Symbol' },
    { id: 'draw-connection', icon: '⟶', label: 'Connection' },
  ];

  alignmentTools: { type: AlignmentType; icon: string; label: string }[] = [
    { type: 'left', icon: '⫍', label: 'Align Left' },
    { type: 'right', icon: '⫎', label: 'Align Right' },
    { type: 'top', icon: '⫠', label: 'Align Top' },
    { type: 'bottom', icon: '⫡', label: 'Align Bottom' },
    { type: 'h-center', icon: '⫰', label: 'Center Horizontal' },
    { type: 'v-center', icon: '⫯', label: 'Center Vertical' },
  ];
}
