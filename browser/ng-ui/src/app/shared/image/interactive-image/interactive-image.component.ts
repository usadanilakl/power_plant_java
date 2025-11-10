
import { Component, DestroyRef, ElementRef, inject, input, signal, ViewChild } from "@angular/core";
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


type DrawMode = 'none' | 'rectangle' | 'symbol';

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
  
  testShapes: Shape[] = [
    {
      id: 1,
      type: 'rectangle',
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      color: '#FF0000',
      originalPictureWidth: 1920,
      originalPictureHeight: 1080,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: 1920,
      currentImgHeigth: 1080,
      scaleToCurrentImage: 1
    },
    {
      id: 2,
      type: 'rectangle',
      x: 300,
      y: 200,
      width: 150,
      height: 100,
      color: '#00FF00',
      originalPictureWidth: 1920,
      originalPictureHeight: 1080,
      isSelected: true,
      isBulkSelected: false,
      currentImgWidth: 1920,
      currentImgHeigth: 1080,
      scaleToCurrentImage: 1
    },
    {
      id: 3,
      type: 'rectangle',
      x: 500,
      y: 100,
      width: 180,
      height: 120,
      color: '#0000FF',
      originalPictureWidth: 1920,
      originalPictureHeight: 1080,
      isSelected: false,
      isBulkSelected: true,
      currentImgWidth: 1920,
      currentImgHeigth: 1080,
      scaleToCurrentImage: 1
    },
    {
      id: 4,
      type: 'rectangle',
      x: 100,
      y: 300,
      width: 250,
      height: 80,
      color: '#FFA500',
      originalPictureWidth: 1920,
      originalPictureHeight: 1080,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: 1920,
      currentImgHeigth: 1080,
      scaleToCurrentImage: 1
    }
  ];

  imageUrl = input<string>();
  imageName = input<string>();
  shapes = input<Shape[]>(this.testShapes);
  selectedShapeIds = input<number[]>([]);
  singleSelectedShapeId = input<number | null>();
  isEditEnabled = input<boolean>(false);

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
  private panAnimationFrame: number | null = null;
  private needsCanvasUpdate: boolean = false;

  baseImageScale: number = 1;
  imageScale: number = 1;
  cursor: string = 'default';


  private shapeIdToConvert: number | null = null;

  //Symbol palette
  showSymbolPalette = signal<boolean>(true);
  currentDrawMode = signal<DrawMode>('none');
  selectedSymbol = signal<PIDSymbol | null>(null);

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

  // Zooming Events

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
      this.testShapes,
      this.imageScale
    );
  }

  
  private updateTempCanvasSize(): void {
    this.drawingService.updateTempCanvasSize(this.img, this.baseImageScale);
  }

  // Mouse Event Handlers

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
      event.preventDefault();
      this.startDrawing(event);
      return;
    }

    // Left mouse button for panning
    if (event.button === 0) {
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
  }

  onMouseUp(event: MouseEvent): void {
    if (this.drawingService.isDrawing()) {
      this.finishDrawing(event);
      return;
    }

    if (this.isPanning) {
      this.stopPanning();
      // Update canvas once at the end
      this.updateCanvasAndRedraw();
    }
  }

  onLeftClick(event: MouseEvent): void {
  // Handle symbol placement in symbol mode
    if (this.currentDrawMode() === 'symbol') {
      this.placeSymbol(event);
      return;
    }
  }

  onMiddleClick(event: MouseEvent): void {
    console.log('middle click');
  }

  onRightClick(event: MouseEvent): void {
    console.log('right click');
  }

  onDoubleClick(event: MouseEvent): void {
    console.log('double click');
    this.resetTransform();
  }

  // Panning Methods

  
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
  
    
    
  // Drawing Methods
  
  private startDrawing(event: MouseEvent): void {
    const imgRect = this.img.getBoundingClientRect();
    this.drawingService.startDrawing(
      event.clientX,
      event.clientY,
      imgRect,
      this.baseImageScale, // Pass baseImageScale, not imageScale
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
      this.testShapes.length + 1
    );
  
    if (newShape) {
      this.testShapes.push(newShape);
      this.updateCanvasAndRedraw();
    }
  
    this.cursor = 'default';
  }




//Image Shape Methods
convertShapeToImage(shapeId: number): void {
  this.shapeIdToConvert = shapeId;
  this.shapeImageInput.nativeElement.click();
}

// Handle image selection for shape conversion

async onShapeImageSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0 || this.shapeIdToConvert === null) {
    return;
  }

  const file = input.files[0];
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    console.error('Please select an image file');
    return;
  }

  try {
    const shapeIndex = this.testShapes.findIndex(s => s.id === this.shapeIdToConvert);
    
    if (shapeIndex === -1) {
      console.error('Shape not found');
      return;
    }

    const currentShape = this.testShapes[shapeIndex];
    
    if (currentShape.type === 'rectangle') {
      // Convert rectangle to image
      const imageShape = await this.shapeConversionService.convertRectangleToImage(
        currentShape as RectangleShape,
        file
      );
      this.testShapes[shapeIndex] = imageShape;
    } else if (currentShape.type === 'image') {
      // Update existing image
      const updatedShape = await this.shapeConversionService.updateImageForShape(
        currentShape as ImageShape,
        file
      );
      this.testShapes[shapeIndex] = updatedShape;
    }

    this.updateCanvasAndRedraw();
    console.log('Shape converted to image successfully');
  } catch (error) {
    console.error('Failed to convert shape to image:', error);
  } finally {
    this.shapeIdToConvert = null;
    input.value = '';
  }
}

// Add method to convert image back to rectangle
convertImageToRectangle(shapeId: number): void {
  const shapeIndex = this.testShapes.findIndex(s => s.id === shapeId);
  
  if (shapeIndex === -1) {
    console.error('Shape not found');
    return;
  }

  const currentShape = this.testShapes[shapeIndex];
  
  if (currentShape.type === 'image') {
    const rectangleShape = this.shapeConversionService.convertImageToRectangle(
      currentShape as ImageShape
    );
    this.testShapes[shapeIndex] = rectangleShape;
    this.updateCanvasAndRedraw();
    console.log('Image converted back to rectangle');
  }
}

// Add method to get shape by ID (useful for context menu)
getShapeById(shapeId: number): Shape | undefined {
  return this.testShapes.find(s => s.id === shapeId);
}





// Symbol Palette Methods
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

private placeSymbol(event: MouseEvent): void {
  const symbol = this.selectedSymbol();
  if (!symbol) return;

  const imgRect = this.img.getBoundingClientRect();
  
  // Use the drawing service's coordinate conversion method
  const { x, y } = this.drawingService.clientToImageCoords(
    event.clientX,
    event.clientY,
    imgRect,
    this.baseImageScale,
    this.transformState
  );

  const newSymbol: SVGSymbolShape = {
    id: this.testShapes.length + 1,
    type: 'svg-symbol',
    symbolId: symbol.id,
    svgPath: symbol.svgPath,
    x: x - (symbol.width / 2), // Center the symbol on click point
    y: y - (symbol.height / 2),
    width: symbol.width,
    height: symbol.height,
    color: '#000000',
    rotation: 0,
    originalPictureWidth: this.img.naturalWidth,
    originalPictureHeight: this.img.naturalHeight,
    isSelected: false,
    isBulkSelected: false,
    currentImgWidth: this.img.naturalWidth,
    currentImgHeigth: this.img.naturalHeight,
    scaleToCurrentImage: 1
  };

  this.testShapes.push(newSymbol);
  this.updateCanvasAndRedraw();
  
  console.log('Symbol placed:', newSymbol);
}





  }
