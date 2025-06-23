import { AfterViewInit, Component, DestroyRef, ElementRef, inject, input, OnDestroy, output, ViewChild } from '@angular/core';
import { CircleShape, LineShape, RectangleShape, Shape, TextShape } from '../../../models/shape.model';
import { DrawUtilService } from '../image-services/draw-util.service';
import { ShapeFactoryService } from '../image-services/shape-factory.service';
import { ShapeUtilService } from '../image-services/shape-util.service';
import { Observable, Subscription } from 'rxjs';
import { EquipmentDto } from '../../../models/equipment/equipment.model';

@Component({
  selector: 'app-image-zoom-interactive',
  imports: [],
  templateUrl: './image-zoom-interactive.component.html',
  styleUrl: './image-zoom-interactive.component.css'
})
export class ImageZoomInteractiveComponent implements AfterViewInit {
  imageUrl = input<string>()
  imageName = input<string>()
  elements = input.required<Observable<EquipmentDto[]>>();

  newShapeCreated = output<Shape | null>()
  shapeSelected = output<Shape | null>()

  private shapeFactory = inject(ShapeFactoryService);
  private shapeUtil = inject(ShapeUtilService);
  private drawingService: DrawUtilService;
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.drawingService = new DrawUtilService(this.shapeFactory, this.shapeUtil);
  }

//Subscriptions  
    private shapesSubscription!: Subscription;
    private cursorSubscription!: Subscription;
    private elementsSubscription: Subscription | undefined;
    private newShapeSubscription!: Subscription;
    private selectedShapeSubscription!: Subscription;

//Zooming and panning functionality variables
  private scale: number = 1;
  private panning: boolean = false;
  private pointX: number = 0;
  private pointY: number = 0;
  private start: { x: number, y: number } = { x: 0, y: 0 };

  private lastX: number = 0;
  private lastY: number = 0;
  cursor: string = 'default';

//Click functionality variables
  private clickTimeout: any;
  private isDoubleClick: boolean = false;
  private lastClickTime: number = 0;
  private readonly DOUBLE_CLICK_DELAY = 200; // milliseconds

//Shape/Image functionality variables
  private shapes: Shape[] = [];
  pictureOriginalWidth = 0;
  pictureOriginalHeight = 0;
  pictureCurrentWidth = 0;
  pictureCurrentHeight = 0;
  imageScale: number = 1;


  @ViewChild('zoomElement') private zoomElementRef!: ElementRef<HTMLDivElement>;
  @ViewChild('zoomOuter') private zoomOuterRef!: ElementRef<HTMLDivElement>;
  @ViewChild('imageElement') private imgRef!: ElementRef<HTMLImageElement>;
  @ViewChild('canvasElement') private canvasRef!: ElementRef<HTMLCanvasElement>;

  private _zoomElement!: HTMLDivElement;
  private _zoomOuter!: HTMLDivElement;
  private _img!: HTMLImageElement;
  private _canvas!: HTMLCanvasElement;

  // Getters for the elements
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


  //Initialization
  ngAfterViewInit(): void {
    this._img = this.imgRef.nativeElement;

    if (this._img.complete) {
      this.onImageLoad(this._img);
    } else {
      this._img.onload = () => this.onImageLoad(this._img);
    }
  }

  private onImageLoad(img: HTMLImageElement) {
    //Initialize HTML elements
    this._zoomElement = this.zoomElementRef.nativeElement;
    this._zoomOuter = this.zoomOuterRef.nativeElement;
    this._canvas = this.canvasRef.nativeElement;

    //Initialize shapes and picture dimensions
    this.elements().subscribe(elements => {
      this.initializeShapes(elements, this._img.naturalWidth, this._img.naturalHeight);
      this.drawShapes();
    });
    this.pictureOriginalWidth = img.naturalWidth;
    this.pictureOriginalHeight = img.naturalHeight;
    this.pictureCurrentWidth = this.img.width;
    this.pictureCurrentHeight = this.img.height;
    this.zoomElementRef.nativeElement.addEventListener('contextmenu', this.onContextMenu.bind(this));
  
    this.initializeServices();

    this.setSubscriptions();

    this.updateCanvasSize();
  
  }

  initializeShapes(elements: any[], originalWidth: number, originalHeight: number) {
    this.shapes = elements.map(element => {
      const equipmentDto = new EquipmentDto(element);
      const sh = equipmentDto.toShapeObject();
      sh.currentImgWidth = originalWidth;
      sh.currentImgHeigth = originalHeight;
      sh.scaleToCurrentImage = this.img.naturalWidth / sh.originalPictureWidth;
      if(sh.scaleToCurrentImage !== 1){
        this.scaleShapeToCurrentImage(sh);
      }
      return sh;
    });
  }

  initializeServices(){
    this.drawingService.init(this.img, this.shapes);
  }

  setSubscriptions() {
    this.shapesSubscription = this.drawingService.shapes$.subscribe(shapes => {
      this.shapes = shapes;
      // console.log('shapes updated:', shapes);
      this.drawShapes();
    });

    this.shapesSubscription = this.drawingService.newShape$.subscribe(newShape => {
      this.newShapeCreated.emit(newShape);
    });

    this.selectedShapeSubscription = this.drawingService.selectedShape$.subscribe(selectedShape => {
      this.shapeSelected.emit(selectedShape);
    });

    this.destroyRef.onDestroy(() => {
      if (this.shapesSubscription) {
        this.shapesSubscription.unsubscribe();
      }
      if (this.cursorSubscription) {
        this.cursorSubscription.unsubscribe();
      }
      if(this.elementsSubscription) {
        this.elementsSubscription.unsubscribe();
      }
      if(this.newShapeSubscription) {
        this.newShapeSubscription.unsubscribe();
      }
      if(this.selectedShapeSubscription) {
        this.selectedShapeSubscription.unsubscribe();
      }
    });
  }


  //Image zooming and panning functionality
  transform() {
    if (this.zoomElement && this.zoomElement) {
      this.zoomElement.style.transform = `translate(${this.pointX}px, ${this.pointY}px) scale(${this.scale})`;
      this.updateImageScale();
      // Call onZoomEnd after the transition is complete
      setTimeout(() => this.onZoomEnd(), 100);
    }
  }

  updateCanvasSize() {
    if (this.canvas) {
      // console.log('Updating canvas size');
      const imgRect = this.img.getBoundingClientRect();
      this.canvas.width = imgRect.width;
      this.canvas.height = imgRect.height;
      this.drawShapes();
    } else {
      console.error('Canvas not available for size update');
    }
  }

  updateImageScale(){
    this.imageScale = this.calculateCurrentScale();
    this.drawingService.setScale(this.imageScale);
  }

  private stopPanning() {
    this.panning = false;
    this.toggleDraggingClass(false);
    this.setTransition('0.1s'); // Restore transition after dragging
  }


  //Shape functionalities
  drawShapes(){
    const ctx = this._canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this.shapes.forEach(shape => {
      this.drawShape(ctx, shape);
    });
  }

  drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
    const scale = this.calculateCurrentScale();
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = (shape.isSelected? 3 : 1);

    const scaledShape = this.scaleShape(shape);
    // console.log(JSON.stringify(scaledShape));

            switch (scaledShape.type) {
              case 'rectangle':
                const rect = scaledShape as RectangleShape;
                ctx.strokeRect(
                  rect.x * scale,
                  rect.y * scale,
                  rect.width,
                  rect.height
                );
    
                if (shape.isSelected) {
                  // Draw selection handles
                  this.drawSelectionHandles(ctx, shape);
                }
                break;
              case 'circle':
                const circle = scaledShape as CircleShape;
                ctx.beginPath();
                ctx.arc(
                  circle.x * scale,
                  circle.y * scale,
                  circle.radius,
                  0,
                  2 * Math.PI
                );
                ctx.stroke();
                break;
              case 'line':
                const line = scaledShape as LineShape;
                ctx.beginPath();
                ctx.moveTo(line.startX * scale, line.startY * scale);
                ctx.lineTo(line.endX * scale, line.endY * scale);
                ctx.stroke();
                break;
              case 'text':
                const text = scaledShape as TextShape;
                ctx.font = `${16 * scale}px Arial`;
                ctx.fillText(text.text, text.x * scale, text.y * scale);
                break;
            }
  }

  scaleShape(shape: Shape): Shape {
    const calculatedScale = this.calculateCurrentScale();
    // const calculatedScale = this.calculateShapeScale(shape);
    switch (shape.type) {
      case 'rectangle':
        return {
          ...shape,
          width: shape.width * calculatedScale,
          height: shape.height * calculatedScale,
        };
      case 'circle':
        return {
          ...shape,
          radius: shape.radius * calculatedScale,
        };
      case 'line':
      case 'text':
        return { ...shape };
      default:
        return shape;
    }
  }

  private drawSelectionHandles(ctx: CanvasRenderingContext2D, shape: Shape) {
    const scale = this.calculateCurrentScale();
    const handleSize = 8;
    ctx.fillStyle = 'blue';
  
    let corners: [number, number][] = [];
  
    switch (shape.type) {
      case 'rectangle':
        const rect = shape as RectangleShape;
        corners = [
          [rect.x, rect.y],
          [rect.x + rect.width, rect.y],
          [rect.x, rect.y + rect.height],
          [rect.x + rect.width, rect.y + rect.height]
        ];
        break;
      case 'circle':
        const circle = shape as CircleShape;
        corners = [
          [circle.x - circle.radius, circle.y - circle.radius],
          [circle.x + circle.radius, circle.y - circle.radius],
          [circle.x - circle.radius, circle.y + circle.radius],
          [circle.x + circle.radius, circle.y + circle.radius]
        ];
        break;
      case 'line':
        const line = shape as LineShape;
        corners = [
          [line.startX, line.startY],
          [line.endX, line.endY]
        ];
        break;
      // case 'text':
      //   const text = shape as TextShape;
      //   // Assuming text has width and height properties, adjust if not
      //   corners = [
      //     [text.x, text.y],
      //     [text.x + text.width, text.y],
      //     [text.x, text.y + text.height],
      //     [text.x + text.width, text.y + text.height]
      //   ];
      //   break;
    }
  
    corners.forEach(([x, y]) => {
      ctx.fillRect(
        x * scale - handleSize / 2,
        y * scale - handleSize / 2,
        handleSize,
        handleSize
      );
    });
  }



  //Event handlers
  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    return false;
  }

  onMouseLeave(event: MouseEvent) {
    if (this.panning) {
      this.stopPanning();
    }
  }

  onMouseMove(event: MouseEvent) {
    event.preventDefault();
    const { x, y } = this.viewportToPictureCoordinates(event.clientX, event.clientY);
    if (this.panning) {
      this.setTransition('0s'); // Ensure no transition during dragging
      this.pointX = event.clientX - this.start.x;
      this.pointY = event.clientY - this.start.y;
      this.transform();
    }else if(this.drawingService.getSelectedShape() && this.drawingService.isDraggingShape){
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      this.drawingService.dragSelectedShape(dx, dy);
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    }
    this.drawingService.handleMouseMove(event,x,y);
  }

  onMousedown(event: MouseEvent) {
    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - this.lastClickTime;

    this.lastX = event.clientX;
    this.lastY = event.clientY;
  
    if (timeSinceLastClick < this.DOUBLE_CLICK_DELAY) {
      this.isDoubleClick = true;
      clearTimeout(this.clickTimeout);
      this.onDoubleClick(event);
    } else {
      this.isDoubleClick = false;
      this.clickTimeout = setTimeout(() => {
        if (!this.isDoubleClick && event.button === 0) { // Left click
          this.onLeftClick(event);
        }else if (event.button === 1) { // Middle click
          this.onMiddleClick(event);
        } else if (event.button === 2) { // Right click 
          this.onRightClick(event);
        }
      }, this.DOUBLE_CLICK_DELAY);
    }
  
    this.lastClickTime = currentTime;
    event.preventDefault();
  }

  onLeftClick(event: MouseEvent) {
    const { x, y } = this.viewportToPictureCoordinates(event.clientX, event.clientY);
    if(!this.drawingService.handleLeftClick(event, x, y)) {
      this.start = { x: event.clientX - this.pointX, y: event.clientY - this.pointY };
      this.panning = true;
      this.toggleDraggingClass(true);
      this.setTransition('0s'); // Remove transition during dragging
    }

  }

  onMiddleClick(event: MouseEvent) {
    console.log('middleclick');
  }

  onRightClick(event: MouseEvent) {
    console.log('rightclick');
    const { x, y } = this.viewportToPictureCoordinates(event.clientX, event.clientY);
    this.drawingService.handleRightClick(event,x,y);
  }
  
  onDoubleClick(event: MouseEvent) {
    const { x, y } = this.viewportToPictureCoordinates(event.clientX, event.clientY);
    this.drawingService.handleDoubleClick({
      offsetX: x,
      offsetY: y,
      button: event.button
    } as MouseEvent);
  }

  onMouseUp(event: MouseEvent) {
    if (this.panning) {
      this.stopPanning();
    }
    this.drawingService.handleMouseUp(event);
    clearTimeout(this.clickTimeout);
  }
  
  onWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomOuterRect = this.zoomOuter.getBoundingClientRect();
    const mouseX = event.clientX - zoomOuterRect.left;
    const mouseY = event.clientY - zoomOuterRect.top;
  
    const delta = event.deltaY > 0 ? 0.8 : 1.2;
    const newScale = Math.min(Math.max(0.1, this.scale * delta), 10);
  
    // Calculate the new position
    const newPosition = this.positioner(mouseX, mouseY, this.scale, newScale);
  
    // Set transition for smooth zooming
    this.setTransition('0.1s');
  
    // Update the scale and position
    this.scale = newScale;
    this.pointX = newPosition.left;
    this.pointY = newPosition.top;
  
    this.transform();
  
    // Remove transition after zooming
    setTimeout(() => this.setTransition('0s'), 100);
  }

  private onZoomEnd() {
    this.setTransition('0s');
    this.updateCanvasSize();
  }




//Helper functions

  private positioner(mouseX: number, mouseY: number, oldScale: number, newScale: number): { left: number, top: number } {
    const containerRect = this.zoomOuter.getBoundingClientRect();
    const imageRect = this.zoomElement.getBoundingClientRect();
  
    // Calculate the position of the mouse relative to the image's current position
    const relativeX = (mouseX - this.pointX) / imageRect.width;
    const relativeY = (mouseY - this.pointY) / imageRect.height;
  
    // Calculate the new dimensions of the image
    const newWidth = imageRect.width * newScale / oldScale;
    const newHeight = imageRect.height * newScale / oldScale;
  
    // Calculate the new position to keep the mouse at the same relative point on the image
    let newLeft = mouseX - relativeX * newWidth;
    let newTop = mouseY - relativeY * newHeight;
  
    // Calculate the bounds for the image position
    const minLeft = Math.min(0, containerRect.width - newWidth);
    const maxLeft = Math.max(0, containerRect.width - newWidth);
    const minTop = Math.min(0, containerRect.height - newHeight);
    const maxTop = Math.max(0, containerRect.height - newHeight);
  
    // // Adjust the position to keep the image within the container bounds
    // newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
    // newTop = Math.max(minTop, Math.min(newTop, maxTop));
  
    // console.log('New dimensions:', { newWidth, newHeight });
    // console.log('New position:', { left: newLeft, top: newTop });
    return { left: newLeft, top: newTop };
  }

  private setTransition(duration: string, timingFunction: string = 'ease-out') {
      if (this.zoomElement && this.zoomElement) {
          this.zoomElement.style.setProperty('--transition-duration', duration);
          this.zoomElement.style.setProperty('--transition-timing-function', timingFunction);
      }
  }
  
  private toggleDraggingClass(isDragging: boolean) {
      if (this.zoomElement && this.zoomElement) {
          if (isDragging) {
              this.zoomElement.classList.add('dragging');
          } else {
              this.zoomElement.classList.remove('dragging');
          }
      }
  }

  viewportToPictureCoordinates(viewportX: number, viewportY: number): { x: number, y: number } {
    const imgRect = this.img.getBoundingClientRect();
    const scale = this.calculateCurrentScale();
  
    // Calculate click position relative to the image
    const imageX = viewportX - imgRect.left;
    const imageY = viewportY - imgRect.top;
  
    // Convert to original image coordinates
    const originalX = imageX / scale;
    const originalY = imageY / scale;
  
    return {
      x: Math.round(originalX),
      y: Math.round(originalY)
    };
  }
  
  pictureToViewportCoordinates(imageX: number, imageY: number): { x: number, y: number } {
    const imgRect = this.img.getBoundingClientRect();
  
    // Scale the coordinates
    const scaledX = imageX * this.scale;
    const scaledY = imageY * this.scale;
  
    // Add the image's position in the viewport
    const viewportX = scaledX + imgRect.left;
    const viewportY = scaledY + imgRect.top;
  
    return {
      x: Math.round(viewportX),
      y: Math.round(viewportY)
    };
  }

  calculateCurrentScale(): number {
    const imgRec = this.img.getBoundingClientRect();
    return imgRec.width / this.img.naturalWidth;
  }

  calculateShapeScale(shape: Shape): number {//now each shapes is scaled to current image size when init
    const imgRect = this.img.getBoundingClientRect();
    const currentImageScale = imgRect.width / this.img.naturalWidth;
    const shapeToNaturalImageRatio = this.img.naturalWidth / shape.originalPictureWidth;
    
    // console.log('Current image width:', imgRect.width);
    // console.log('Original shape image width:', shape.originalPictureWidth);
    // console.log('Current image natural width:', this.img.naturalWidth);
    // console.log('Current image scale:', currentImageScale);
    // console.log('Shape to natural image ratio:', shapeToNaturalImageRatio);
    
    return currentImageScale * shapeToNaturalImageRatio;
  }

  scaleShapeToCurrentImage(shape: RectangleShape){ 
    const scale = shape.scaleToCurrentImage;
    shape.width *= scale;
    shape.height *= scale;
    shape.x *= scale;
    shape.y *= scale;
  }

}

