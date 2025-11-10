
import { Component, DestroyRef, ElementRef, inject, input, ViewChild } from "@angular/core";
import { fromEvent } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RectangleShape, Shape } from "../../../models/ui/shape.model";
import { MouseEventsService } from "../../../services/ui/mouse-events.service";
import { TransformState, ZoomPanService } from "../../../services/ui/zoom-pan.service";
import { CanvasRenderService } from "../../../services/ui/canvas-render.service";
import { DrawingService } from "../../../services/ui/drawing.service";

@Component({
  selector: 'app-interactive-image',
  standalone: true,
  imports: [],
  templateUrl: './interactive-image.component.html',
  styleUrl: './interactive-image.component.css'
})
export class InteractiveImageComponent {
  @ViewChild('imageContainer') imageContainer!: ElementRef<HTMLDivElement>;  
  @ViewChild('zoomElement') private zoomElementRef!: ElementRef<HTMLDivElement>;
  @ViewChild('zoomOuter') private zoomOuterRef!: ElementRef<HTMLDivElement>;
  @ViewChild('imageElement') private imgRef!: ElementRef<HTMLImageElement>;
  @ViewChild('canvasElement') private canvasRef!: ElementRef<HTMLCanvasElement>;

  private mouseEventService = inject(MouseEventsService);
  private destroyRef = inject(DestroyRef);
  private zoomPanService = inject(ZoomPanService);
  private canvasRenderService = inject(CanvasRenderService);
  private drawingService = inject(DrawingService);
  
  testShapes: RectangleShape[] = [
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

  // Panning state
  private isPanning: boolean = false;
  private panStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private panStartTransform: TransformState = { scale: 1, pointX: 0, pointY: 0 };

  baseImageScale: number = 1;
  imageScale: number = 1;
  cursor: string = 'default';

  ngOnDestroy() {
    this.drawingService.cleanup();
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

    this.zoomPanService.applyTransform(this.zoomElement, this.transformState);
    this.updateImageScale();
    this.updateTempCanvasSize();

    setTimeout(() => this.onZoomEnd(), 100);
  }

  private onZoomEnd(): void {
    this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0s');
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
      this.updateCanvasAndRedraw();
    }
  }

  onLeftClick(event: MouseEvent): void {
    console.log('left click');
    // Handle shape selection or other left click actions here
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
  }

  private stopPanning(): void {
    console.log('Stopping pan');
    this.isPanning = false;
    this.cursor = 'default';
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
        this.baseImageScale, // Pass baseImageScale, not imageScale
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
  }
