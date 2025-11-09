import { Component, DestroyRef, ElementRef, inject, input, ViewChild } from "@angular/core";
import { fromEvent } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Shape } from "../../../models/ui/shape.model";
import { MouseEventsService } from "../../../services/ui/mouse-events.service";
import { TransformState, ZoomPanService } from "../../../services/ui/zoom-pan.service";
import { CanvasRenderService } from "../../../services/ui/canvas-render.service";

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

  imageUrl = input<string>();
  imageName = input<string>();
  shapes = input<Shape[]>([]);
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

  imageScale: number = 1;
  cursor: string = 'default';

  ngAfterViewInit() {
    this._zoomElement = this.zoomElementRef.nativeElement;
    this._zoomOuter = this.zoomOuterRef.nativeElement;
    this._img = this.imgRef.nativeElement;
    this._canvas = this.canvasRef.nativeElement;

    this.setupMouseEvents();
  }

  private setupMouseEvents(): void {
    // Use zoomElement for mouse events since that's where they're bound in template
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

    setTimeout(() => this.onZoomEnd(), 100);
  }

  private onZoomEnd(): void {
    this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0s');
    this.updateCanvasAndRedraw();
  }

  private updateImageScale(): void {
    this.imageScale = this.canvasRenderService.calculateScale(this.img);
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

  // Panning and Click Events
  onMouseLeave(event: MouseEvent): void {
    if (this.isPanning) {
      this.stopPanning();
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isPanning) {
      return;
    }

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

  onMouseDown(event: MouseEvent): void {
    console.log('Mouse down - button:', event.button);
    
    // Middle mouse button (1) or right mouse button (2) for panning
    if (event.button === 0) {
      event.preventDefault();
      this.startPanning(event);
      return;
    }

    // Left click with modifier keys for panning
    if (event.button === 0 && (event.shiftKey || event.ctrlKey)) {
      event.preventDefault();
      this.startPanning(event);
      return;
    }
  }

  onLeftClick(event: MouseEvent): void {
    console.log('left click');
    // Handle shape selection or other left click actions here
  }

  onMiddleClick(event: MouseEvent): void {
    console.log('middle click');
    // Already handled in onMouseDown
  }

  onRightClick(event: MouseEvent): void {
    console.log('right click');
    // Already handled in onMouseDown
  }

  onDoubleClick(event: MouseEvent): void {
    console.log('double click');
    // Optionally reset zoom/pan on double click
    this.resetTransform();
  }

  onMouseUp(event: MouseEvent): void {
    if (this.isPanning) {
      this.stopPanning();
      this.updateCanvasAndRedraw();
    }
  }

  private startPanning(event: MouseEvent): void {
    console.log('Starting pan');
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
    this.zoomPanService.applyTransform(this.zoomElement, this.transformState, '0.3s');
    setTimeout(() => this.updateCanvasAndRedraw(), 300);
  }
}
