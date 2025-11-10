
import { Component, DestroyRef, effect, ElementRef, inject, input, signal, ViewChild } from "@angular/core";
import { fromEvent } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ImageShape, RectangleShape, Shape, SVGSymbolShape } from "../../../models/ui/shape.model";
import { MouseEventsService } from "../../../services/ui/mouse-events.service";
import { TransformState, ZoomPanService } from "../../../services/ui/zoom-pan.service";
import { CanvasRenderService } from "../../../services/ui/canvas-render.service";
import { DrawingService } from "../../../services/ui/drawing.service";
import { ShapeConversionService } from "../../../services/ui/shape-conversion.service";
import { SymbolPaletteComponent } from "../symbol-palette/symbol-palette.component";
import { CommonModule } from "@angular/common";
import { PIDSymbol } from "../../../services/ui/pid-symbols.service";
import { ShapeManagerService } from "../../../services/ui/shape-manager.service";


type DrawMode = 'none' | 'rectangle' | 'symbol';
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

@Component({
  selector: 'app-interactive-image',
  standalone: true,
  imports: [CommonModule, SymbolPaletteComponent],
  templateUrl: './interactive-image.component.html',
  styleUrl: './interactive-image.component.css'
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
  shapesInput = input<Shape[]>([]);
  isEditEnabled = input<boolean>(false);


  shapes = this.shapeManager.shapes;
  selectedShapeIds = this.shapeManager.selectedShapeIds;
  singleSelectedShapeId = this.shapeManager.singleSelectedShapeId;

  private _zoomElement!: HTMLDivElement;
  private _zoomOuter!: HTMLDivElement;
  private _img!: HTMLImageElement;
  private _canvas!: HTMLCanvasElement;

  get zoomElement(): HTMLDivElement { return this._zoomElement; }
  get zoomOuter(): HTMLDivElement { return this._zoomOuter; }
  get img(): HTMLImageElement { return this._img; }
  get canvas(): HTMLCanvasElement { return this._canvas; }

  // Transform state
  private transformState: TransformState = {
    scale: 1,
    pointX: 0,
    pointY: 0
  };
  private zoomEndTimer: any = null;

  // Panning state
  private isPanning: boolean = false;
  private panStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private panStartTransform: TransformState = { scale: 1, pointX: 0, pointY: 0 };

  baseImageScale: number = 1;
  imageScale: number = 1;
  cursor: string = 'default';

//Shape Dragging state
  private isDraggingShape: boolean = false;
  private dragStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private draggedShapeIds: number[] = [];
  private initialShapePositions: Map<number, { x: number; y: number }> = new Map();

  // Shape Resizing state
  private isResizingShape: boolean = false;
  private resizeHandle: ResizeHandle | null = null;
  private resizeStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private resizingShapeId: number | null = null;
  private initialShapeBounds: { x: number; y: number; width: number; height: number } | null = null;




  private shapeIdToConvert: number | null = null;

  //Symbol palette
  showSymbolPalette = signal<boolean>(true);
  currentDrawMode = signal<DrawMode>('none');
  selectedSymbol = signal<PIDSymbol | null>(null);

  constructor() {
    // Effect to redraw canvas when shapes change
    effect(() => {
      const shapes = this.shapes();
      if (this.canvas && this.img) {
        this.updateCanvasAndRedraw();
      }
    });
  }

  ngOnDestroy() {
    this.drawingService.cleanup();
    this.canvasRenderService.clearImageCache();
  }

  ngAfterViewInit() {
    this._zoomElement = this.zoomElementRef.nativeElement;
    this._zoomOuter = this.zoomOuterRef.nativeElement;
    this._img = this.imgRef.nativeElement;
    this._canvas = this.canvasRef.nativeElement;

    // Initialize drawing service
    this.drawingService.initializeTempCanvas(this.zoomElement);

    // Calculate base scale once after image loads
    this.img.onload = () => {
      this.baseImageScale = this.canvasRenderService.calculateBaseScale(this.img);
      this.updateImageScale();
      this.updateCanvasAndRedraw();
      this.updateTempCanvasSize();
    };

    this.setupMouseEvents();
    this.setupKeyboardShortcuts();
  }

  private setupMouseEvents(): void {
    const mousedown$ = fromEvent<MouseEvent>(this.zoomElement, 'mousedown');

    this.mouseEventService.classifyClicks(mousedown$)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(classifiedEvent => {
        classifiedEvent.event.preventDefault();
        switch (classifiedEvent.type) {
          case 'single':
            this.onLeftClick(classifiedEvent.event);
            break;
          case 'double':
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
      .subscribe(event => event.preventDefault());
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

    this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0s');
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
      this.imageScale
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
  }

  onMouseDown(event: MouseEvent): void {
    // Right mouse button for drawing
    if (event.button === 2) {
      if(this.currentDrawMode()==='symbol'){
        this.placeSymbol(event);
        console.log('Placing Symbol');
        return;
      }else{
        event.preventDefault();
        this.startDrawing(event);
        return;
      }
    }

    // Left mouse button for panning
    if (event.button === 0) {
      // First check if clicking on a resize handle
      const handle = this.getResizeHandleAtPoint(event);
      if (handle) {
        event.preventDefault();
        this.startResizingShape(event, handle);
        return;
      }
    
      // Then check if clicking on a shape
      const clickedShapeId = this.isOverShape(event);
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
      event.preventDefault();
      this.startPanning(event);
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

    if (this.isPanning) {
      event.preventDefault();
      
      const currentPos = {
        x: event.clientX,
        y: event.clientY
      };

      const newPosition = this.zoomPanService.calculatePan(
        this.panStartPos,
        currentPos,
        this.panStartTransform
      );

      this.transformState = {
        ...this.transformState,
        pointX: newPosition.pointX,
        pointY: newPosition.pointY
      };

      // Apply transform immediately (CSS transform is fast)
      this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0s');
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

    if (this.isPanning) {
      this.stopPanning();
      // Update canvas once at the end
      this.updateCanvasAndRedraw();
    }
  }

  onLeftClick(event: MouseEvent): void {
    // Check if Ctrl (Windows/Linux) or Cmd (Mac) is held
    if (event.ctrlKey || event.metaKey) {
      this.handleShapeSelection(event);
    } else {
      console.log('Ctrl/Cmd key is NOT held');
      // Handle normal click behavior
    }

    
  }

  onMiddleClick(event: MouseEvent): void {
    console.log('middle click');
  }

  onRightClick(event: MouseEvent): void {
    event.preventDefault();
    
    // First check if we clicked on a shape
    const clickedShapeId = this.isOverShape(event);
    
    if (clickedShapeId !== null) {
      // Select the shape if not already selected
      if (!this.selectedShapeIds().includes(clickedShapeId)) {
        this.shapeManager.selectShape(clickedShapeId, true);
      }
      
      // Show context menu for shape operations
      this.showShapeContextMenu(event, clickedShapeId);
    }
  }

  onDoubleClick(event: MouseEvent): void {
    // console.log('double click');
    // // this.resetTransform();    
    //   this.handleShapeSelection(event);
    //   return;
  }

  // ==================================================Panning Methods==================================================

  
  private startPanning(event: MouseEvent): void {
    this.isPanning = true;
    this.panStartPos = {
      x: event.clientX,
      y: event.clientY
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
      pointY: 0
    };
    this.zoomPanService.applyTransform(this.zoomElement, this.transformState);
    this.updateImageScale();
    setTimeout(() => this.updateCanvasAndRedraw(), 300);
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
      this.shapeManager.getNextShapeId() // Changed from this.shapes().length + 1
    );

    if (newShape) {
      this.shapeManager.addShape(newShape); // Changed from this.shapes().push(newShape)
      // updateCanvasAndRedraw() will be called automatically by the effect
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
    if (!input.files || input.files.length === 0 || this.shapeIdToConvert === null) {
      return;
    }

    const file = input.files[0];
    
    if (!file.type.startsWith('image/')) {
      console.error('Please select an image file');
      return;
    }

    try {
      const currentShape = this.shapeManager.getShapeById(this.shapeIdToConvert);
      
      if (!currentShape) { // Changed
        console.error('Shape not found');
        return;
      }

      if (currentShape.type === 'rectangle') {
        const imageShape = await this.shapeConversionService.convertRectangleToImage(
          currentShape as RectangleShape,
          file
        );
        this.shapeManager.replaceShape(this.shapeIdToConvert, imageShape);
      } else if (currentShape.type === 'image') {
        const updatedShape = await this.shapeConversionService.updateImageForShape(
          currentShape as ImageShape,
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
      const rectangleShape = this.shapeConversionService.convertImageToRectangle(
        currentShape as ImageShape
      );
      this.shapeManager.replaceShape(shapeId, rectangleShape);
      console.log('Image converted back to rectangle');
    }
  }





// ==================================================Symbol Palette Methods==================================================
toggleSymbolPalette(): void {
  this.showSymbolPalette.update(show => !show);
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

// Update placeSymbol method (around line 492):
private placeSymbol(event: MouseEvent): void {
  const symbol = this.selectedSymbol();
  if (!symbol) return;

  const imgRect = this.img.getBoundingClientRect();
  
  // Convert client coordinates to image coordinates
  const relativeX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
  const relativeY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;

  const newSymbol = this.shapeManager.createSymbol( // Changed to use ShapeManager
    symbol,
    relativeX - (symbol.width / 2),
    relativeY - (symbol.height / 2),
    this.img.naturalWidth,
    this.img.naturalHeight
  );

  this.shapeManager.addShape(newSymbol); // Changed
  
  console.log('Symbol placed:', newSymbol);
}




//==================================================Shape Events==================================================

// Add method to handle shape selection (add after onLeftClick):
private handleShapeSelection(event: MouseEvent): void {

  const clickedShapeId = this.isOverShape(event)
  
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
  
  const imgRect = this.img.getBoundingClientRect();
  const hoverX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
  const hoverY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;
  
  const shapes = this.shapes();
  let isOverShape = false;
  
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    
    if (shape.type === 'rectangle' || shape.type === 'image' || shape.type === 'svg-symbol') {
      if (hoverX >= shape.x && hoverX <= shape.x + shape.width &&
          hoverY >= shape.y && hoverY <= shape.y + shape.height) {
        isOverShape = true;
        break;
      }
    }
  }
  
  this.cursor = isOverShape ? 'pointer' : 'default';
}

// Add keyboard shortcuts for shape operations (add in ngAfterViewInit):
private setupKeyboardShortcuts(): void {
  fromEvent<KeyboardEvent>(document, 'keydown')
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(event => {
      // Delete selected shapes with Delete or Backspace
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedIds = this.selectedShapeIds();
        if (selectedIds.length > 0) {
          event.preventDefault();
          this.shapeManager.deleteShapes(selectedIds);
          console.log('Deleted shapes:', selectedIds);
        }
      }
      
      // Select all with Ctrl+A
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        const allShapeIds = this.shapes().map(s => s.id);
        this.shapeManager.selectMultipleShapes(allShapeIds);
        console.log('Selected all shapes');
      }
      
      // Deselect all with Escape
      if (event.key === 'Escape') {
        this.shapeManager.clearSelections();
        this.currentDrawMode.set('none');
        this.selectedSymbol.set(null);
        this.cursor = 'default';
      }
      
      // Copy selected shapes with Ctrl+C
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        const selectedShapes = this.shapeManager.getSelectedShapes();
        if (selectedShapes.length > 0) {
          event.preventDefault();
          // Store in clipboard or component state
          console.log('Copied shapes:', selectedShapes);
        }
      }
    });
}

// Add a method to show context menu (add after handleShapeSelection):
private showShapeContextMenu(event: MouseEvent, shapeId: number): void {
  const shape = this.shapeManager.getShapeById(shapeId);
  if (!shape) return;
  
  console.log('Context menu for shape:', shape);
  
  // TODO: Implement actual context menu UI
  // For now, just log available actions
  const actions = [];
  
  if (shape.type === 'rectangle') {
    actions.push('Convert to Image');
  } else if (shape.type === 'image') {
    actions.push('Change Image', 'Convert to Rectangle');
  }
  
  actions.push('Delete', 'Duplicate', 'Bring to Front', 'Send to Back');
  
  console.log('Available actions:', actions);
}

private isOverShape(event: MouseEvent){
    const imgRect = this.img.getBoundingClientRect();
    const clickX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
    const clickY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;
    
    const shapes = this.shapes();
    let clickedShapeId: number | null = null;
    
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      
      if (shape.type === 'rectangle' || shape.type === 'image' || shape.type === 'svg-symbol') {
        if (clickX >= shape.x && clickX <= shape.x + shape.width &&
            clickY >= shape.y && clickY <= shape.y + shape.height) {
          clickedShapeId = shape.id;
          break;
        }
      }
    }
    return clickedShapeId;
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
    x: (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale,
    y: (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale
  };
  
  // Store initial positions of all selected shapes
  this.initialShapePositions.clear();
  this.draggedShapeIds.forEach(shapeId => {
    const shape = this.shapeManager.getShapeById(shapeId);
    if (shape && (shape.type === 'rectangle' || shape.type === 'image' || shape.type === 'svg-symbol')) {
      this.initialShapePositions.set(shapeId, { x: shape.x, y: shape.y });
    }
  });
  
  this.cursor = 'move';
}

private updateDraggingShape(event: MouseEvent): void {
  if (!this.isDraggingShape) return;
  
  const imgRect = this.img.getBoundingClientRect();
  const currentX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
  const currentY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;
  
  const deltaX = currentX - this.dragStartPos.x;
  const deltaY = currentY - this.dragStartPos.y;
  
  // Update positions of all dragged shapes
  this.draggedShapeIds.forEach(shapeId => {
    const initialPos = this.initialShapePositions.get(shapeId);
    if (initialPos) {
      this.shapeManager.updateShape(shapeId, {
        x: initialPos.x + deltaX,
        y: initialPos.y + deltaY
      });
    }
  });
  
  // Canvas will be redrawn automatically by the effect
}

private stopDraggingShape(): void {
  this.isDraggingShape = false;
  this.draggedShapeIds = [];
  this.initialShapePositions.clear();
  this.cursor = 'default';
}


// ========================================Shape Resizing================================
private startResizingShape(event: MouseEvent, handle: ResizeHandle): void {
  const singleSelectedId = this.singleSelectedShapeId();
  if (singleSelectedId === null) return;
  
  const shape = this.shapeManager.getShapeById(singleSelectedId);
  if (!shape || (shape.type !== 'rectangle' && shape.type !== 'image' && shape.type !== 'svg-symbol')) {
    return;
  }
  
  this.isResizingShape = true;
  this.resizeHandle = handle;
  this.resizingShapeId = singleSelectedId;
  
  const imgRect = this.img.getBoundingClientRect();
  this.resizeStartPos = {
    x: (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale,
    y: (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale
  };
  
  this.initialShapeBounds = {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height
  };
  
  this.cursor = this.getResizeCursor(handle);
}

private updateResizingShape(event: MouseEvent): void {
  if (!this.isResizingShape || !this.resizeHandle || this.resizingShapeId === null || !this.initialShapeBounds) {
    return;
  }
  
  const imgRect = this.img.getBoundingClientRect();
  const currentX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
  const currentY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;
  
  const deltaX = currentX - this.resizeStartPos.x;
  const deltaY = currentY - this.resizeStartPos.y;
  
  const newBounds = this.calculateNewBounds(
    this.initialShapeBounds,
    this.resizeHandle,
    deltaX,
    deltaY
  );
  
  // Apply minimum size constraint
  const minSize = 10;
  if (newBounds.width < minSize || newBounds.height < minSize) {
    return;
  }
  
  this.shapeManager.updateShape(this.resizingShapeId, newBounds);
}

private stopResizingShape(): void {
  this.isResizingShape = false;
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
  if (!shape || (shape.type !== 'rectangle' && shape.type !== 'image' && shape.type !== 'svg-symbol')) {
    return null;
  }
  
  const imgRect = this.img.getBoundingClientRect();
  const mouseX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
  const mouseY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;
  
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
    'nw': { x: x - halfHandle, y: y - halfHandle },
    'n': { x: x + width / 2 - halfHandle, y: y - halfHandle },
    'ne': { x: x + width - halfHandle, y: y - halfHandle },
    'e': { x: x + width - halfHandle, y: y + height / 2 - halfHandle },
    'se': { x: x + width - halfHandle, y: y + height - halfHandle },
    's': { x: x + width / 2 - halfHandle, y: y + height - halfHandle },
    'sw': { x: x - halfHandle, y: y + height - halfHandle },
    'w': { x: x - halfHandle, y: y + height / 2 - halfHandle }
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
    'nw': 'nw-resize',
    'n': 'n-resize',
    'ne': 'ne-resize',
    'e': 'e-resize',
    'se': 'se-resize',
    's': 's-resize',
    'sw': 'sw-resize',
    'w': 'w-resize'
  };
  return cursorMap[handle];
}

private updateCursorForResize(event: MouseEvent): void {
  const handle = this.getResizeHandleAtPoint(event);
  if (handle) {
    this.cursor = this.getResizeCursor(handle);
  }
}







  }
