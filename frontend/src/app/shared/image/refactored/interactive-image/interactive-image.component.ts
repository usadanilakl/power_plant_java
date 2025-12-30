
import { Component, computed, DestroyRef, effect, ElementRef, inject, input, output, signal, ViewChild } from "@angular/core";
import { fromEvent } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SymbolPaletteComponent } from "../symbol-palette/symbol-palette.component";
import { CommonModule } from "@angular/common";
import { UnifiedToolbarComponent } from "../unified-toolbar/unified-toolbar.component";
import { ContextMenuComponent, ContextMenuAction } from "../../../menu/context-menu/context-menu.component";
import { MouseEventsService } from "../services/mouse-events.service";
import { TransformState, ZoomPanService } from "../services/zoom-pan.service";
import { CanvasRenderService } from "../services/canvas-render.service";
import { DrawingService } from "../services/drawing.service";
import { ShapeConversionService } from "../services/shape-conversion.service";
import { ShapeManagerService } from "../services/shape-manager.service";
import { RfImageShape, RfRectangleShape, RfShape } from "../models/fr-shape.model";
import { PIDSymbol } from "../services/pid-symbols.service";
import {
  InteractiveImageConfig,
  INTERACTIVE_IMAGE_PRESETS,
  getPreset,
  mergeConfig,
  ToolbarTool,
  ContextMenuActionType
} from "../models/interactive-image-config.model";



type DrawMode = 'none' | 'rectangle' | 'symbol';
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

@Component({
  selector: 'app-interactive-image',
  standalone: true,
  imports: [
    CommonModule,
    SymbolPaletteComponent,
    ContextMenuComponent,
    UnifiedToolbarComponent,
  ],
  templateUrl: './interactive-image.component.html',
  styleUrl: './interactive-image.component.css',
})
export class InteractiveImageComponent {
  @ViewChild('imageContainer') imageContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('zoomElement') private zoomElementRef!: ElementRef<HTMLDivElement>;
  @ViewChild('zoomOuter') private zoomOuterRef!: ElementRef<HTMLDivElement>;
  @ViewChild('imageElement') private imgRef!: ElementRef<HTMLImageElement>;
  @ViewChild('canvasElement') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('shapeImageInput') shapeImageInput!: ElementRef<HTMLInputElement>;

  private mouseEventService = inject(MouseEventsService);
  private destroyRef = inject(DestroyRef);
  private zoomPanService = inject(ZoomPanService);
  private canvasRenderService = inject(CanvasRenderService);
  private drawingService = inject(DrawingService);
  private shapeConversionService = inject(ShapeConversionService);
  private shapeManager = inject(ShapeManagerService);

  imageUrl = input<string>();
  imageName = input<string>();
  shapesInput = input<RfShape[]>([]);
  hoveredShapeId = input<number | null>(null);

  // Configuration-based approach (replaces simple 'mode')
  config = input<InteractiveImageConfig>();
  preset = input<keyof typeof INTERACTIVE_IMAGE_PRESETS>();

  // Computed configuration: use preset if provided, otherwise use config, otherwise default to VIEW_ONLY
  activeConfig = computed(() => {
    const presetName = this.preset();
    const customConfig = this.config();

    if (presetName) {
      return customConfig ? mergeConfig(getPreset(presetName), customConfig) : getPreset(presetName);
    }

    if (customConfig) {
      return customConfig;
    }

    // Default fallback
    return INTERACTIVE_IMAGE_PRESETS['VIEW_ONLY'];
  });

  // Outputs
  shapeRightClicked = output<RfShape>();
  shapeDoubleClicked = output<RfShape>();
  shapeClicked = output<RfShape>();
  shapeUpdated = output<RfShape>();
  shapeDrawn = output<RfShape>();
  shapeHovered = output<RfShape | null>();

  pngUrl = computed(()=>this.imageUrl()?.replaceAll('pdf', 'jpg'));

  shapes = this.shapeManager.shapes;
  selectedShapeIds = this.shapeManager.selectedShapeIds;
  singleSelectedShapeId = this.shapeManager.singleSelectedShapeId;

  private _zoomElement!: HTMLDivElement;
  private _zoomOuter!: HTMLDivElement;
  private _img!: HTMLImageElement;
  private _canvas!: HTMLCanvasElement;

  get zoomElement(): HTMLDivElement {
    return this._zoomElement;
  }
  get zoomOuter(): HTMLDivElement {
    return this._zoomOuter;
  }
  get img(): HTMLImageElement {
    return this._img;
  }
  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  // Transform state
  private transformState: TransformState = {
    scale: 1,
    pointX: 0,
    pointY: 0,
  };
  private zoomEndTimer: any = null;

  // Panning state
  private isPanning: boolean = false;
  private panStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private panStartTransform: TransformState = {
    scale: 1,
    pointX: 0,
    pointY: 0,
  };

  baseImageScale: number = 1;
  imageScale: number = 1;
  cursor: string = 'default';

  // ResizeObserver to monitor image size changes
  private imageResizeObserver: ResizeObserver | null = null;

  //Shape Dragging state
  private isDraggingShape: boolean = false;
  private dragStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private draggedShapeIds: number[] = [];
  private initialShapePositions: Map<number, { x: number; y: number }> =
    new Map();

  // Shape Resizing state
  private isResizingShape: boolean = false;
  private resizeHandle: ResizeHandle | null = null;
  private resizeStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private resizingShapeId: number | null = null;
  private initialShapeBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  private enforceAspectRatio = signal<boolean>(false);
  private readonly MIN_SHAPE_SIZE = 10; // Minimum width/height for shapes

  private isRotatingShape = false;
  private rotatingShapeId: number | null = null;

  contextMenu = {
    visible: false,
    x: 0,
    y: 0,
    actions: [] as ContextMenuAction[],
    selectedItem: null as any,
  };

  private shapeIdToConvert: number | null = null;

  // Clipboard for copy/paste
  private clipboard: RfShape[] = [];

  //Symbol palette
  private _symbolPaletteVisible = signal<boolean>(true);
  showSymbolPalette = computed(() => {
    const config = this.activeConfig();
    return config.showSymbolPalette && this._symbolPaletteVisible();
  });
  currentDrawMode = signal<DrawMode>('none');
  selectedSymbol = signal<PIDSymbol | null>(null);
  currentTool = signal<ToolbarTool | null>('select');

  // Toolbar configuration based on active config
  enabledTools = computed(() => this.activeConfig().enabledTools || []);

  constructor() {
    // Effect to load shapes from input when they change
    effect(() => {
      const inputShapes = this.shapesInput();
      if (inputShapes && inputShapes.length > 0) {
        this.shapeManager.setShapes(inputShapes);
      }
    });

    // Effect to redraw canvas when shapes change
    effect(() => {
      const shapes = this.shapes();
      if (this.canvas && this.img) {
        this.updateCanvasAndRedraw();
      }
    });

    // Effect to redraw canvas when hoveredShapeId changes
    effect(() => {
      const hoveredId = this.hoveredShapeId();
      if (this.canvas && this.img) {
        this.updateCanvasAndRedraw();
      }
    });

    // Effect to handle single-draw mode (auto-close after drawing one shape)
    effect(() => {
      const cfg = this.activeConfig();
      if (cfg.drawingMode === 'single' && this.shapes().length > this.shapesInput().length) {
        // A new shape was drawn in single-draw mode, emit and reset
        this.currentDrawMode.set('none');
      }
    });
  }

  ngOnDestroy() {
    this.drawingService.cleanup();
    this.canvasRenderService.clearImageCache();

    // Cleanup ResizeObserver
    if (this.imageResizeObserver) {
      this.imageResizeObserver.disconnect();
      this.imageResizeObserver = null;
    }
  }

  ngAfterViewInit() {
    console.log('File URL:', this.imageUrl());
    this._zoomElement = this.zoomElementRef.nativeElement;
    this._zoomOuter = this.zoomOuterRef.nativeElement;
    this._img = this.imgRef.nativeElement;
    this._canvas = this.canvasRef.nativeElement;

    // Initialize drawing service
    this.drawingService.initializeTempCanvas(this.zoomElement);

    // Calculate base scale once after image loads
    this.img.onload = () => {
      this.baseImageScale = this.canvasRenderService.calculateBaseScale(
        this.img
      );
      this.updateImageScale();
      this.updateCanvasAndRedraw();
      this.updateTempCanvasSize();
    };

    // Set up ResizeObserver to monitor image size changes
    this.setupImageResizeObserver();

    this.setupMouseEvents();
    this.setupKeyboardShortcuts();
  }

  private setupMouseEvents(): void {
    const mousedown$ = fromEvent<MouseEvent>(this.zoomElement, 'mousedown');

    this.mouseEventService
      .classifyClicks(mousedown$)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((classifiedEvent) => {
        classifiedEvent.event.preventDefault();
        switch (classifiedEvent.type) {
          case 'single':
            this.onLeftClick(classifiedEvent.event);
            break;
          case 'double':
            console.log('Double click case');
            this.onDoubleClick(classifiedEvent.event);
            break;
          case 'middle':
            this.onMiddleClick(classifiedEvent.event);
            break;
          case 'right':
            this.onRightClick(classifiedEvent.event);
            break;
        }
      });

    fromEvent<MouseEvent>(this.zoomElement, 'contextmenu')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => event.preventDefault());
  }

  // ==================================================Zooming Events==========================================

  onWheel(event: WheelEvent): void {
    event.preventDefault();

    const zoomOuterRect = this.zoomOuter.getBoundingClientRect();
    const imageRect = this.zoomElement.getBoundingClientRect();

    this.transformState = this.zoomPanService.calculateZoom(
      event,
      this.transformState,
      zoomOuterRect,
      imageRect
    );

    this.zoomPanService.applyTransform(
      this.zoomElement,
      this.transformState,
      '0s'
    );
    this.updateImageScale();
    this.updateTempCanvasSize();

    // Clear existing timer and set a new one
    if (this.zoomEndTimer) {
      clearTimeout(this.zoomEndTimer);
    }

    this.zoomEndTimer = setTimeout(() => {
      this.onZoomEnd();
      this.zoomEndTimer = null;
    }, 150); // Increased from 100ms for better debouncing
  }

  private onZoomEnd(): void {
    // this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0s');
    this.updateCanvasAndRedraw();
  }

  private updateImageScale(): void {
    this.imageScale = this.baseImageScale * this.transformState.scale;
  }

  private updateCanvasAndRedraw(): void {
    if (!this.canvas) {
      console.error('Canvas not available for size update');
      return;
    }

    this.canvasRenderService.updateCanvasSize(this.canvas, this.img);
    this.canvasRenderService.drawShapes(
      this.canvas,
      this.shapes(),
      this.imageScale,
      this.hoveredShapeId()
    );
  }

  private updateTempCanvasSize(): void {
    this.drawingService.updateTempCanvasSize(this.img, this.baseImageScale);
  }

  // ===============================Mouse Event Handlers==============================================

  onMouseLeave(event: MouseEvent): void {
    if (this.drawingService.isDrawing()) {
      this.drawingService.cancelDrawing();
      this.cursor = 'default';
    }
    if (this.isPanning) {
      this.stopPanning();
    }
    // Clear hover state when mouse leaves the image
    this.shapeHovered.emit(null);
  }

  onMouseDown(event: MouseEvent): void {
    const config = this.activeConfig();

    // Right mouse button for drawing (only if drawing is allowed)
    if (event.button === 2 && config.canDrawShapes) {
      if (this.currentDrawMode() === 'symbol') {
        this.placeSymbol(event);
        console.log('Placing Symbol');
        return;
      } else {
        event.preventDefault();
        this.startDrawing(event);
        return;
      }
    }

    // Left mouse button for panning and shape manipulation
    if (event.button === 0) {
      // Check if clicking on a resize handle (only if resizing is allowed)
      if (config.canResizeShapes) {
        const handle = this.getResizeHandleAtPoint(event);
        if (handle) {
          event.preventDefault();
          this.startResizingShape(event, handle);
          return;
        }
      }

      // Check for rotation handle click (only if rotation is allowed)
      if (config.canRotateShapes && this.isPointInRotationHandle(event)) {
        this.startRotatingShape(event);
        return;
      }

      // Then check if clicking on a shape (for dragging)
      if (config.canDragShapes) {
        const clickedShapeId = this.isOverSelectedShape(event);
        if (clickedShapeId !== null) {
          // If Ctrl/Cmd is held, don't start dragging - just handle selection
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Selection will be handled in onLeftClick
            return;
          }
          // Start dragging the shape(s)
          event.preventDefault();
          this.startDraggingShape(event, clickedShapeId);
          return;
        }
      }

      // Default: start panning (if allowed)
      if (config.canPan) {
        event.preventDefault();
        this.startPanning(event);
      }
      return;
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.drawingService.isDrawing()) {
      event.preventDefault();
      this.updateDrawing(event);
      return;
    }

    if (this.isResizingShape) {
      event.preventDefault();
      this.updateResizingShape(event);
      return;
    }

    if (this.isDraggingShape) {
      event.preventDefault();
      this.updateDraggingShape(event);
      return;
    }

    if (this.isRotatingShape) {
      this.updateRotatingShape(event);
      return;
    }

    if (this.isPanning) {
      event.preventDefault();

      const currentPos = {
        x: event.clientX,
        y: event.clientY,
      };

      const newPosition = this.zoomPanService.calculatePan(
        this.panStartPos,
        currentPos,
        this.panStartTransform
      );

      this.transformState = {
        ...this.transformState,
        pointX: newPosition.pointX,
        pointY: newPosition.pointY,
      };

      // Apply transform immediately (CSS transform is fast)
      this.zoomPanService.applyTransform(
        this.zoomElement,
        this.transformState,
        '0s'
      );
      this.cursor = 'grabbing';
    }

    // Update cursor based on hover state
    this.updateCursorForHover(event);
  }

  onMouseUp(event: MouseEvent): void {
    if (this.drawingService.isDrawing()) {
      this.finishDrawing(event);
      return;
    }

    if (this.isResizingShape) {
      this.stopResizingShape();
      return;
    }

    if (this.isDraggingShape) {
      this.stopDraggingShape();
      return;
    }

    if (this.isRotatingShape) {
      this.stopRotatingShape();
      return;
    }

    if (this.isPanning) {
      this.stopPanning();
      // Update canvas once at the end
      this.updateCanvasAndRedraw();
    }
  }

  onLeftClick(event: MouseEvent): void {
    const config = this.activeConfig();

    // Only allow selection if configured
    if (config.canSelectShapes) {
      // Check if Ctrl (Windows/Linux) or Cmd (Mac) is held for multi-select
      if ((event.ctrlKey || event.metaKey) && config.canMultiSelect) {
        this.handleShapeSelection(event);
      } else {
        console.log('Ctrl/Cmd key is NOT held');
        // Handle normal click behavior
        const clickedShapeId = this.isOverShape(event);
        if (clickedShapeId !== null) {
          const shape = this.shapeManager.getShapeById(clickedShapeId);
          if(shape) this.shapeClicked.emit(shape);
        }
      }
    }
  }

  onMiddleClick(event: MouseEvent): void {
    console.log('middle click');
  }

  onRightClick(event: MouseEvent): void {
    event.preventDefault();
    const config = this.activeConfig();

    // First check if we clicked on a shape
    const clickedShapeId = this.isOverShape(event);

    if (clickedShapeId !== null) {
      const clickedShape = this.shapeManager.getShapeById(clickedShapeId);

      // Emit the shape right-click event for parent component to handle
      if (clickedShape) {
        this.shapeRightClicked.emit(clickedShape);
      }

      // Only show context menu if configured
      if (!config.showContextMenu) return;

      // Select the shape if not already selected (and selection is allowed)
      if (config.canSelectShapes && !this.selectedShapeIds().includes(clickedShapeId)) {
        this.shapeManager.selectShape(clickedShapeId, true);
      }

      // Show context menu for shape operations
      this.showShapeContextMenu(event, clickedShapeId);
    }
  }

  onDoubleClick(event: MouseEvent): void {
    console.log('double click');
    const config = this.activeConfig();

    // Only handle shape selection if allowed
    if (config.canSelectShapes) {
      this.handleShapeSelection(event);
    }
  }

  // ==================================================Panning Methods==================================================

  private startPanning(event: MouseEvent): void {
    this.isPanning = true;
    this.panStartPos = {
      x: event.clientX,
      y: event.clientY,
    };
    this.panStartTransform = { ...this.transformState };
    this.cursor = 'grabbing';

    // Add dragging class to disable CSS transitions
    this.zoomElement.classList.add('dragging');
  }

  private stopPanning(): void {
    this.isPanning = false;
    this.cursor = 'default';

    // Remove dragging class
    this.zoomElement.classList.remove('dragging');
  }

  private resetTransform(): void {
    this.transformState = {
      scale: 1,
      pointX: 0,
      pointY: 0,
    };
    this.zoomPanService.applyTransform(this.zoomElement, this.transformState);
    this.updateImageScale();
    setTimeout(() => this.updateCanvasAndRedraw(), 300);
  }

  // Zoom in by 25%
  private zoomIn(): void {
    const zoomOuterRect = this.zoomOuter.getBoundingClientRect();

    // Calculate center point for zoom
    const centerX = zoomOuterRect.width / 2;
    const centerY = zoomOuterRect.height / 2;

    const newScale = Math.min(this.transformState.scale * 1.25, 10); // Max zoom 10x
    const scaleDiff = newScale / this.transformState.scale;

    // Adjust position to zoom towards center
    const newPointX = centerX - (centerX - this.transformState.pointX) * scaleDiff;
    const newPointY = centerY - (centerY - this.transformState.pointY) * scaleDiff;

    this.transformState = {
      scale: newScale,
      pointX: newPointX,
      pointY: newPointY,
    };

    this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0.2s');
    this.updateImageScale();
    setTimeout(() => {
      this.updateCanvasAndRedraw();
      this.updateTempCanvasSize();
    }, 200);
  }

  // Zoom out by 25%
  private zoomOut(): void {
    const zoomOuterRect = this.zoomOuter.getBoundingClientRect();

    // Calculate center point for zoom
    const centerX = zoomOuterRect.width / 2;
    const centerY = zoomOuterRect.height / 2;

    const newScale = Math.max(this.transformState.scale * 0.8, 0.1); // Min zoom 0.1x
    const scaleDiff = newScale / this.transformState.scale;

    // Adjust position to zoom towards center
    const newPointX = centerX - (centerX - this.transformState.pointX) * scaleDiff;
    const newPointY = centerY - (centerY - this.transformState.pointY) * scaleDiff;

    this.transformState = {
      scale: newScale,
      pointX: newPointX,
      pointY: newPointY,
    };

    this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0.2s');
    this.updateImageScale();
    setTimeout(() => {
      this.updateCanvasAndRedraw();
      this.updateTempCanvasSize();
    }, 200);
  }

  // Fit image to screen
  private fitToScreen(): void {
    if (!this.img || !this.zoomOuter) return;

    const containerRect = this.zoomOuter.getBoundingClientRect();
    const imgNaturalWidth = this.img.naturalWidth;
    const imgNaturalHeight = this.img.naturalHeight;

    if (!imgNaturalWidth || !imgNaturalHeight) return;

    // Calculate scale to fit image in container with some padding
    const padding = 40; // 20px padding on each side
    const scaleX = (containerRect.width - padding) / imgNaturalWidth;
    const scaleY = (containerRect.height - padding) / imgNaturalHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

    // Center the image
    const scaledWidth = imgNaturalWidth * scale;
    const scaledHeight = imgNaturalHeight * scale;
    const pointX = (containerRect.width - scaledWidth) / 2;
    const pointY = (containerRect.height - scaledHeight) / 2;

    this.transformState = {
      scale: scale / this.baseImageScale,
      pointX: pointX,
      pointY: pointY,
    };

    this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0.3s');
    this.updateImageScale();
    setTimeout(() => {
      this.updateCanvasAndRedraw();
      this.updateTempCanvasSize();
    }, 300);
  }

  // ==================================================Drawing Methods==================================================

  private startDrawing(event: MouseEvent): void {
    const imgRect = this.img.getBoundingClientRect();
    this.drawingService.startDrawing(
      event.clientX,
      event.clientY,
      imgRect,
      this.baseImageScale,
      this.transformState
    );
    this.cursor = 'crosshair';
  }

  private updateDrawing(event: MouseEvent): void {
    const imgRect = this.img.getBoundingClientRect();
    this.drawingService.updateDrawing(
      event.clientX,
      event.clientY,
      imgRect,
      this.baseImageScale, // Pass baseImageScale, not imageScale
      this.transformState
    );
  }

  private finishDrawing(event: MouseEvent): void {
    const imgRect = this.img.getBoundingClientRect();
    const newShape = this.drawingService.finishDrawing(
      event.clientX,
      event.clientY,
      imgRect,
      this.baseImageScale,
      this.transformState,
      this.img.naturalWidth,
      this.img.naturalHeight,
      this.shapeManager.getNextShapeId()
    );

    if (newShape) {
      this.shapeManager.addShape(newShape);
      this.shapeDrawn.emit(newShape);
    }

    this.cursor = 'default';
  }

  //==================================================Image Shape Methods==================================================
  convertShapeToImage(shapeId: number): void {
    this.shapeIdToConvert = shapeId;
    this.shapeImageInput.nativeElement.click();
  }

  async onShapeImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (
      !input.files ||
      input.files.length === 0 ||
      this.shapeIdToConvert === null
    ) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      console.error('Please select an image file');
      return;
    }

    try {
      const currentShape = this.shapeManager.getShapeById(
        this.shapeIdToConvert
      );

      if (!currentShape) {
        // Changed
        console.error('Shape not found');
        return;
      }

      if (currentShape.type === 'rectangle') {
        const imageShape =
          await this.shapeConversionService.convertRectangleToImage(
            currentShape as RfRectangleShape,
            file
          );
        this.shapeManager.replaceShape(this.shapeIdToConvert, imageShape);
      } else if (currentShape.type === 'image') {
        const updatedShape =
          await this.shapeConversionService.updateImageForShape(
            currentShape as RfImageShape,
            file
          );
        this.shapeManager.replaceShape(this.shapeIdToConvert, updatedShape);
      }

      console.log('Shape converted to image successfully');
    } catch (error) {
      console.error('Failed to convert shape to image:', error);
    } finally {
      this.shapeIdToConvert = null;
      input.value = '';
    }
  }

  convertImageToRectangle(shapeId: number): void {
    const currentShape = this.shapeManager.getShapeById(shapeId);

    if (!currentShape) {
      console.error('Shape not found');
      return;
    }

    if (currentShape.type === 'image') {
      const rectangleShape =
        this.shapeConversionService.convertImageToRectangle(
          currentShape as RfImageShape
        );
      this.shapeManager.replaceShape(shapeId, rectangleShape);
      console.log('Image converted back to rectangle');
    }
  }

  // ==================================================Symbol Palette Methods==================================================
  toggleSymbolPalette(): void {
    this._symbolPaletteVisible.update((show) => !show);
  }

  // Handle toolbar tool clicks
  onToolbarToolClick(tool: ToolbarTool): void {
    switch (tool) {
      case 'select':
        this.setDrawMode('none');
        this.currentTool.set('select');
        break;
      case 'draw-rectangle':
        this.setDrawMode('rectangle');
        this.currentTool.set('draw-rectangle');
        break;
      case 'place-symbol':
        this.setDrawMode('symbol');
        this.currentTool.set('place-symbol');
        break;
      case 'delete':
        const selectedIds = this.selectedShapeIds();
        if (selectedIds.length > 0 && this.activeConfig().canDeleteShapes) {
          this.shapeManager.deleteShapes(selectedIds);
        }
        break;
      case 'duplicate':
        const selectedIds2 = this.selectedShapeIds();
        selectedIds2.forEach(id => this.duplicateShape(id));
        break;
      case 'zoom-in':
        this.zoomIn();
        break;
      case 'zoom-out':
        this.zoomOut();
        break;
      case 'zoom-fit':
        this.fitToScreen();
        break;
      case 'reset-view':
        this.resetTransform();
        break;
      default:
        console.warn('Unknown toolbar tool:', tool);
    }
  }

  setDrawMode(mode: DrawMode): void {
    this.currentDrawMode.set(mode);

    if (mode === 'symbol') {
      this.cursor = 'crosshair';
    } else if (mode === 'rectangle') {
      this.cursor = 'crosshair';
    } else {
      this.cursor = 'default';
    }
  }

  onSymbolSelected(symbol: PIDSymbol): void {
    this.selectedSymbol.set(symbol);
    this.setDrawMode('symbol');
    console.log('Symbol selected:', symbol);
  }

  private placeSymbol(event: MouseEvent): void {
    const symbol = this.selectedSymbol();
    if (!symbol) return;

    const imgRect = this.img.getBoundingClientRect();
    const x =
      (event.clientX - imgRect.left) /
      this.transformState.scale /
      this.baseImageScale;
    const y =
      (event.clientY - imgRect.top) /
      this.transformState.scale /
      this.baseImageScale;

    // Use a default width and calculate height based on aspect ratio
    const initialWidth = 50;
    const aspectRatio = symbol.originalHeight / symbol.originalWidth;
    const initialHeight = initialWidth * aspectRatio;

    // Create a temporary symbol object with the correct initial size
    const sizedSymbol: PIDSymbol = {
      ...symbol,
      width: initialWidth,
      height: initialHeight,
    };

    const newSymbol = this.shapeManager.createSymbol(
      sizedSymbol,
      x,
      y,
      this.img.naturalWidth,
      this.img.naturalHeight
    );

    this.shapeManager.addShape(newSymbol);
    this.setDrawMode('none');
    this.selectedSymbol.set(null);
    this.cursor = 'default';
  }

  //==================================================Shape Events==================================================

  // Add method to handle shape selection (add after onLeftClick):
  private handleShapeSelection(event: MouseEvent): void {
    const clickedShapeId = this.isOverShape(event);

    if (clickedShapeId !== null) {
      // Handle selection with Ctrl/Cmd for multi-select
      if (event.ctrlKey || event.metaKey) {
        console.log('Multi-select', clickedShapeId);
        this.shapeManager.toggleShapeSelection(clickedShapeId);
      } else {
        this.shapeManager.selectShape(clickedShapeId, true);
      }
    } else {
      // Clicked on empty space - clear selection
      if (!event.ctrlKey && !event.metaKey) {
        this.shapeManager.clearSelections();
      }
    }
  }

  // Add visual feedback for selected shapes in the template
  // Update the cursor based on hover state (add this method):
  private updateCursorForHover(event: MouseEvent): void {
    if (this.currentDrawMode() !== 'none') return;

    // Check for resize handles first (highest priority)
    const handle = this.getResizeHandleAtPoint(event);
    if (handle) {
      this.cursor = this.getResizeCursor(handle);
      return;
    }

    // Check for rotation handle (second priority)
    if (this.isPointInRotationHandle(event)) {
      this.cursor = 'grab';
      return;
    }

    const imgRect = this.img.getBoundingClientRect();
    const hoverX =
      (event.clientX - imgRect.left) /
      this.transformState.scale /
      this.baseImageScale;
    const hoverY =
      (event.clientY - imgRect.top) /
      this.transformState.scale /
      this.baseImageScale;

    const shapes = this.shapes();
    let isOverShape = false;
    let hoveredShape: RfShape | null = null;

    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];

      if (
        shape.type === 'rectangle' ||
        shape.type === 'image' ||
        shape.type === 'svg-symbol'
      ) {
        if (
          hoverX >= shape.x &&
          hoverX <= shape.x + shape.width &&
          hoverY >= shape.y &&
          hoverY <= shape.y + shape.height
        ) {
          isOverShape = true;
          hoveredShape = shape;
          break;
        }
      }
    }

    this.cursor = isOverShape ? 'pointer' : 'default';

    // Emit hovered shape for external listeners
    this.shapeHovered.emit(hoveredShape);
  }

  // Enhanced keyboard shortcuts for all operations
  private setupKeyboardShortcuts(): void {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const config = this.activeConfig();

        // Drawing mode shortcuts
        if (config.canDrawShapes) {
          // V or Esc - Select mode
          if (event.key === 'v' || event.key === 'V' || event.key === 'Escape') {
            event.preventDefault();
            this.setDrawMode('none');
            this.currentTool.set('select');
            this.shapeManager.clearSelections();
            this.selectedSymbol.set(null);
            this.cursor = 'default';
            return;
          }

          // R - Rectangle mode
          if (event.key === 'r' || event.key === 'R') {
            event.preventDefault();
            this.setDrawMode('rectangle');
            this.currentTool.set('draw-rectangle');
            return;
          }

          // S - Symbol mode
          if ((event.key === 's' || event.key === 'S') && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            this.setDrawMode('symbol');
            this.currentTool.set('place-symbol');
            return;
          }

          // P - Toggle symbol palette
          if (event.key === 'p' || event.key === 'P') {
            event.preventDefault();
            this.toggleSymbolPalette();
            return;
          }
        }

        // Zoom shortcuts
        if (config.canZoom) {
          // + or = - Zoom in
          if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            this.zoomIn();
            return;
          }

          // - or _ - Zoom out
          if (event.key === '-' || event.key === '_') {
            event.preventDefault();
            this.zoomOut();
            return;
          }

          // F or 0 - Fit to screen
          if ((event.key === 'f' || event.key === 'F' || event.key === '0') && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            this.fitToScreen();
            return;
          }

          // Ctrl+0 - Reset view
          if ((event.ctrlKey || event.metaKey) && event.key === '0') {
            event.preventDefault();
            this.resetTransform();
            return;
          }
        }

        // Delete selected shapes with Delete or Backspace
        if (config.canDeleteShapes && (event.key === 'Delete' || event.key === 'Backspace')) {
          const selectedIds = this.selectedShapeIds();
          if (selectedIds.length > 0) {
            event.preventDefault();
            this.shapeManager.deleteShapes(selectedIds);
            console.log('Deleted shapes:', selectedIds);
          }
        }

        // Ctrl+D - Duplicate
        if (config.canEditShapes && (event.ctrlKey || event.metaKey) && event.key === 'd') {
          event.preventDefault();
          const selectedIds = this.selectedShapeIds();
          selectedIds.forEach(id => this.duplicateShape(id));
          return;
        }

        // Select all with Ctrl+A
        if (config.canSelectShapes && config.canMultiSelect && (event.ctrlKey || event.metaKey) && event.key === 'a') {
          event.preventDefault();
          const allShapeIds = this.shapes().map((s) => s.id);
          this.shapeManager.selectMultipleShapes(allShapeIds);
          console.log('Selected all shapes');
        }

        // Copy selected shapes with Ctrl+C
        if (config.canSelectShapes && (event.ctrlKey || event.metaKey) && event.key === 'c') {
          const selectedShapes = this.shapeManager.getSelectedShapes();
          if (selectedShapes.length > 0) {
            event.preventDefault();
            this.copyShapes(selectedShapes);
          }
        }

        // Paste shapes with Ctrl+V
        if (config.canEditShapes && (event.ctrlKey || event.metaKey) && event.key === 'v') {
          event.preventDefault();
          this.pasteShapes();
        }
      });
  }

  /**
   * Setup ResizeObserver to monitor image size changes and recalculate baseImageScale
   */
  private setupImageResizeObserver(): void {
    this.imageResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Only recalculate if the image has loaded and has natural dimensions
        if (this.img.naturalWidth > 0 && this.img.naturalHeight > 0) {
          const newBaseScale = this.canvasRenderService.calculateBaseScale(this.img);

          // Only update if scale actually changed (avoid unnecessary redraws)
          if (Math.abs(newBaseScale - this.baseImageScale) > 0.0001) {
            console.log('Image resized - updating baseImageScale from', this.baseImageScale, 'to', newBaseScale);
            this.baseImageScale = newBaseScale;

            // Update imageScale which depends on baseImageScale
            this.updateImageScale();

            // Redraw canvas with updated scale
            this.updateCanvasAndRedraw();

            // Update temp canvas size as well
            this.updateTempCanvasSize();
          }
        }
      }
    });

    // Start observing the image element
    this.imageResizeObserver.observe(this.img);
  }

  private isOverShape(event: MouseEvent) {
    const imgRect = this.img.getBoundingClientRect();
    const clickX =
      (event.clientX - imgRect.left) /
      this.transformState.scale /
      this.baseImageScale;
    const clickY =
      (event.clientY - imgRect.top) /
      this.transformState.scale /
      this.baseImageScale;

    const shapes = this.shapes();
    let clickedShapeId: number | null = null;

    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];

      if (
        shape.type === 'rectangle' ||
        shape.type === 'image' ||
        shape.type === 'svg-symbol'
      ) {
        if (
          clickX >= shape.x &&
          clickX <= shape.x + shape.width &&
          clickY >= shape.y &&
          clickY <= shape.y + shape.height
        ) {
          clickedShapeId = shape.id;
          break;
        }
      }
    }
    return clickedShapeId;
  }

  private isOverSelectedShape(event: MouseEvent) {
    const shapeId = this.isOverShape(event);
    if (shapeId && this.selectedShapeIds().includes(shapeId)) return shapeId;
    return null;
  }

  closeContextMenu(): void {
    this.contextMenu.visible = false;
    this.contextMenu.selectedItem = null;
  }

  handleContextMenuAction(event: { action: ContextMenuAction; item: any }): void {
    // The action handler is already executed by the ContextMenuAction itself
    // Just close the menu after action is executed
    this.closeContextMenu();
  }

  // Add a method to show context menu (add after handleShapeSelection):
  private showShapeContextMenu(event: MouseEvent, shapeId: number): void {
    const shape = this.shapeManager.getShapeById(shapeId);
    if (!shape) return;

    const actions: ContextMenuAction[] = [];

    if (shape.type === 'rectangle') {
      actions.push({
        id: 'convertToImage',
        label: 'Convert to Image',
        action: () => this.convertShapeToImage(shapeId)
      });
    } else if (shape.type === 'image') {
      actions.push({
        id: 'changeImage',
        label: 'Change Image',
        action: () => this.convertShapeToImage(shapeId)
      });
      actions.push({
        id: 'convertToRect',
        label: 'Convert to Rectangle',
        action: () => this.convertImageToRectangle(shapeId)
      });
    }

    actions.push(
      { id: 'bringToFront', label: 'Bring to Front', action: () => console.log('Bring to front:', shapeId) },
      { id: 'sendToBack', label: 'Send to Back', action: () => console.log('Send to back:', shapeId) },
      { id: 'duplicate', label: 'Duplicate', action: () => this.duplicateShape(shapeId) },
      { id: 'delete', label: 'Delete', action: () => this.shapeManager.deleteShapes([shapeId]) }
    );

    this.contextMenu = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      actions: actions,
      selectedItem: shape,
    };
  }

  private duplicateShape(shapeId: number): void {
    const shape = this.shapeManager.getShapeById(shapeId);
    if (!shape) return;

    let newShape: RfShape;

    if (shape.type === 'rectangle' || shape.type === 'image' || shape.type === 'svg-symbol') {
      newShape = {
        ...shape,
        id: this.shapeManager.getNextShapeId(),
        x: shape.x + 20,
        y: shape.y + 20,
        isSelected: false,
        isBulkSelected: false,
      } as RfShape;
    } else {
      newShape = {
        ...shape,
        id: this.shapeManager.getNextShapeId(),
        isSelected: false,
        isBulkSelected: false,
      } as RfShape;
    }

    this.shapeManager.addShape(newShape);
  }

  // Copy selected shapes to clipboard
  private copyShapes(shapes: RfShape[]): void {
    // Deep copy shapes to clipboard
    this.clipboard = shapes.map(shape => ({ ...shape }));
    console.log(`Copied ${this.clipboard.length} shape(s) to clipboard`);
  }

  // Paste shapes from clipboard
  private pasteShapes(): void {
    if (this.clipboard.length === 0) {
      console.log('Clipboard is empty');
      return;
    }

    const config = this.activeConfig();
    if (!config.canEditShapes) {
      console.warn('Pasting not allowed in current mode');
      return;
    }

    // Clear current selection
    this.shapeManager.clearSelections();

    // Paste each shape from clipboard with offset
    const pastedShapeIds: number[] = [];
    this.clipboard.forEach((clipboardShape) => {
      let newShape: RfShape;

      if (clipboardShape.type === 'rectangle' || clipboardShape.type === 'image' || clipboardShape.type === 'svg-symbol') {
        newShape = {
          ...clipboardShape,
          id: this.shapeManager.getNextShapeId(),
          x: clipboardShape.x + 20,
          y: clipboardShape.y + 20,
          isSelected: false,
          isBulkSelected: false,
        } as RfShape;
      } else {
        newShape = {
          ...clipboardShape,
          id: this.shapeManager.getNextShapeId(),
          isSelected: false,
          isBulkSelected: false,
        } as RfShape;
      }

      this.shapeManager.addShape(newShape);
      pastedShapeIds.push(newShape.id);
    });

    // Select the newly pasted shapes
    if (config.canSelectShapes && pastedShapeIds.length > 0) {
      this.shapeManager.selectMultipleShapes(pastedShapeIds);
    }

    console.log(`Pasted ${pastedShapeIds.length} shape(s)`);
  }

  // ========================================Shape Draggign================================
  private startDraggingShape(event: MouseEvent, clickedShapeId: number): void {
    // If clicked shape is not selected, select it exclusively
    if (!this.selectedShapeIds().includes(clickedShapeId)) {
      // this.shapeManager.selectShape(clickedShapeId, true);
      return;
    }

    this.isDraggingShape = true;
    this.draggedShapeIds = [...this.selectedShapeIds()];

    const imgRect = this.img.getBoundingClientRect();
    this.dragStartPos = {
      x:
        (event.clientX - imgRect.left) /
        this.transformState.scale /
        this.baseImageScale,
      y:
        (event.clientY - imgRect.top) /
        this.transformState.scale /
        this.baseImageScale,
    };

    // Store initial positions of all selected shapes
    this.initialShapePositions.clear();
    this.draggedShapeIds.forEach((shapeId) => {
      const shape = this.shapeManager.getShapeById(shapeId);
      if (
        shape &&
        (shape.type === 'rectangle' ||
          shape.type === 'image' ||
          shape.type === 'svg-symbol')
      ) {
        this.initialShapePositions.set(shapeId, { x: shape.x, y: shape.y });
      }
    });

    this.cursor = 'move';
  }

  private updateDraggingShape(event: MouseEvent): void {
    if (!this.isDraggingShape) return;

    const imgRect = this.img.getBoundingClientRect();
    const currentX =
      (event.clientX - imgRect.left) /
      this.transformState.scale /
      this.baseImageScale;
    const currentY =
      (event.clientY - imgRect.top) /
      this.transformState.scale /
      this.baseImageScale;

    const deltaX = currentX - this.dragStartPos.x;
    const deltaY = currentY - this.dragStartPos.y;

    // Update positions of all dragged shapes with boundary constraints
    this.draggedShapeIds.forEach((shapeId) => {
      const initialPos = this.initialShapePositions.get(shapeId);
      const shape = this.shapeManager.getShapeById(shapeId);

      if (initialPos && shape && (shape.type === 'rectangle' || shape.type === 'image' || shape.type === 'svg-symbol')) {
        let newX = initialPos.x + deltaX;
        let newY = initialPos.y + deltaY;

        // Optional: Constrain shapes to stay within image bounds
        // newX = Math.max(0, Math.min(newX, this.img.naturalWidth - shape.width));
        // newY = Math.max(0, Math.min(newY, this.img.naturalHeight - shape.height));

        this.shapeManager.updateShape(shapeId, {
          x: newX,
          y: newY,
        });
      }
    });

    // Canvas will be redrawn automatically by the effect
  }

  private stopDraggingShape(): void {
    this.isDraggingShape = false;

    // Emit updated event for all dragged shapes
    this.draggedShapeIds.forEach((shapeId) => {
      const shape = this.shapeManager.getShapeById(shapeId);
      if (shape) {
        this.shapeUpdated.emit(shape);
      }
    });

    this.draggedShapeIds = [];
    this.initialShapePositions.clear();
    this.cursor = 'default';
  }

  // ========================================Shape Resizing================================
  private startResizingShape(event: MouseEvent, handle: ResizeHandle): void {
    const singleSelectedId = this.singleSelectedShapeId();
    if (singleSelectedId === null) return;

    const shape = this.shapeManager.getShapeById(singleSelectedId);
    if (
      !shape ||
      (shape.type !== 'rectangle' &&
        shape.type !== 'image' &&
        shape.type !== 'svg-symbol')
    ) {
      return;
    }

    this.isResizingShape = true;
    this.resizeHandle = handle;
    this.resizingShapeId = singleSelectedId;

    const imgRect = this.img.getBoundingClientRect();
    this.resizeStartPos = {
      x:
        (event.clientX - imgRect.left) /
        this.transformState.scale /
        this.baseImageScale,
      y:
        (event.clientY - imgRect.top) /
        this.transformState.scale /
        this.baseImageScale,
    };

    this.initialShapeBounds = {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    };

    this.cursor = this.getResizeCursor(handle);
  }

  private updateResizingShape(event: MouseEvent): void {
    if (
      !this.isResizingShape ||
      !this.resizeHandle ||
      this.resizingShapeId === null ||
      !this.initialShapeBounds
    ) {
      return;
    }

    const shape = this.shapeManager.getShapeById(this.resizingShapeId);
    if (!shape) return;

    const imgRect = this.img.getBoundingClientRect();
    const currentX =
      (event.clientX - imgRect.left) /
      this.transformState.scale /
      this.baseImageScale;
    const currentY =
      (event.clientY - imgRect.top) /
      this.transformState.scale /
      this.baseImageScale;

    const deltaX = currentX - this.resizeStartPos.x;
    const deltaY = currentY - this.resizeStartPos.y;

    const newBounds = this.calculateNewBounds(
      this.initialShapeBounds,
      this.resizeHandle,
      deltaX,
      deltaY
    );

    // Enforce aspect ratio for SVG symbols
    if (this.enforceAspectRatio()) {
      const aspectRatio = shape.originalHeight / shape.originalWidth;
      if (newBounds.width !== this.initialShapeBounds.width) {
        const oldHeight = newBounds.height;
        newBounds.height = newBounds.width * aspectRatio;
        // Adjust 'y' for 'n' handles
        if (this.resizeHandle.includes('n')) {
          newBounds.y += oldHeight - newBounds.height;
        }
      } else if (newBounds.height !== this.initialShapeBounds.height) {
        const oldWidth = newBounds.width;
        newBounds.width = newBounds.height / aspectRatio;
        // Adjust 'x' for 'w' handles
        if (this.resizeHandle.includes('w')) {
          newBounds.x += oldWidth - newBounds.width;
        }
      }
    }

    // Apply minimum size constraint
    if (newBounds.width < this.MIN_SHAPE_SIZE || newBounds.height < this.MIN_SHAPE_SIZE) {
      return;
    }

    // Optional: Constrain shapes to stay within image bounds
    // const maxX = this.img.naturalWidth;
    // const maxY = this.img.naturalHeight;
    // if (newBounds.x < 0 || newBounds.y < 0 ||
    //     newBounds.x + newBounds.width > maxX ||
    //     newBounds.y + newBounds.height > maxY) {
    //   return;
    // }

    this.shapeManager.updateShape(this.resizingShapeId, newBounds);
  }

  private stopResizingShape(): void {
    this.isResizingShape = false;

    // Emit the updated shape
    if (this.resizingShapeId !== null) {
      const shape = this.shapeManager.getShapeById(this.resizingShapeId);
      if (shape) {
        this.shapeUpdated.emit(shape);
      }
    }

    this.resizeHandle = null;
    this.resizingShapeId = null;
    this.initialShapeBounds = null;
    this.cursor = 'default';
  }

  private calculateNewBounds(
    initial: { x: number; y: number; width: number; height: number },
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number
  ): { x: number; y: number; width: number; height: number } {
    const bounds = { ...initial };

    switch (handle) {
      case 'nw':
        bounds.x = initial.x + deltaX;
        bounds.y = initial.y + deltaY;
        bounds.width = initial.width - deltaX;
        bounds.height = initial.height - deltaY;
        break;
      case 'n':
        bounds.y = initial.y + deltaY;
        bounds.height = initial.height - deltaY;
        break;
      case 'ne':
        bounds.y = initial.y + deltaY;
        bounds.width = initial.width + deltaX;
        bounds.height = initial.height - deltaY;
        break;
      case 'e':
        bounds.width = initial.width + deltaX;
        break;
      case 'se':
        bounds.width = initial.width + deltaX;
        bounds.height = initial.height + deltaY;
        break;
      case 's':
        bounds.height = initial.height + deltaY;
        break;
      case 'sw':
        bounds.x = initial.x + deltaX;
        bounds.width = initial.width - deltaX;
        bounds.height = initial.height + deltaY;
        break;
      case 'w':
        bounds.x = initial.x + deltaX;
        bounds.width = initial.width - deltaX;
        break;
    }

    return bounds;
  }

  private getResizeHandleAtPoint(event: MouseEvent): ResizeHandle | null {
    const singleSelectedId = this.singleSelectedShapeId();
    if (singleSelectedId === null) return null;

    const shape = this.shapeManager.getShapeById(singleSelectedId);
    if (
      !shape ||
      (shape.type !== 'rectangle' &&
        shape.type !== 'image' &&
        shape.type !== 'svg-symbol')
    ) {
      return null;
    }

    const imgRect = this.img.getBoundingClientRect();
    let mouseX =
      (event.clientX - imgRect.left) /
      this.transformState.scale /
      this.baseImageScale;
    let mouseY =
      (event.clientY - imgRect.top) /
      this.transformState.scale /
      this.baseImageScale;

    // If shape is rotated, transform mouse coordinates to shape's local space
    const rotation = (shape as any).rotation || 0;
    if (rotation !== 0) {
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;

      // Translate mouse to origin
      const translatedX = mouseX - centerX;
      const translatedY = mouseY - centerY;

      // Rotate back by negative angle
      const angle = (-rotation * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      mouseX = translatedX * cos - translatedY * sin + centerX;
      mouseY = translatedX * sin + translatedY * cos + centerY;
    }

    // Handle size in image coordinates (adjust based on zoom)
    const handleSize = 8 / this.transformState.scale / this.baseImageScale;

    const handles = this.getResizeHandlePositions(shape, handleSize);

    for (const [handle, pos] of Object.entries(handles)) {
      if (this.isPointInHandle(mouseX, mouseY, pos, handleSize)) {
        return handle as ResizeHandle;
      }
    }

    return null;
  }

  private getResizeHandlePositions(
    shape: { x: number; y: number; width: number; height: number },
    handleSize: number
  ): Record<ResizeHandle, { x: number; y: number }> {
    const { x, y, width, height } = shape;
    const halfHandle = handleSize / 2;

    return {
      nw: { x: x - halfHandle, y: y - halfHandle },
      n: { x: x + width / 2 - halfHandle, y: y - halfHandle },
      ne: { x: x + width - halfHandle, y: y - halfHandle },
      e: { x: x + width - halfHandle, y: y + height / 2 - halfHandle },
      se: { x: x + width - halfHandle, y: y + height - halfHandle },
      s: { x: x + width / 2 - halfHandle, y: y + height - halfHandle },
      sw: { x: x - halfHandle, y: y + height - halfHandle },
      w: { x: x - halfHandle, y: y + height / 2 - halfHandle },
    };
  }

  private isPointInHandle(
    mouseX: number,
    mouseY: number,
    handlePos: { x: number; y: number },
    handleSize: number
  ): boolean {
    return (
      mouseX >= handlePos.x &&
      mouseX <= handlePos.x + handleSize &&
      mouseY >= handlePos.y &&
      mouseY <= handlePos.y + handleSize
    );
  }

  private getResizeCursor(handle: ResizeHandle): string {
    const cursorMap: Record<ResizeHandle, string> = {
      nw: 'nw-resize',
      n: 'n-resize',
      ne: 'ne-resize',
      e: 'e-resize',
      se: 'se-resize',
      s: 's-resize',
      sw: 'sw-resize',
      w: 'w-resize',
    };
    return cursorMap[handle];
  }

  private updateCursorForResize(event: MouseEvent): void {
    const handle = this.getResizeHandleAtPoint(event);
    if (handle) {
      this.cursor = this.getResizeCursor(handle);
    }
  }

  // ========================================Shape Rotation================================

  private getRotationHandlePosition(shape: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): { x: number; y: number } {
    const centerX = shape.x + shape.width / 2;
    const topY = shape.y;
    const handleOffset = 20 / this.transformState.scale / this.baseImageScale; // Make offset independent of zoom
    return { x: centerX, y: topY - handleOffset };
  }

  private isPointInRotationHandle(event: MouseEvent): boolean {
    const singleSelectedId = this.singleSelectedShapeId();
    if (singleSelectedId === null) return false;

    const shape = this.shapeManager.getShapeById(singleSelectedId);
    if (
      !shape ||
      (shape.type !== 'rectangle' &&
        shape.type !== 'image' &&
        shape.type !== 'svg-symbol')
    ) {
      return false;
    }

    const imgRect = this.img.getBoundingClientRect();
    let mouseX =
      (event.clientX - imgRect.left) /
      this.transformState.scale /
      this.baseImageScale;
    let mouseY =
      (event.clientY - imgRect.top) /
      this.transformState.scale /
      this.baseImageScale;

    // If shape is rotated, transform mouse coordinates to shape's local space
    const rotation = (shape as any).rotation || 0;
    if (rotation !== 0) {
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;

      // Translate mouse to origin
      const translatedX = mouseX - centerX;
      const translatedY = mouseY - centerY;

      // Rotate back by negative angle
      const angle = (-rotation * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      mouseX = translatedX * cos - translatedY * sin + centerX;
      mouseY = translatedX * sin + translatedY * cos + centerY;
    }

    const handlePos = this.getRotationHandlePosition(shape);
    const handleRadius = 8 / this.transformState.scale / this.baseImageScale;

    // Use circular hit detection for rotation handle
    const dx = mouseX - handlePos.x;
    const dy = mouseY - handlePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= handleRadius;
  }

  private startRotatingShape(event: MouseEvent): void {
    const singleSelectedId = this.singleSelectedShapeId();
    if (singleSelectedId === null) return;

    this.isRotatingShape = true;
    this.rotatingShapeId = singleSelectedId;
    this.cursor = 'grabbing'; // Better UX: use grabbing cursor for rotation
    event.preventDefault();
  }

  private updateRotatingShape(event: MouseEvent): void {
    if (!this.isRotatingShape || this.rotatingShapeId === null) return;

    const shape = this.shapeManager.getShapeById(this.rotatingShapeId);
    if (
      !shape ||
      (shape.type !== 'rectangle' &&
        shape.type !== 'image' &&
        shape.type !== 'svg-symbol')
    ) {
      return;
    }

    const imgRect = this.img.getBoundingClientRect();
    const mouseX =
      (event.clientX - imgRect.left) /
      this.transformState.scale /
      this.baseImageScale;
    const mouseY =
      (event.clientY - imgRect.top) /
      this.transformState.scale /
      this.baseImageScale;

    const centerX = shape.x + shape.width / 2;
    const centerY = shape.y + shape.height / 2;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    // Calculate angle, add 90 degrees to offset for the handle's top position
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;

    // Optional: Snap to 15-degree increments when Shift key is held
    if (event.shiftKey) {
      const snapAngle = 15;
      angle = Math.round(angle / snapAngle) * snapAngle;
    }

    // Normalize angle to 0-360 range
    angle = ((angle % 360) + 360) % 360;

    this.shapeManager.updateShape(this.rotatingShapeId, { rotation: angle });
  }

  private stopRotatingShape(): void {
    this.isRotatingShape = false;

    // Emit the updated shape
    if (this.rotatingShapeId !== null) {
      const shape = this.shapeManager.getShapeById(this.rotatingShapeId);
      if (shape) {
        this.shapeUpdated.emit(shape);
      }
    }

    this.rotatingShapeId = null;
    this.cursor = 'default';
  }
}
