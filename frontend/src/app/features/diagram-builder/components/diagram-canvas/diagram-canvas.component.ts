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
import { AlignmentType, AnchorPoint, DiagramElement, DiagramLineShape, DistributeType } from '../../models/diagram-shape.model';
import { SimulationGraphService } from '../../simulation/services/simulation-graph.service';
import { SimulationEngineService } from '../../simulation/services/simulation-engine.service';
import { SimulationStateService } from '../../simulation/services/simulation-state.service';
import { SimulationRenderService } from '../../simulation/services/simulation-render.service';
import { SimulationToolbarComponent } from '../../simulation/components/simulation-toolbar.component';
import { SimulationInspectorComponent } from '../../simulation/components/simulation-inspector.component';

@Component({
  selector: 'app-diagram-canvas',
  standalone: true,
  imports: [CommonModule, DiagramToolbarComponent, DiagramPropertiesComponent, SymbolPaletteComponent, SimulationToolbarComponent, SimulationInspectorComponent],
  providers: [
    DiagramShapeManagerService,
    DiagramRenderService,
    DiagramDrawingService,
    DiagramGridService,
    DiagramConnectionService,
    DiagramAlignmentService,
    DiagramStateService,
    ZoomPanService,
    SimulationGraphService,
    SimulationEngineService,
    SimulationStateService,
    SimulationRenderService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="diagram-page">
      @if (config.showToolbar) {
        <div class="toolbar-row">
          <app-diagram-toolbar
            (onAlign)="onAlign($event)"
            (onDistribute)="onDistribute($event)"
            (onDelete)="deleteSelected()"
            (onGroup)="groupSelected()"
            (onUngroup)="ungroupSelected()"
            (onZoomIn)="zoomIn()"
            (onZoomOut)="zoomOut()"
            (onZoomFit)="zoomFit()"
          />
          <app-simulation-toolbar
            (onToggle)="toggleSimulation()"
            (onReset)="resetSimulation()"
          />
        </div>
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
          (dblclick)="onDoubleClick($event)"
          (contextmenu)="$event.preventDefault()">

          <canvas #gridCanvas class="layer-canvas grid-canvas"></canvas>
          <canvas #shapeCanvas class="layer-canvas shape-canvas"></canvas>
          <canvas #tempCanvas class="layer-canvas temp-canvas"></canvas>
        </div>

        @if (simState.isSimulating()) {
          <app-simulation-inspector />
        } @else if (config.showProperties) {
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
    .toolbar-row {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #1e1e1e;
      border-bottom: 1px solid #333;
    }
    .dirty-indicator { color: #ff9800; }
    .saving-indicator { color: #4caf50; }
  `],
})
export class DiagramCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainerRef!: ElementRef<HTMLDivElement>;
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
  simState = inject(SimulationStateService);
  private simRender = inject(SimulationRenderService);

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
  private isRotating = false;
  private isMarqueeSelecting = false;
  private resizeHandle: string | null = null;
  private rotateStartAngle = 0;
  private rotateStartRotation = 0;
  private dragStartShapes = new Map<number, DiagramElement>();
  private dragStartCanvas = { x: 0, y: 0 };
  private panStart = { x: 0, y: 0 };
  private resizeStartShape: DiagramElement | null = null;
  private resizeStartCanvas = { x: 0, y: 0 };
  private marqueeStart = { x: 0, y: 0 };
  private marqueeEnd = { x: 0, y: 0 };
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
    this.simRender.stopAnimation();
    if (this.simState.isSimulating()) this.simState.deactivate();
  }

  private setupCanvases(): void {
    const container = this.canvasContainerRef?.nativeElement;
    if (!container) return;

    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const canvases = [
      this.gridCanvasRef?.nativeElement,
      this.shapeCanvasRef?.nativeElement,
      this.tempCanvasRef?.nativeElement,
    ].filter(Boolean);

    for (const canvas of canvases) {
      if (canvas) {
        canvas.width = clientWidth * dpr;
        canvas.height = clientHeight * dpr;
        canvas.style.width = `${clientWidth}px`;
        canvas.style.height = `${clientHeight}px`;
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
    const dpr = window.devicePixelRatio || 1;
    const { scale, pointX, pointY } = this.transform;

    // Helper: apply diagram-space transform to a canvas context
    const applyTransform = (ctx: CanvasRenderingContext2D) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);          // reset to identity
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * pointX, dpr * pointY);
    };

    // Grid
    const gridCtx = this.gridCanvasRef?.nativeElement?.getContext('2d');
    if (gridCtx) {
      applyTransform(gridCtx);
      this.gridService.drawGrid(gridCtx, this.canvasWidth, this.canvasHeight, scale);
      gridCtx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Shapes + connections
    const shapeCtx = this.shapeCanvasRef?.nativeElement?.getContext('2d');
    if (shapeCtx) {
      applyTransform(shapeCtx);
      this.renderService.drawAll(
        shapeCtx,
        this.shapeManager.shapes(),
        this.shapeManager.connections(),
        this.shapeManager.selectedShapeIds(),
        this.hoveredShapeId,
        scale
      );

      // Draw anchor points in connection mode
      if (this.drawingService.activeTool() === 'draw-connection') {
        for (const shape of this.shapeManager.shapes()) {
          this.renderService.drawAnchorPoints(shapeCtx, shape, this.hoveredAnchor);
        }
      }

      // Simulation overlays
      if (this.simState.isSimulating()) {
        this.simRender.drawOverlays(
          shapeCtx,
          this.shapeManager.shapes(),
          this.shapeManager.connections(),
          this.simState.getAllNodeStates(),
          this.simState.getAllEdgeStates(),
          scale
        );
      }
      shapeCtx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Temp canvas (drawing preview + marquee)
    const tempCtx = this.tempCanvasRef?.nativeElement?.getContext('2d');
    if (tempCtx) {
      applyTransform(tempCtx);
      if (this.drawingService.isDrawing()) {
        this.drawingService.drawPreview(tempCtx, this.canvasWidth, this.canvasHeight);
      }
      if (this.connectionService.isDrawingConnection()) {
        this.connectionService.drawPreview(tempCtx, this.canvasWidth, this.canvasHeight);
      }
      if (this.isMarqueeSelecting) {
        const x = Math.min(this.marqueeStart.x, this.marqueeEnd.x);
        const y = Math.min(this.marqueeStart.y, this.marqueeEnd.y);
        const w = Math.abs(this.marqueeEnd.x - this.marqueeStart.x);
        const h = Math.abs(this.marqueeEnd.y - this.marqueeStart.y);
        tempCtx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
        tempCtx.fillStyle = 'rgba(33, 150, 243, 0.08)';
        tempCtx.lineWidth = 1 / scale;
        tempCtx.setLineDash([4 / scale, 4 / scale]);
        tempCtx.fillRect(x, y, w, h);
        tempCtx.strokeRect(x, y, w, h);
        tempCtx.setLineDash([]);
      }
      tempCtx.setTransform(1, 0, 0, 1, 0, 0);
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
    // Middle click, right click, or Alt+click = pan
    if (event.button === 1 || event.button === 2 || (event.button === 0 && event.altKey)) {
      event.preventDefault();
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
      } else {
        // Clicked empty area — cancel any in-progress connection
        this.connectionService.cancelConnection();
        this.requestRender();
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
      // Check resize/rotate handles on selected shape
      const singleSelected = this.shapeManager.singleSelectedShape();
      if (singleSelected && this.config.canResizeShapes) {
        const handle = this.renderService.hitTestHandle(singleSelected, coords.x, coords.y, this.transform.scale);
        if (handle) {
          if (handle === 'rotate') {
            this.isRotating = true;
            this.resizeStartShape = { ...singleSelected };
            const cx = singleSelected.x + singleSelected.width / 2;
            const cy = singleSelected.y + singleSelected.height / 2;
            this.rotateStartAngle = Math.atan2(coords.y - cy, coords.x - cx);
            this.rotateStartRotation = singleSelected.rotation || 0;
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
        // Always allow drag after selection (supports Ctrl multi-select then drag)
        if (this.config.canDragShapes) {
          this.isDragging = true;
          this.dragStartCanvas = coords;
          this.dragStartShapes.clear();
          for (const s of this.shapeManager.selectedShapes()) {
            this.dragStartShapes.set(s.id, { ...s } as DiagramElement);
          }
        }
      } else {
        // Empty area — start marquee selection (or pan if Space is held)
        {
          if (!event.ctrlKey) {
            this.shapeManager.clearSelection();
          }
          this.isMarqueeSelecting = true;
          this.marqueeStart = coords;
          this.marqueeEnd = coords;
        }
      }
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isPanning) {
      this.canvasContainerRef.nativeElement.style.cursor = 'grabbing';
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

    // Rotating
    if (this.isRotating && this.resizeStartShape) {
      const s = this.resizeStartShape;
      const cx = s.x + s.width / 2;
      const cy = s.y + s.height / 2;
      const currentAngle = Math.atan2(coords.y - cy, coords.x - cx);
      const deltaAngle = (currentAngle - this.rotateStartAngle) * (180 / Math.PI);
      let newRotation = this.rotateStartRotation + deltaAngle;
      // Snap to 15-degree increments when shift is held
      if (event.shiftKey) {
        newRotation = Math.round(newRotation / 15) * 15;
      }
      this.shapeManager.updateShape(s.id, { rotation: newRotation });
      this.requestRender();
      return;
    }

    // Resizing
    if (this.isResizing && this.resizeStartShape) {
      const dx = coords.x - this.resizeStartCanvas.x;
      const dy = coords.y - this.resizeStartCanvas.y;
      const s = this.resizeStartShape;

      // For lines, directly move the endpoint the handle is closest to
      if (s.type === 'line') {
        const line = s as DiagramLineShape;
        const updates: any = {};

        // Determine which endpoint to move based on which handle was grabbed
        const handle = this.resizeHandle || '';
        // nw/n/ne handles → move start point; sw/s/se handles → move end point
        // w handle → move start; e handle → move end
        const movingStart = handle.includes('nw') || handle === 'n-resize' || handle === 'w-resize' || handle === 'ne-resize';

        if (movingStart) {
          updates.startX = line.startX + dx;
          updates.startY = line.startY + dy;
        } else {
          updates.endX = line.endX + dx;
          updates.endY = line.endY + dy;
        }

        // Recompute bounding box from endpoints
        const sx = updates.startX ?? line.startX;
        const sy = updates.startY ?? line.startY;
        const ex = updates.endX ?? line.endX;
        const ey = updates.endY ?? line.endY;
        updates.x = Math.min(sx, ex);
        updates.y = Math.min(sy, ey);
        updates.width = Math.max(1, Math.abs(ex - sx));
        updates.height = Math.max(1, Math.abs(ey - sy));

        this.shapeManager.updateShape(s.id, updates);
      } else {
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
      }
      this.requestRender();
      return;
    }

    // Dragging
    if (this.isDragging) {
      const dx = coords.x - this.dragStartCanvas.x;
      const dy = coords.y - this.dragStartCanvas.y;

      for (const [id, startShape] of this.dragStartShapes) {
        const snapped = this.gridService.snapPosition(startShape.x + dx, startShape.y + dy);
        const updates: Partial<DiagramElement> = { x: snapped.x, y: snapped.y };

        // Lines need their endpoint coordinates moved too
        if (startShape.type === 'line') {
          const line = startShape as DiagramLineShape;
          const snapDx = snapped.x - startShape.x;
          const snapDy = snapped.y - startShape.y;
          (updates as any).startX = line.startX + snapDx;
          (updates as any).startY = line.startY + snapDy;
          (updates as any).endX = line.endX + snapDx;
          (updates as any).endY = line.endY + snapDy;
        }

        this.shapeManager.updateShape(id, updates);
      }
      this.requestRender();
      return;
    }

    // Marquee selection
    if (this.isMarqueeSelecting) {
      this.marqueeEnd = coords;
      this.shapeManager.selectShapesInRect(
        this.marqueeStart.x, this.marqueeStart.y,
        this.marqueeEnd.x, this.marqueeEnd.y
      );
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

    // Finish marquee selection
    if (this.isMarqueeSelecting) {
      this.isMarqueeSelecting = false;
      this.requestRender();
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

    if (this.isDragging || this.isResizing || this.isRotating) {
      this.stateService.markDirty();
    }

    this.isDragging = false;
    this.isResizing = false;
    this.isRotating = false;
    this.resizeHandle = null;
    this.resizeStartShape = null;
    this.dragStartShapes.clear();
  }

  onWheel(event: WheelEvent): void {
    if (!this.config.canZoom) return;
    event.preventDefault();

    const container = this.canvasContainerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(10, Math.max(0.1, this.transform.scale * zoomFactor));

    // Zoom towards mouse position
    const scaleChange = newScale / this.transform.scale;
    this.transform = {
      scale: newScale,
      pointX: mouseX - scaleChange * (mouseX - this.transform.pointX),
      pointY: mouseY - scaleChange * (mouseY - this.transform.pointY),
    };
    this.requestRender();
  }

  onDoubleClick(event: MouseEvent): void {
    if (!this.simState.isSimulating()) return;

    const coords = this.getCanvasCoords(event);
    const hit = this.renderService.hitTestShape(this.shapeManager.shapes(), coords.x, coords.y);
    if (!hit) return;

    const state = this.simState.getNodeState(hit.id);
    if (!state) return;

    // Toggle valve
    if (state.role === 'valve') {
      const newPos = state.params.valvePosition === 'open' ? 'closed' : 'open';
      this.simState.updateNodeParams(hit.id, { valvePosition: newPos });
      this.requestRender();
    }

    // Toggle pump
    if (state.role === 'pump') {
      this.simState.updateNodeParams(hit.id, { pumpRunning: !state.params.pumpRunning });
      this.requestRender();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Delete selected
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.config.canDeleteShapes) {
      this.deleteSelected();
    }

    // Escape — cancel operations
    if (event.key === 'Escape') {
      this.drawingService.cancelDrawing();
      this.connectionService.cancelConnection();
      this.isMarqueeSelecting = false;
      this.drawingService.setTool('select');
      this.shapeManager.clearSelection();
      this.requestRender();
    }

    // Ctrl+A — select all
    if (event.ctrlKey && event.key === 'a') {
      event.preventDefault();
      this.shapeManager.selectMultiple(this.shapeManager.shapes().map(s => s.id));
      this.requestRender();
    }

    // Ctrl+G — group selected
    if (event.ctrlKey && !event.shiftKey && event.key === 'g') {
      event.preventDefault();
      this.groupSelected();
    }

    // Ctrl+Shift+G — ungroup selected
    if (event.ctrlKey && event.shiftKey && event.key === 'G') {
      event.preventDefault();
      this.ungroupSelected();
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
          const updates: Partial<DiagramElement> = { x: shape.x + dx, y: shape.y + dy };
          if (shape.type === 'line') {
            const line = shape as DiagramLineShape;
            (updates as any).startX = line.startX + dx;
            (updates as any).startY = line.startY + dy;
            (updates as any).endX = line.endX + dx;
            (updates as any).endY = line.endY + dy;
          }
          this.shapeManager.updateShape(shape.id, updates);
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

  groupSelected(): void {
    const groupId = this.shapeManager.groupSelected();
    if (groupId) {
      this.stateService.markDirty();
      this.requestRender();
    }
  }

  ungroupSelected(): void {
    this.shapeManager.ungroupSelected();
    this.stateService.markDirty();
    this.requestRender();
  }

  // --- Simulation ---

  toggleSimulation(): void {
    if (this.simState.isSimulating()) {
      this.simRender.stopAnimation();
      this.simState.deactivate();
      this.requestRender();
    } else {
      this.simState.activate(this.shapeManager.shapes(), this.shapeManager.connections());
      this.simRender.startAnimation(() => this.requestRender());
    }
  }

  resetSimulation(): void {
    if (this.simState.isSimulating()) {
      this.simRender.stopAnimation();
      this.simState.deactivate();
      this.simState.activate(this.shapeManager.shapes(), this.shapeManager.connections());
      this.simRender.startAnimation(() => this.requestRender());
    }
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
    container.style.cursor = hit ? 'move' : 'grab';
  }
}
