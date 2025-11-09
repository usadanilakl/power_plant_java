
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

    this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0.1s');
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
    const imgRect = this.img.getBoundingClientRect();
    this.drawingService.updateTempCanvasSize(imgRect);
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
        this.imageScale,
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
        this.imageScale,
        this.transformState
      );
    }
    
    private finishDrawing(event: MouseEvent): void {
      const imgRect = this.img.getBoundingClientRect();
      const newShape = this.drawingService.finishDrawing(
        event.clientX,
        event.clientY,
        imgRect,
        this.imageScale,
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


// import { Component, DestroyRef, ElementRef, inject, input, ViewChild } from "@angular/core";
// import { fromEvent } from "rxjs";
// import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
// import { RectangleShape, Shape } from "../../../models/ui/shape.model";
// import { MouseEventsService } from "../../../services/ui/mouse-events.service";
// import { TransformState, ZoomPanService } from "../../../services/ui/zoom-pan.service";
// import { CanvasRenderService } from "../../../services/ui/canvas-render.service";

// @Component({
//   selector: 'app-interactive-image',
//   standalone: true,
//   imports: [],
//   templateUrl: './interactive-image.component.html',
//   styleUrl: './interactive-image.component.css'
// })
// export class InteractiveImageComponent {
//   @ViewChild('imageContainer') imageContainer!: ElementRef<HTMLDivElement>;  
//   @ViewChild('zoomElement') private zoomElementRef!: ElementRef<HTMLDivElement>;
//   @ViewChild('zoomOuter') private zoomOuterRef!: ElementRef<HTMLDivElement>;
//   @ViewChild('imageElement') private imgRef!: ElementRef<HTMLImageElement>;
//   @ViewChild('canvasElement') private canvasRef!: ElementRef<HTMLCanvasElement>;

//   private mouseEventService = inject(MouseEventsService);
//   private destroyRef = inject(DestroyRef);
//   private zoomPanService = inject(ZoomPanService);
//   private canvasRenderService = inject(CanvasRenderService);
  
//     testShapes: RectangleShape[] = [
//       {
//         id: 1,
//         type: 'rectangle',
//         x: 50,
//         y: 50,
//         width: 200,
//         height: 150,
//         color: '#FF0000',
//         originalPictureWidth: 1920,
//         originalPictureHeight: 1080,
//         isSelected: false,
//         isBulkSelected: false,
//         currentImgWidth: 1920,
//         currentImgHeigth: 1080,
//         scaleToCurrentImage: 1
//       },
//       {
//         id: 2,
//         type: 'rectangle',
//         x: 300,
//         y: 200,
//         width: 150,
//         height: 100,
//         color: '#00FF00',
//         originalPictureWidth: 1920,
//         originalPictureHeight: 1080,
//         isSelected: true,
//         isBulkSelected: false,
//         currentImgWidth: 1920,
//         currentImgHeigth: 1080,
//         scaleToCurrentImage: 1
//       },
//       {
//         id: 3,
//         type: 'rectangle',
//         x: 500,
//         y: 100,
//         width: 180,
//         height: 120,
//         color: '#0000FF',
//         originalPictureWidth: 1920,
//         originalPictureHeight: 1080,
//         isSelected: false,
//         isBulkSelected: true,
//         currentImgWidth: 1920,
//         currentImgHeigth: 1080,
//         scaleToCurrentImage: 1
//       },
//       {
//         id: 4,
//         type: 'rectangle',
//         x: 100,
//         y: 300,
//         width: 250,
//         height: 80,
//         color: '#FFA500',
//         originalPictureWidth: 1920,
//         originalPictureHeight: 1080,
//         isSelected: false,
//         isBulkSelected: false,
//         currentImgWidth: 1920,
//         currentImgHeigth: 1080,
//         scaleToCurrentImage: 1
//       }
//     ]

//   imageUrl = input<string>();
//   imageName = input<string>();
//   shapes = input<Shape[]>(this.testShapes);
//   selectedShapeIds = input<number[]>([]);
//   singleSelectedShapeId = input<number | null>();
//   isEditEnabled = input<boolean>(false);

//   private _zoomElement!: HTMLDivElement;
//   private _zoomOuter!: HTMLDivElement;
//   private _img!: HTMLImageElement;
//   private _canvas!: HTMLCanvasElement;

//   get zoomElement(): HTMLDivElement { return this._zoomElement; }
//   get zoomOuter(): HTMLDivElement { return this._zoomOuter; }
//   get img(): HTMLImageElement { return this._img; }
//   get canvas(): HTMLCanvasElement { return this._canvas; }

//   // Transform state
//   private transformState: TransformState = {
//     scale: 1,
//     pointX: 0,
//     pointY: 0
//   };
  

//   // Panning state
//   private isPanning: boolean = false;
//   private panStartPos: { x: number; y: number } = { x: 0, y: 0 };
//   private panStartTransform: TransformState = { scale: 1, pointX: 0, pointY: 0 };

//   baseImageScale: number = 1; // Base scale without zoom
//   imageScale: number = 1;
//   cursor: string = 'default';

//     // Drawing state
//   private isDrawing: boolean = false;
//   private drawStartPos: { x: number; y: number } = { x: 0, y: 0 };
//   private currentDrawingShape: RectangleShape | null = null;
//   private tempCanvas: HTMLCanvasElement | null = null;

//   ngOnDestroy() {
//     // Clean up temp canvas
//     if (this.tempCanvas && this.tempCanvas.parentElement) {
//       this.tempCanvas.parentElement.removeChild(this.tempCanvas);
//     }
//   }



//   ngAfterViewInit() {
//     this._zoomElement = this.zoomElementRef.nativeElement;
//     this._zoomOuter = this.zoomOuterRef.nativeElement;
//     this._img = this.imgRef.nativeElement;
//     this._canvas = this.canvasRef.nativeElement;

//     // Create temporary canvas for drawing preview
//     this.tempCanvas = document.createElement('canvas');
//     this.tempCanvas.style.position = 'absolute';
//     this.tempCanvas.style.top = '0';
//     this.tempCanvas.style.left = '0';
//     this.tempCanvas.style.pointerEvents = 'none';
//     this.zoomElement.appendChild(this.tempCanvas);

//     // Calculate base scale once after image loads
//     this.img.onload = () => {
//       this.baseImageScale = this.canvasRenderService.calculateBaseScale(this.img);
//       this.updateImageScale();
//       this.updateCanvasAndRedraw();
//       this.updateTempCanvasSize();
//     };

//     this.setupMouseEvents();
//   }

//   private setupMouseEvents(): void {
//     // Use zoomElement for mouse events since that's where they're bound in template
//     const mousedown$ = fromEvent<MouseEvent>(this.zoomElement, 'mousedown');

//     this.mouseEventService.classifyClicks(mousedown$)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(classifiedEvent => {
//         classifiedEvent.event.preventDefault();
//         switch (classifiedEvent.type) {
//           case 'single':
//             this.onLeftClick(classifiedEvent.event);
//             break;
//           case 'double':
//             this.onDoubleClick(classifiedEvent.event);
//             break;
//           case 'middle':
//             this.onMiddleClick(classifiedEvent.event);
//             break;
//           case 'right':
//             this.onRightClick(classifiedEvent.event);
//             break;
//         }
//       });
    
//     fromEvent<MouseEvent>(this.zoomElement, 'contextmenu')
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(event => event.preventDefault());
//   }

//   // Zooming Events
//   onWheel(event: WheelEvent): void {
//     event.preventDefault();
    
//     const zoomOuterRect = this.zoomOuter.getBoundingClientRect();
//     const imageRect = this.zoomElement.getBoundingClientRect();

//     this.transformState = this.zoomPanService.calculateZoom(
//       event,
//       this.transformState,
//       zoomOuterRect,
//       imageRect
//     );

//     this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0.1s');
//     this.updateImageScale();
//     this.updateTempCanvasSize(); // Update temp canvas size on zoom

//     setTimeout(() => this.onZoomEnd(), 100);
//   }

//   private onZoomEnd(): void {
//     this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0s');
//     this.updateCanvasAndRedraw();
//   }

//   private updateImageScale(): void {
//     // Combine base scale with zoom scale
//     this.imageScale = this.baseImageScale * this.transformState.scale;
//   }

//   private updateCanvasAndRedraw(): void {
//     if (!this.canvas) {
//       console.error('Canvas not available for size update');
//       return;
//     }

//     this.canvasRenderService.updateCanvasSize(this.canvas, this.img);
//     this.canvasRenderService.drawShapes(
//       this.canvas,
//       this.testShapes,
//       this.imageScale
//     );
//   }

//   private updateTempCanvasSize(): void {
//     if (!this.tempCanvas) return;
//     const imgRect = this.img.getBoundingClientRect();
//     this.tempCanvas.width = imgRect.width;
//     this.tempCanvas.height = imgRect.height;
//   }

//   // Panning and Click Events

//   onMouseLeave(event: MouseEvent): void {
//     if (this.isDrawing) {
//       this.cancelDrawing();
//     }
//     if (this.isPanning) {
//       this.stopPanning();
//     }
//   }

//   // onMouseMove(event: MouseEvent): void {
//   //   if (!this.isPanning) {
//   //     return;
//   //   }

//   //   event.preventDefault();
    
//   //   const currentPos = {
//   //     x: event.clientX,
//   //     y: event.clientY
//   //   };

//   //   const newPosition = this.zoomPanService.calculatePan(
//   //     this.panStartPos,
//   //     currentPos,
//   //     this.panStartTransform
//   //   );

//   //   this.transformState = {
//   //     ...this.transformState,
//   //     pointX: newPosition.pointX,
//   //     pointY: newPosition.pointY
//   //   };

//   //   this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0s');
//   //   this.cursor = 'grabbing';
//   // }

//   onMouseDown(event: MouseEvent): void {
//     // Right mouse button for drawing
//     if (event.button === 2) {
//       event.preventDefault();
//       this.startDrawing(event);
//       return;
//     }

//     // Left mouse button for panning
//     if (event.button === 0) {
//       event.preventDefault();
//       this.startPanning(event);
//       return;
//     }
//   }

//   onMouseMove(event: MouseEvent): void {
//     if (this.isDrawing) {
//       event.preventDefault();
//       this.updateDrawing(event);
//       return;
//     }

//     if (this.isPanning) {
//       event.preventDefault();
      
//       const currentPos = {
//         x: event.clientX,
//         y: event.clientY
//       };

//       const newPosition = this.zoomPanService.calculatePan(
//         this.panStartPos,
//         currentPos,
//         this.panStartTransform
//       );

//       this.transformState = {
//         ...this.transformState,
//         pointX: newPosition.pointX,
//         pointY: newPosition.pointY
//       };

//       this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0s');
//       this.cursor = 'grabbing';
//     }
//   }

//   onLeftClick(event: MouseEvent): void {
//     console.log('left click');
//     // Handle shape selection or other left click actions here
//   }

//   onMiddleClick(event: MouseEvent): void {
//     console.log('middle click');
//     // Already handled in onMouseDown
//   }

//   onRightClick(event: MouseEvent): void {
//     console.log('right click');
//     // Already handled in onMouseDown
//   }

//   onDoubleClick(event: MouseEvent): void {
//     console.log('double click');
//     // Optionally reset zoom/pan on double click
//     this.resetTransform();
//   }

//   onMouseUp(event: MouseEvent): void {
//     if (this.isDrawing) {
//       this.finishDrawing(event);
//       return;
//     }

//     if (this.isPanning) {
//       this.stopPanning();
//       this.updateCanvasAndRedraw();
//     }
//   }

//   private startPanning(event: MouseEvent): void {
//     this.isPanning = true;
//     this.panStartPos = {
//       x: event.clientX,
//       y: event.clientY
//     };
//     this.panStartTransform = { ...this.transformState };
//     this.cursor = 'grabbing';
//   }

//   private stopPanning(): void {
//     console.log('Stopping pan');
//     this.isPanning = false;
//     this.cursor = 'default';
//   }

//   private resetTransform(): void {
//     this.transformState = {
//       scale: 1,
//       pointX: 0,
//       pointY: 0
//     };
//     this.zoomPanService.applyTransform(this.zoomElement, this.transformState);
//     setTimeout(() => this.updateCanvasAndRedraw(), 300);
//   }




  

//   private startDrawing(event: MouseEvent): void {
//     this.isDrawing = true;
    
//     // Get coordinates relative to the image
//     const imgRect = this.img.getBoundingClientRect();
//     const x = (event.clientX - imgRect.left) / this.imageScale;
//     const y = (event.clientY - imgRect.top) / this.imageScale;
    
//     this.drawStartPos = { x, y };
//     this.cursor = 'crosshair';
    
//     console.log('Started drawing at:', { x, y });
//   }

//   private updateDrawing(event: MouseEvent): void {
//     if (!this.isDrawing || !this.tempCanvas) return;

//     const imgRect = this.img.getBoundingClientRect();
//     const currentX = (event.clientX - imgRect.left) / this.imageScale;
//     const currentY = (event.clientY - imgRect.top) / this.imageScale;

//     // Calculate rectangle dimensions
//     const x = Math.min(this.drawStartPos.x, currentX);
//     const y = Math.min(this.drawStartPos.y, currentY);
//     const width = Math.abs(currentX - this.drawStartPos.x);
//     const height = Math.abs(currentY - this.drawStartPos.y);

//     // Draw preview on temp canvas
//     const ctx = this.tempCanvas.getContext('2d');
//     if (!ctx) return;

//     // Clear previous preview
//     ctx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);

//     // Draw preview rectangle
//     ctx.strokeStyle = '#FF0000';
//     ctx.lineWidth = 2 / this.imageScale;
//     ctx.setLineDash([5 / this.imageScale, 5 / this.imageScale]);
    
//     // Scale coordinates to canvas
//     const scaledX = x * this.imageScale;
//     const scaledY = y * this.imageScale;
//     const scaledWidth = width * this.imageScale;
//     const scaledHeight = height * this.imageScale;
    
//     ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
//   }

//   private finishDrawing(event: MouseEvent): void {
//     if (!this.isDrawing) return;

//     const imgRect = this.img.getBoundingClientRect();
//     const currentX = (event.clientX - imgRect.left) / this.imageScale;
//     const currentY = (event.clientY - imgRect.top) / this.imageScale;

//     // Calculate final rectangle dimensions
//     const x = Math.min(this.drawStartPos.x, currentX);
//     const y = Math.min(this.drawStartPos.y, currentY);
//     const width = Math.abs(currentX - this.drawStartPos.x);
//     const height = Math.abs(currentY - this.drawStartPos.y);

//     // Only create shape if it has meaningful size
//     if (width > 5 && height > 5) {
//       const newShape: RectangleShape = {
//         id: this.testShapes.length + 1,
//         type: 'rectangle',
//         x,
//         y,
//         width,
//         height,
//         color: '#FF0000',
//         originalPictureWidth: this.img.naturalWidth,
//         originalPictureHeight: this.img.naturalHeight,
//         isSelected: false,
//         isBulkSelected: false,
//         currentImgWidth: this.img.naturalWidth,
//         currentImgHeigth: this.img.naturalHeight,
//         scaleToCurrentImage: 1
//       };

//       this.testShapes.push(newShape);
//       console.log('Created new shape:', newShape);
      
//       // Redraw canvas with new shape
//       this.updateCanvasAndRedraw();
//     }

//     this.cancelDrawing();
//   }

//   private cancelDrawing(): void {
//     this.isDrawing = false;
//     this.cursor = 'default';
    
//     // Clear temp canvas
//     if (this.tempCanvas) {
//       const ctx = this.tempCanvas.getContext('2d');
//       ctx?.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
//     }
//   }
// }
