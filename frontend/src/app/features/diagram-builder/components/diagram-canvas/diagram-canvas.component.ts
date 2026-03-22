import {
  Component, ElementRef, ViewChild, AfterViewInit, OnInit, OnDestroy,
  inject, input, effect, HostListener, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagramShapeManagerService } from '../../services/diagram-shape-manager.service';
import { DiagramRenderService } from '../../services/diagram-render.service';
import { DiagramDrawingService, TransformState } from '../../services/diagram-drawing.service';
import { DiagramGridService } from '../../services/diagram-grid.service';
import { DiagramConnectionService } from '../../services/diagram-connection.service';
import { DiagramAlignmentService, ShapeUpdate } from '../../services/diagram-alignment.service';
import { DiagramStateService } from '../../services/diagram-state.service';
import { DiagramCanvasConfig, DIAGRAM_BUILDER_CONFIG, DIAGRAM_RENDERER_CONFIG } from '../../models/diagram-config.model';
import { DiagramToolbarComponent } from '../diagram-toolbar/diagram-toolbar.component';
import { DiagramPropertiesComponent } from '../diagram-properties/diagram-properties.component';
import { ZoomPanService } from '../../../../shared/image/refactored/services/zoom-pan.service';
import { PIDSymbolsService, PIDSymbol } from '../../../../shared/image/refactored/services/pid-symbols.service';
import { SymbolPaletteComponent } from '../../../../shared/image/refactored/symbol-palette/symbol-palette.component';
import { AlignmentType, AnchorPoint, DiagramElement, DistributeType } from '../../models/diagram-shape.model';

@Component({
  selector: 'app-diagram-canvas',
  standalone: true,
  imports: [CommonModule, DiagramToolbarComponent, DiagramPropertiesComponent, SymbolPaletteComponent],
  providers: [
    DiagramShapeManagerService,
    DiagramRenderService,
    DiagramDrawingService,
    DiagramGridService,
    DiagramConnectionService,
    DiagramAlignmentService,
    DiagramStateService,
    ZoomPanService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="diagram-page">
      @if (config.showToolbar) {
        <app-diagram-toolbar
          (onAlign)="onAlign($event)"
          (onDistribute)="onDistribute($event)"
          (onDelete)="deleteSelected()"
          (onZoomIn)="zoomIn()"
          (onZoomOut)="zoomOut()"
          (onZoomFit)="zoomFit()"
        />
      }

      <div class="diagram-workspace">
        @if (config.showSymbolPalette && drawingService.activeTool() === 'place-symbol') {
          <div class="symbol-palette-panel">
            <app-symbol-palette
              (symbolSelected)="onSymbolSelected($event)"
            />
          </div>
        }

        <div class="canvas-container" #canvasContainer
          (mousedown)="onMouseDown($event)"
          (mousemove)="onMouseMove($event)"
          (mouseup)="onMouseUp($event)"
          (wheel)="onWheel($event)"
          (contextmenu)="$event.preventDefault()">

          <div class="canvas-transform" #canvasTransform>
            <canvas #gridCanvas class="layer-canvas grid-canvas"></canvas>
            <canvas #shapeCanvas class="layer-canvas shape-canvas"></canvas>
            <canvas #tempCanvas class="layer-canvas temp-canvas"></canvas>
          </div>
        </div>

        @if (config.showProperties) {
          <app-diagram-properties />
        }
      </div>

      <!-- Status bar -->
      <div class="status-bar">
        <span>{{ stateService.diagramName() }}</span>
        <span>{{ Math.round(transform.scale * 100) }}%</span>
        @if (stateService.isDirty()) {
          <span class="dirty-indicator">● Unsaved</span>
        }
        @if (stateService.isSaving()) {
          <span class="saving-indicator">Saving...</span>
        }
        <span>{{ shapeManager.shapes().length }} shapes, {{ shapeManager.connections().length }} connections</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .diagram-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #121212;
      color: #e0e0e0;
    }
    .diagram-workspace {
      display: flex;
      flex: 1;
      overflow: hidden;
      position: relative;
    }
    .symbol-palette-panel {
      width: 200px;
      border-right: 1px solid #333;
      overflow-y: auto;
      background: #1a1a1a;
    }
    .canvas-container {
      flex: 1;
      overflow: hidden;
      position: relative;
      cursor: default;
    }
    .canvas-transform {
      position: relative;
      transform-origin: 0 0;
    }
    .layer-canvas {
      position: absolute;
      top: 0;
      left: 0;
    }
    .grid-canvas { z-index: 1; }
    .shape-canvas { z-index: 2; }
    .temp-canvas { z-index: 3; pointer-events: none; }
    .status-bar {
      display: flex;
      gap: 16px;
      padding: 4px 12px;
      background: #1e1e1e;
      border-top: 1px solid #333;
      font-size: 12px;
      color: #888;
    }
    .dirty-indicator { color: #ff9800; }
    .saving-indicator { color: #4caf50; }
  `],
})
export class DiagramCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasTransform') canvasTransformRef!: ElementRef<HTMLDivElement>;
  @ViewChild('gridCanvas') gridCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('shapeCanvas') shapeCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tempCanvas') tempCanvasRef!: ElementRef<HTMLCanvasElement>;

  shapeManager = inject(DiagramShapeManagerService);
  renderService = inject(DiagramRenderService);
  drawingService = inject(DiagramDrawingService);
  gridService = inject(DiagramGridService);
  connectionService = inject(DiagramConnectionService);
  alignmentService = inject(DiagramAlignmentService);
  stateService = inject(DiagramStateService);
  zoomPanService = inject(ZoomPanService);
  pidSymbols = inject(PIDSymbolsService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  config: DiagramCanvasConfig = DIAGRAM_BUILDER_CONFIG;
  transform: TransformState = { scale: 1, pointX: 0, pointY: 0 };

  private canvasWidth = 1920;
  private canvasHeight = 1080;
  private hoveredShapeId: number | null = null;
  private hoveredAnchor: AnchorPoint | null = null;
  private isDragging = false;
  private isPanning = false;
  private isResizing = false;
  private resizeHandle: string | null = null;
  private dragStartPositions = new Map<number, { x: number; y: number }>();
  private dragStartCanvas = { x: 0, y: 0 };
  private panStart = { x: 0, y: 0 };
  private resizeStartShape: DiagramElement | null = null;
  private resizeStartCanvas = { x: 0, y: 0 };
  private animFrameId = 0;
  protected Math = Math;

  constructor() {
    this.stateService.setShapeManager(this.shapeManager);

    // Re-render when shapes/connections/selection changes
    effect(() => {
      this.shapeManager.shapes();
      this.shapeManager.connections();
      this.shapeManager.selectedShapeIds();
      this.gridService.gridVisible();
      this.gridService.gridSize();
      this.requestRender();
    });

    effect(() => {
      const diagram = this.stateService.currentDiagram();
      if (!diagram) return;

      const nextWidth = diagram.canvasWidth ?? 1920;
      const nextHeight = diagram.canvasHeight ?? 1080;
      const nextGridSize = diagram.gridSize ?? 20;
      const sizeChanged = nextWidth !== this.canvasWidth || nextHeight !== this.canvasHeight;

      this.canvasWidth = nextWidth;
      this.canvasHeight = nextHeight;
      this.gridService.setGridSize(nextGridSize);

      if (sizeChanged) {
        this.setupCanvases();
      } else {
        this.requestRender();
      }
    });
  }

  ngOnInit(): void {
    const mode = this.route.snapshot.data['mode'];
    this.config = mode === 'renderer' ? DIAGRAM_RENDERER_CONFIG : DIAGRAM_BUILDER_CONFIG;

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.stateService.loadDiagram(Number(id));
    } else {
      this.stateService.createNewDiagram();
    }
  }

  ngAfterViewInit(): void {
    this.setupCanvases();
    this.requestRender();

    // Handle window resize
    const ro = new ResizeObserver(() => this.setupCanvases());
    ro.observe(this.canvasContainerRef.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  private setupCanvases(): void {
    const container = this.canvasContainerRef?.nativeElement;
    if (!container) return;

    const { clientWidth, clientHeight } = container;
    const canvases = [
      this.gridCanvasRef?.nativeElement,
      this.shapeCanvasRef?.nativeElement,
      this.tempCanvasRef?.nativeElement,
    ].filter(Boolean);

    for (const canvas of canvases) {
      if (canvas) {
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
        canvas.style.width = `${this.canvasWidth}px`;
        canvas.style.height = `${this.canvasHeight}px`;
      }
    }

    this.requestRender();
  }

  private requestRender(): void {
    if (this.animFrameId) return;
    this.animFrameId = requestAnimationFrame(() => {
      this.animFrameId = 0;
      this.render();
    });
  }

  private render(): void {
    // Apply transform
    const transformEl = this.canvasTransformRef?.nativeElement;
    if (transformEl) {
      transformEl.style.transform =
        `translate(${this.transform.pointX}px, ${this.transform.pointY}px) scale(${this.transform.scale})`;
    }

    // Grid
    const gridCtx = this.gridCanvasRef?.nativeElement?.getContext('2d');
    if (gridCtx) {
      this.gridService.drawGrid(gridCtx, this.canvasWidth, this.canvasHeight, this.transform.scale);
    }

    // Shapes + connections
    const shapeCtx = this.shapeCanvasRef?.nativeElement?.getContext('2d');
    if (shapeCtx) {
      this.renderService.drawAll(
        shapeCtx,
        this.shapeManager.shapes(),
        this.shapeManager.connections(),
        this.shapeManager.selectedShapeIds(),
        this.hoveredShapeId,
        this.transform.scale
      );

      // Draw anchor points in connection mode
      if (this.drawingService.activeTool() === 'draw-connection') {
        for (const shape of this.shapeManager.shapes()) {
          this.renderService.drawAnchorPoints(shapeCtx, shape, this.hoveredAnchor);
        }
      }
    }

    // Temp canvas (drawing preview)
    const tempCtx = this.tempCanvasRef?.nativeElement?.getContext('2d');
    if (tempCtx) {
      tempCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      if (this.drawingService.isDrawing()) {
        this.drawingService.drawPreview(tempCtx, this.canvasWidth, this.canvasHeight);
      }
      if (this.connectionService.isDrawingConnection()) {
        this.connectionService.drawPreview(tempCtx, this.canvasWidth, this.canvasHeight);
      }
    }
  }

  // --- Mouse handlers ---

  private getCanvasCoords(event: MouseEvent): { x: number; y: number } {
    const container = this.canvasContainerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    return this.drawingService.clientToCanvasCoords(
      event.clientX, event.clientY, rect, this.transform
    );
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button === 1 || (event.button === 0 && event.altKey)) {
      // Middle click or Alt+click = pan
      this.isPanning = true;
      this.panStart = { x: event.clientX - this.transform.pointX, y: event.clientY - this.transform.pointY };
      return;
    }

    if (event.button !== 0) return;

    const coords = this.getCanvasCoords(event);
    const tool = this.drawingService.activeTool();

    // Connection mode
    if (tool === 'draw-connection') {
      const anchor = this.renderService.hitTestAnchor(this.shapeManager.shapes(), coords.x, coords.y);
      if (anchor) {
        if (this.connectionService.isDrawingConnection()) {
          const conn = this.connectionService.finishConnection(anchor);
          if (conn) {
            this.shapeManager.addConnection(conn);
            this.stateService.markDirty();
          }
        } else {
          this.connectionService.startConnection(anchor);
        }
      }
      return;
    }

    // Drawing mode
    if (this.drawingService.isDrawingTool() && this.config.canDrawShapes) {
      this.drawingService.startDrawing(coords.x, coords.y);
      return;
    }

    // Select mode
    if (tool === 'select' && this.config.canSelectShapes) {
      // Check resize handles on selected shape
      const singleSelected = this.shapeManager.singleSelectedShape();
      if (singleSelected && this.config.canResizeShapes) {
        const handle = this.renderService.hitTestHandle(singleSelected, coords.x, coords.y, this.transform.scale);
        if (handle) {
          if (handle === 'rotate') {
            // TODO: rotation drag
          } else {
            this.isResizing = true;
            this.resizeHandle = handle;
            this.resizeStartShape = { ...singleSelected };
            this.resizeStartCanvas = coords;
          }
          return;
        }
      }

      // Check shape hit
      const hitShape = this.renderService.hitTestShape(this.shapeManager.shapes(), coords.x, coords.y);
      if (hitShape) {
        if (event.ctrlKey && this.config.canMultiSelect) {
          this.shapeManager.toggleShapeSelection(hitShape.id);
        } else if (!this.shapeManager.isSelected(hitShape.id)) {
          this.shapeManager.selectShape(hitShape.id);
        }

        if (this.config.canDragShapes) {
          this.isDragging = true;
          this.dragStartCanvas = coords;
          this.dragStartPositions.clear();
          for (const s of this.shapeManager.selectedShapes()) {
            this.dragStartPositions.set(s.id, { x: s.x, y: s.y });
          }
        }
      } else {
        this.shapeManager.clearSelection();
      }
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isPanning) {
      this.transform = {
        ...this.transform,
        pointX: event.clientX - this.panStart.x,
        pointY: event.clientY - this.panStart.y,
      };
      this.requestRender();
      return;
    }

    const coords = this.getCanvasCoords(event);

    // Drawing preview
    if (this.drawingService.isDrawing()) {
      this.drawingService.updateDrawing(coords.x, coords.y);
      this.requestRender();
      return;
    }

    // Connection preview
    if (this.connectionService.isDrawingConnection()) {
      this.connectionService.updateConnection(coords.x, coords.y);
      this.hoveredAnchor = this.renderService.hitTestAnchor(this.shapeManager.shapes(), coords.x, coords.y);
      this.requestRender();
      return;
    }

    // Resizing
    if (this.isResizing && this.resizeStartShape) {
      const dx = coords.x - this.resizeStartCanvas.x;
      const dy = coords.y - this.resizeStartCanvas.y;
      const s = this.resizeStartShape;
      let newX = s.x, newY = s.y, newW = s.width, newH = s.height;

      if (this.resizeHandle?.includes('e')) { newW = Math.max(10, s.width + dx); }
      if (this.resizeHandle?.includes('w')) { newX = s.x + dx; newW = Math.max(10, s.width - dx); }
      if (this.resizeHandle?.includes('s')) { newH = Math.max(10, s.height + dy); }
      if (this.resizeHandle?.includes('n')) { newY = s.y + dy; newH = Math.max(10, s.height - dy); }

      const snapped = this.gridService.snapPosition(newX, newY);
      this.shapeManager.updateShape(s.id, {
        x: snapped.x, y: snapped.y,
        width: this.gridService.snapDimension(newW),
        height: this.gridService.snapDimension(newH),
      });
      this.requestRender();
      return;
    }

    // Dragging
    if (this.isDragging) {
      const dx = coords.x - this.dragStartCanvas.x;
      const dy = coords.y - this.dragStartCanvas.y;

      for (const [id, startPos] of this.dragStartPositions) {
        const snapped = this.gridService.snapPosition(startPos.x + dx, startPos.y + dy);
        this.shapeManager.updateShape(id, { x: snapped.x, y: snapped.y });
      }
      this.requestRender();
      return;
    }

    // Hover detection
    if (this.drawingService.activeTool() === 'draw-connection') {
      const nextHoveredAnchor = this.renderService.hitTestAnchor(this.shapeManager.shapes(), coords.x, coords.y);
      const anchorChanged =
        nextHoveredAnchor?.shapeId !== this.hoveredAnchor?.shapeId ||
        nextHoveredAnchor?.position !== this.hoveredAnchor?.position;
      this.hoveredAnchor = nextHoveredAnchor;
      if (anchorChanged) {
        this.requestRender();
      }
    }
    const hit = this.renderService.hitTestShape(this.shapeManager.shapes(), coords.x, coords.y);
    const newHoveredId = hit?.id ?? null;
    if (newHoveredId !== this.hoveredShapeId) {
      this.hoveredShapeId = newHoveredId;
      this.requestRender();
    }

    // Update cursor
    this.updateCursor(coords);
  }

  onMouseUp(event: MouseEvent): void {
    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    // Finish drawing
    if (this.drawingService.isDrawing()) {
      const shape = this.drawingService.finishDrawing();
      if (shape) {
        const added = this.shapeManager.addShape(shape);
        this.shapeManager.selectShape(added.id);
        this.stateService.markDirty();
      }
      this.requestRender();
      return;
    }

    if (this.isDragging || this.isResizing) {
      this.stateService.markDirty();
    }

    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.resizeStartShape = null;
    this.dragStartPositions.clear();
  }

  onWheel(event: WheelEvent): void {
    if (!this.config.canZoom) return;
    event.preventDefault();

    const container = this.canvasContainerRef.nativeElement;
    const containerRect = container.getBoundingClientRect();
    // Use the canvas transform element's rect for zoom calculation
    const transformRect = this.canvasTransformRef.nativeElement.getBoundingClientRect();

    this.transform = this.zoomPanService.calculateZoom(
      event, this.transform, containerRect, transformRect
    );
    this.requestRender();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Delete' && this.config.canDeleteShapes) {
      this.deleteSelected();
    }
    if (event.key === 'Escape') {
      this.drawingService.cancelDrawing();
      this.connectionService.cancelConnection();
      this.drawingService.setTool('select');
      this.requestRender();
    }

    // Arrow key movement
    if (this.config.canDragShapes && this.shapeManager.hasSelection()) {
      const step = event.shiftKey ? 10 : 1;
      let dx = 0, dy = 0;
      switch (event.key) {
        case 'ArrowLeft': dx = -step; break;
        case 'ArrowRight': dx = step; break;
        case 'ArrowUp': dy = -step; break;
        case 'ArrowDown': dy = step; break;
      }
      if (dx || dy) {
        event.preventDefault();
        for (const shape of this.shapeManager.selectedShapes()) {
          this.shapeManager.updateShape(shape.id, { x: shape.x + dx, y: shape.y + dy });
        }
        this.stateService.markDirty();
        this.requestRender();
      }
    }
  }

  // --- Toolbar actions ---

  onSymbolSelected(symbol: PIDSymbol): void {
    this.drawingService.selectSymbol(symbol);
  }

  onAlign(alignment: AlignmentType): void {
    const updates = this.alignmentService.alignShapes(this.shapeManager.selectedShapes(), alignment);
    this.applyUpdates(updates);
  }

  onDistribute(direction: DistributeType): void {
    const updates = this.alignmentService.distributeShapes(this.shapeManager.selectedShapes(), direction);
    this.applyUpdates(updates);
  }

  deleteSelected(): void {
    this.shapeManager.deleteSelectedShapes();
    this.stateService.markDirty();
    this.requestRender();
  }

  zoomIn(): void {
    this.transform = { ...this.transform, scale: Math.min(10, this.transform.scale * 1.2) };
    this.requestRender();
  }

  zoomOut(): void {
    this.transform = { ...this.transform, scale: Math.max(0.1, this.transform.scale * 0.8) };
    this.requestRender();
  }

  zoomFit(): void {
    const container = this.canvasContainerRef.nativeElement;
    const scaleX = container.clientWidth / this.canvasWidth;
    const scaleY = container.clientHeight / this.canvasHeight;
    const scale = Math.min(scaleX, scaleY) * 0.95;
    this.transform = {
      scale,
      pointX: (container.clientWidth - this.canvasWidth * scale) / 2,
      pointY: (container.clientHeight - this.canvasHeight * scale) / 2,
    };
    this.requestRender();
  }

  private applyUpdates(updates: ShapeUpdate[]): void {
    for (const u of updates) {
      this.shapeManager.updateShape(u.id, u);
    }
    if (updates.length > 0) {
      this.stateService.markDirty();
      this.requestRender();
    }
  }

  private updateCursor(coords: { x: number; y: number }): void {
    const container = this.canvasContainerRef.nativeElement;
    const tool = this.drawingService.activeTool();

    if (tool !== 'select') {
      container.style.cursor = 'crosshair';
      return;
    }

    const singleSelected = this.shapeManager.singleSelectedShape();
    if (singleSelected) {
      const handle = this.renderService.hitTestHandle(singleSelected, coords.x, coords.y, this.transform.scale);
      if (handle) {
        container.style.cursor = handle === 'rotate' ? 'grab' : handle;
        return;
      }
    }

    const hit = this.renderService.hitTestShape(this.shapeManager.shapes(), coords.x, coords.y);
    container.style.cursor = hit ? 'move' : 'default';
  }
}
