import {
  Component, ElementRef, ViewChild, AfterViewInit, OnInit, OnDestroy,
  inject, input, output, effect, HostListener, ChangeDetectionStrategy,
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
import { AlignmentType, AnchorPoint, DiagramPlacement, DistributeType } from '../../models/diagram-placement.model';
import { SimulationGraphService } from '../../simulation/services/simulation-graph.service';
import { SimulationEngineService } from '../../simulation/services/simulation-engine.service';
import { SimulationStateService } from '../../simulation/services/simulation-state.service';
import { SimulationRenderService } from '../../simulation/services/simulation-render.service';
import { SimNodeState } from '../../simulation/models/simulation.model';
import { SimulationToolbarComponent } from '../../simulation/components/simulation-toolbar.component';
import { SimulationInspectorComponent } from '../../simulation/components/simulation-inspector.component';
import { EquipmentLibraryComponent } from '../equipment-library/equipment-library.component';
import { SimEquipmentDto, normalizeSimRole } from '../../models/sim-equipment.model';
import { SimEquipmentApiService } from '../../services/sim-equipment-api.service';
import { SimGraphBuilderService } from '../../simulation/services/sim-graph-builder.service';

@Component({
  selector: 'app-diagram-canvas',
  standalone: true,
  imports: [CommonModule, DiagramToolbarComponent, DiagramPropertiesComponent, SimulationToolbarComponent, SimulationInspectorComponent, EquipmentLibraryComponent],
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
    SimGraphBuilderService,
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
            (onSave)="saveDiagram()"
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
        @if (!simState.isSimulating()) {
          <app-equipment-library
            (onEquipmentClick)="onEquipmentDragStart($event)"
            (onEquipmentAddToCanvas)="addEquipmentToCanvas($event)"
          />
        }

        <div class="canvas-container" #canvasContainer
          (drop)="onDrop($event)"
          (dragover)="$event.preventDefault()"
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
  embeddedDiagramId = input<number | null>(null);
  embeddedMode = input<'builder' | 'renderer' | null>(null);
  initialDiagramName = input<string | null>(null);
  initialContextFileId = input<number | null>(null);
  initialContextFileName = input<string | null>(null);
  backgroundImageUrl = input<string | null>(null);
  focusSourceEntityType = input<string | null>(null);
  focusSourceEntityId = input<number | null>(null);
  focusConnectionId = input<number | null>(null);
  selectedSourceChange = output<{ sourceEntityType: string | null; sourceEntityId: number | null }>();
  selectedConnectionChange = output<number | null>();
  simulationRunningChange = output<boolean>();
  selectedNodeStateChange = output<SimNodeState | null>();

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
  simEquipmentApi = inject(SimEquipmentApiService);
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
  private dragStartShapes = new Map<number, DiagramPlacement>();
  private dragStartCanvas = { x: 0, y: 0 };
  private panStart = { x: 0, y: 0 };
  private resizeStartShape: DiagramPlacement | null = null;
  private resizeStartCanvas = { x: 0, y: 0 };
  private marqueeStart = { x: 0, y: 0 };
  private marqueeEnd = { x: 0, y: 0 };
  private isDraggingWaypoint = false;
  private draggedWaypointConnectionId: number | null = null;
  private draggedWaypointIndex = -1;
  private animFrameId = 0;
  private backgroundImage: HTMLImageElement | null = null;
  private backgroundImageUrlLoaded: string | null = null;
  private backgroundImageUrlPending: string | null = null;
  private lastEmbeddedDiagramId: number | null = null;
  private lastFocusedSourceKey: string | null = null;
  private lastFocusedConnectionKey: string | null = null;
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
      this.backgroundImageUrl();
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

    effect(() => {
      const embeddedId = this.embeddedDiagramId();
      if (embeddedId == null || embeddedId === this.lastEmbeddedDiagramId) {
        return;
      }
      this.lastEmbeddedDiagramId = embeddedId;
      this.stateService.loadDiagram(embeddedId);
    });

    effect(() => {
      const sourceType = this.focusSourceEntityType();
      const sourceId = this.focusSourceEntityId();
      const shapes = this.shapeManager.shapes();
      const diagramId = this.stateService.currentDiagram()?.id ?? this.embeddedDiagramId() ?? null;

      if (!sourceType || sourceId == null || shapes.length === 0) {
        return;
      }

      const focusKey = `${diagramId}:${sourceType}:${sourceId}:${shapes.length}`;
      if (focusKey === this.lastFocusedSourceKey) {
        return;
      }

      const match = shapes.find(shape =>
        shape.sourceEntityType === sourceType && shape.sourceEntityId === sourceId
      );
      if (!match) {
        return;
      }

      this.lastFocusedSourceKey = focusKey;
      this.drawingService.setTool('select');
      this.shapeManager.selectShape(match.id);
      this.centerOnPlacement(match);
      this.requestRender();
    });

    effect(() => {
      const connectionId = this.focusConnectionId();
      const connections = this.shapeManager.connections();
      const shapes = this.shapeManager.shapes();
      const diagramId = this.stateService.currentDiagram()?.id ?? this.embeddedDiagramId() ?? null;

      if (connectionId == null || connections.length === 0 || shapes.length === 0) {
        return;
      }

      const focusKey = `${diagramId}:connection:${connectionId}:${connections.length}`;
      if (focusKey === this.lastFocusedConnectionKey) {
        return;
      }

      const match = connections.find(connection => connection.id === connectionId);
      if (!match) {
        return;
      }

      this.lastFocusedConnectionKey = focusKey;
      this.drawingService.setTool('select');
      this.shapeManager.selectConnection(match.id);
      this.centerOnConnection(match);
      this.requestRender();
    });

    effect(() => {
      const selectedShape = this.shapeManager.singleSelectedShape();
      const selectedConnection = this.shapeManager.selectedConnectionId();

      if (!selectedShape || selectedConnection != null) {
        this.selectedSourceChange.emit({ sourceEntityType: null, sourceEntityId: null });
        return;
      }

      this.selectedSourceChange.emit({
        sourceEntityType: selectedShape.sourceEntityType || null,
        sourceEntityId: selectedShape.sourceEntityId ?? null,
      });
    });

    effect(() => {
      this.selectedConnectionChange.emit(this.shapeManager.selectedConnectionId());
    });

    effect(() => {
      this.simulationRunningChange.emit(this.simState.isSimulating());
    });

    effect(() => {
      const selectedShape = this.shapeManager.singleSelectedShape();
      const selectedConnection = this.shapeManager.selectedConnectionId();
      if (!selectedShape || selectedConnection != null || !this.simState.isSimulating()) {
        this.selectedNodeStateChange.emit(null);
        return;
      }

      this.selectedNodeStateChange.emit(this.simState.getNodeState(selectedShape.id) ?? null);
    });
  }

  ngOnInit(): void {
    this.simEquipmentApi.loadAllIntoCache();
    const mode = this.embeddedMode() ?? this.route.snapshot.data['mode'];
    this.config = mode === 'renderer' ? DIAGRAM_RENDERER_CONFIG : DIAGRAM_BUILDER_CONFIG;

    const embeddedId = this.embeddedDiagramId();
    const routeId = this.route.snapshot.paramMap.get('id');
    if (embeddedId != null) {
      this.lastEmbeddedDiagramId = embeddedId;
      this.stateService.loadDiagram(embeddedId);
    } else if (routeId) {
      this.stateService.loadDiagram(Number(routeId));
    } else {
      this.stateService.createNewDiagram(
        this.initialDiagramName() ?? 'Untitled Diagram',
        {
          contextFileId: this.initialContextFileId() ?? undefined,
          contextFileName: this.initialContextFileName() ?? undefined,
        }
      );
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
    if (this.stateService.isDirty()) {
      this.stateService.saveNow();
    }
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
      this.ensureBackgroundImageLoaded();
      this.drawBackgroundImage(gridCtx);
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
        this.shapeManager.selectedConnectionId(),
        this.hoveredShapeId,
        scale
      );

      // Draw anchor points in connection mode
      if (this.drawingService.activeTool() === 'draw-connection') {
        for (const shape of this.shapeManager.shapes()) {
          this.renderService.drawAnchorPoints(shapeCtx, shape, this.hoveredAnchor);
        }
      }

      // Simulation static overlays (colors, badges, levels, handles — redrawn on tick)
      if (this.simState.isSimulating()) {
        this.simRender.drawStaticOverlays(
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

  /**
   * Render only the animation layer (temp canvas) at 60fps.
   * Draws: flow dash animation, pump impeller rotation, warning pulses.
   * Does NOT touch grid or shape canvases — those only redraw on sim tick.
   * Every 30 frames (~500ms), also triggers a full render for static overlays.
   */
  private animFrameCount = 0;
  private renderAnimationLayer(): void {
    // Every ~500ms, refresh static overlays (badges, colors, levels)
    this.animFrameCount++;
    if (this.animFrameCount % 30 === 0) {
      this.requestRender();
    }

    const dpr = window.devicePixelRatio || 1;
    const { scale, pointX, pointY } = this.transform;
    const tempCtx = this.tempCanvasRef?.nativeElement?.getContext('2d');
    if (!tempCtx) return;

    tempCtx.setTransform(1, 0, 0, 1, 0, 0);
    tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
    tempCtx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * pointX, dpr * pointY);

    this.simRender.drawAnimatedOverlays(tempCtx);

    tempCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private ensureBackgroundImageLoaded(): void {
    const url = this.backgroundImageUrl();
    if (!url) {
      this.backgroundImage = null;
      this.backgroundImageUrlLoaded = null;
      this.backgroundImageUrlPending = null;
      return;
    }
    if (this.backgroundImageUrlLoaded === url && this.backgroundImage) {
      return;
    }
    if (this.backgroundImageUrlPending === url) {
      return;
    }

    const img = new Image();
    this.backgroundImageUrlPending = url;
    img.onload = () => {
      this.backgroundImage = img;
      this.backgroundImageUrlLoaded = url;
      this.backgroundImageUrlPending = null;
      this.requestRender();
    };
    img.onerror = () => {
      this.backgroundImage = null;
      this.backgroundImageUrlLoaded = null;
      this.backgroundImageUrlPending = null;
      this.requestRender();
    };
    img.src = url;
  }

  private drawBackgroundImage(ctx: CanvasRenderingContext2D): void {
    if (!this.backgroundImage) return;

    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.drawImage(this.backgroundImage, 0, 0, this.canvasWidth, this.canvasHeight);
    ctx.restore();
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
            this.shapeManager.addConnection({
              ...conn,
              pipeTemplateId: conn.pipeTemplateId ?? this.getDefaultPipeTemplateId(),
            });
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
            this.dragStartShapes.set(s.id, { ...s } as DiagramPlacement);
          }
        }
      } else {
        // Check waypoint hit on already-selected connection first
        const selectedConn = this.shapeManager.singleSelectedConnection?.();
        if (selectedConn) {
          const wpHit = this.renderService.hitTestWaypoint(
            selectedConn, this.shapeManager.shapes(), coords.x, coords.y
          );
          if (wpHit) {
            if (wpHit.type === 'waypoint') {
              // Start dragging existing waypoint
              this.isDraggingWaypoint = true;
              this.draggedWaypointConnectionId = selectedConn.id;
              this.draggedWaypointIndex = wpHit.index;
              this.dragStartCanvas = { x: coords.x, y: coords.y };
            } else {
              // Insert new waypoint at midpoint position
              const wps = [...(selectedConn.waypoints || [])];
              // segmentIndex is relative to the full path (anchor + waypoints + anchor),
              // so the insertion index into the waypoints array is segmentIndex (since index 0 in path = source anchor)
              const insertIdx = wpHit.segmentIndex;
              wps.splice(insertIdx, 0, { x: wpHit.x, y: wpHit.y });
              this.shapeManager.updateConnection(selectedConn.id, { waypoints: wps });
              // Immediately start dragging the new waypoint
              this.isDraggingWaypoint = true;
              this.draggedWaypointConnectionId = selectedConn.id;
              this.draggedWaypointIndex = insertIdx;
              this.dragStartCanvas = { x: coords.x, y: coords.y };
            }
            return;
          }
        }

        const hitConnection = this.renderService.hitTestConnection(
          this.shapeManager.connections(),
          this.shapeManager.shapes(),
          coords.x,
          coords.y
        );
        if (hitConnection) {
          this.shapeManager.selectConnection(hitConnection.id);
          return;
        }
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

    // Waypoint dragging
    if (this.isDraggingWaypoint && this.draggedWaypointConnectionId != null) {
      const conn = this.shapeManager.connections().find(c => c.id === this.draggedWaypointConnectionId);
      if (conn?.waypoints) {
        const wps = [...conn.waypoints];
        const snapped = this.gridService.snapPosition(coords.x, coords.y);
        wps[this.draggedWaypointIndex] = { x: snapped.x, y: snapped.y };
        this.shapeManager.updateConnection(conn.id, { waypoints: wps });
        this.requestRender();
      }
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
      if (s.type === 'line' && s.startX !== undefined) {
        const updates: any = {};

        // Determine which endpoint to move based on which handle was grabbed
        const handle = this.resizeHandle || '';
        // nw/n/ne handles → move start point; sw/s/se handles → move end point
        // w handle → move start; e handle → move end
        const movingStart = handle.includes('nw') || handle === 'n-resize' || handle === 'w-resize' || handle === 'ne-resize';

        if (movingStart) {
          updates.startX = s.startX + dx;
          updates.startY = s.startY! + dy;
        } else {
          updates.endX = s.endX! + dx;
          updates.endY = s.endY! + dy;
        }

        // Recompute bounding box from endpoints
        const sx = updates.startX ?? s.startX;
        const sy = updates.startY ?? s.startY!;
        const ex = updates.endX ?? s.endX!;
        const ey = updates.endY ?? s.endY!;
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
        const updates: Partial<DiagramPlacement> = { x: snapped.x, y: snapped.y };

        // Lines need their endpoint coordinates moved too
        if (startShape.type === 'line' && startShape.startX !== undefined) {
          const snapDx = snapped.x - startShape.x;
          const snapDy = snapped.y - startShape.y;
          (updates as any).startX = startShape.startX + snapDx;
          (updates as any).startY = startShape.startY! + snapDy;
          (updates as any).endX = startShape.endX! + snapDx;
          (updates as any).endY = startShape.endY! + snapDy;
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
        nextHoveredAnchor?.placementId !== this.hoveredAnchor?.placementId ||
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

    if (this.isDragging || this.isResizing || this.isRotating || this.isDraggingWaypoint) {
      this.stateService.markDirty();
    }

    this.isDragging = false;
    this.isResizing = false;
    this.isRotating = false;
    this.isDraggingWaypoint = false;
    this.draggedWaypointConnectionId = null;
    this.draggedWaypointIndex = -1;
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
    const coords = this.getCanvasCoords(event);

    // Waypoint removal: double-click on a waypoint to delete it (editor mode only)
    if (!this.simState.isSimulating()) {
      const selectedConn = this.shapeManager.singleSelectedConnection?.();
      if (selectedConn?.waypoints?.length) {
        const wpHit = this.renderService.hitTestWaypoint(
          selectedConn, this.shapeManager.shapes(), coords.x, coords.y
        );
        if (wpHit?.type === 'waypoint') {
          const wps = [...selectedConn.waypoints];
          wps.splice(wpHit.index, 1);
          this.shapeManager.updateConnection(selectedConn.id, { waypoints: wps.length ? wps : undefined });
          this.stateService.markDirty();
          this.requestRender();
        }
      }
      return;
    }

    // Simulation mode: toggle valve/pump on double-click
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

    // Toggle selector valve (A ↔ B)
    if (state.role === 'selector-valve') {
      const newPort = state.params.selectedPort === 'A' ? 'B' : 'A';
      this.simState.updateNodeParams(hit.id, { selectedPort: newPort });
      this.requestRender();
    }

    // Toggle heater
    if (state.role === 'heater') {
      this.simState.updateNodeParams(hit.id, { heaterRunning: !state.params.heaterRunning });
      this.requestRender();
    }

    // Toggle vapor extractor
    if (state.role === 'vapor-extractor') {
      this.simState.updateNodeParams(hit.id, { extractorRunning: !state.params.extractorRunning });
      this.requestRender();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.saveDiagram();
      return;
    }

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
      if (this.shapeManager.selectedConnectionId() != null) {
        return;
      }
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
          const updates: Partial<DiagramPlacement> = { x: shape.x + dx, y: shape.y + dy };
          if (shape.type === 'line' && shape.startX !== undefined) {
            (updates as any).startX = shape.startX + dx;
            (updates as any).startY = shape.startY! + dy;
            (updates as any).endX = shape.endX! + dx;
            (updates as any).endY = shape.endY! + dy;
          }
          this.shapeManager.updateShape(shape.id, updates);
        }
        this.stateService.markDirty();
        this.requestRender();
      }
    }
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    if (this.stateService.isDirty()) {
      this.stateService.saveNow();
    }
  }

  // --- Equipment Library drag/drop ---

  private draggedEquipment: SimEquipmentDto | null = null;

  onEquipmentDragStart(eq: SimEquipmentDto): void {
    this.draggedEquipment = eq;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const json = event.dataTransfer?.getData('application/sim-equipment');
    const eq: SimEquipmentDto | null = json ? JSON.parse(json) : this.draggedEquipment;
    if (!eq || !eq.id) return;

    const coords = this.getCanvasCoords(event as any);
    this.placeEquipment(eq, coords.x, coords.y);
    this.draggedEquipment = null;
  }

  /** Add equipment at the visible center of the canvas. Called from equipment library context menu. */
  addEquipmentToCanvas(eq: SimEquipmentDto): void {
    if (!eq.id) return;
    const container = this.canvasContainerRef?.nativeElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerClient = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
    const coords = this.drawingService.clientToCanvasCoords(
      centerClient.clientX, centerClient.clientY, rect, this.transform
    );
    this.placeEquipment(eq, coords.x, coords.y);
  }

  private placeEquipment(eq: SimEquipmentDto, cx: number, cy: number): void {
    const w = eq.defaultWidth || 60;
    const h = eq.defaultHeight || 60;

    const placement: Omit<DiagramPlacement, 'id'> = {
      simEquipmentId: eq.id,
      name: eq.name || 'New Equipment',
      description: eq.description || undefined,
      simRole: eq.simRole || 'junction',
      simParamsJson: eq.simParamsJson || '{"schemaVersion":1}',
      sourceEntityType: eq.sourceEntityType || undefined,
      sourceEntityId: eq.sourceEntityId || undefined,
      x: cx - w / 2,
      y: cy - h / 2,
      width: w,
      height: h,
      type: eq.symbolId ? 'symbol' : 'rectangle',
      symbolId: eq.symbolId || undefined,
      svgPath: eq.svgPath || undefined,
      originalWidth: eq.defaultWidth || undefined,
      originalHeight: eq.defaultHeight || undefined,
      color: eq.defaultColor || '#ffffff',
      label: eq.name || undefined,
    };

    const added = this.shapeManager.addShape(placement);
    this.shapeManager.selectShape(added.id);
    this.stateService.markDirty();
    this.requestRender();
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

  saveDiagram(): void {
    this.stateService.saveNow();
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
      this.simState.activate(
        this.shapeManager.shapes(),
        this.shapeManager.connections()
      );
      this.requestRender(); // initial full render with static overlays
      this.simRender.startAnimation(() => this.renderAnimationLayer());
    }
  }

  operateSelectedEquipment(): boolean {
    if (!this.simState.isSimulating()) return false;

    const selected = this.shapeManager.singleSelectedShape();
    if (!selected) return false;

    const state = this.simState.getNodeState(selected.id);
    if (!state) return false;

    if (state.role === 'valve') {
      const newPos = state.params.valvePosition === 'open' ? 'closed' : 'open';
      this.simState.updateNodeParams(selected.id, { valvePosition: newPos });
      this.requestRender();
      return true;
    }

    if (state.role === 'pump') {
      this.simState.updateNodeParams(selected.id, { pumpRunning: !state.params.pumpRunning });
      this.requestRender();
      return true;
    }

    return false;
  }

  resetSimulation(): void {
    if (this.simState.isSimulating()) {
      this.simRender.stopAnimation();
      this.simState.deactivate();
      this.simState.activate(
        this.shapeManager.shapes(),
        this.shapeManager.connections()
      );
      this.requestRender();
      this.simRender.startAnimation(() => this.renderAnimationLayer());
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

  private getDefaultPipeTemplateId(): number | undefined {
    return this.simEquipmentApi.equipmentList()
      .find(eq => eq.id != null && normalizeSimRole(eq.simRole) === 'pipe')
      ?.id;
  }

  private centerOnPlacement(shape: DiagramPlacement): void {
    const container = this.canvasContainerRef?.nativeElement;
    if (!container) return;

    const shapeCenterX = shape.x + shape.width / 2;
    const shapeCenterY = shape.y + shape.height / 2;
    this.transform = {
      ...this.transform,
      pointX: container.clientWidth / 2 - shapeCenterX * this.transform.scale,
      pointY: container.clientHeight / 2 - shapeCenterY * this.transform.scale,
    };
  }

  private centerOnConnection(connection: { sourcePlacementId: number; targetPlacementId: number }): void {
    const source = this.shapeManager.getShapeById(connection.sourcePlacementId);
    const target = this.shapeManager.getShapeById(connection.targetPlacementId);
    const container = this.canvasContainerRef?.nativeElement;
    if (!source || !target || !container) return;

    const midpointX = (source.x + source.width / 2 + target.x + target.width / 2) / 2;
    const midpointY = (source.y + source.height / 2 + target.y + target.height / 2) / 2;
    this.transform = {
      ...this.transform,
      pointX: container.clientWidth / 2 - midpointX * this.transform.scale,
      pointY: container.clientHeight / 2 - midpointY * this.transform.scale,
    };
  }
}
