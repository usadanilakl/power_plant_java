import { AfterViewInit, Component, ElementRef, inject, input, OnDestroy, ViewChild } from '@angular/core';
import { CircleShape, LineShape, RectangleShape, Shape, TextShape } from '../../../models/shape.model';
import { DrawingService } from '../image-services/drawing.service';

@Component({
  selector: 'app-image-zoom-interactive',
  imports: [],
  templateUrl: './image-zoom-interactive.component.html',
  styleUrl: './image-zoom-interactive.component.css'
})
export class ImageZoomInteractiveComponent implements AfterViewInit  {
  imageUrl = input<string>()
  imageName = input<string>()
  elements = input.required<any[]>();

  constructor() { }

//Services
  private drawingService = inject(DrawingService);

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
  private readonly DOUBLE_CLICK_DELAY = 300; // milliseconds

//Shape/Image functionality variables
  private shapes: Shape[] = [];
  pictureOriginalWidth = 0;
  pictureOriginalHeight = 0;
  pictureCurrentWidth = 0;
  pictureCurrentHeight = 0;


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
    this.initializeShapes(this.elements(), img.naturalWidth, img.naturalHeight);
    this.pictureOriginalWidth = img.naturalWidth;
    this.pictureOriginalHeight = img.naturalHeight;
    this.pictureCurrentWidth = this.img.width;
    this.pictureCurrentHeight = this.img.height;
    this.zoomElementRef.nativeElement.addEventListener('contextmenu', this.onContextMenu.bind(this));
  
    this.initializeServices();

    this.updateCanvasSize();
  
  }

  initializeShapes(elements: any[], originalWidth: number, originalHeight: number) {
    this.shapes = elements.map(element => ({
      type: element.shapeType.name,
      color: element.color,
      ...element.shapeData,
      originalPictureWidth: originalWidth,
      originalPictureHeight: originalHeight
    })) as Shape[];
  }

  initializeServices(){
    this.drawingService.setOriginalPictureDimensions(this.img.naturalWidth, this.img.naturalHeight);
    this.drawingService.setShapes(this.shapes)
  }


  //Image zooming and panning functionality
  transform() {
    if (this.zoomElement && this.zoomElement) {
      this.zoomElement.style.transform = `translate(${this.pointX}px, ${this.pointY}px) scale(${this.scale})`;
      // Call onZoomEnd after the transition is complete
      setTimeout(() => this.onZoomEnd(), 100);
    }
  }

  updateCanvasSize() {
    if (this.canvas) {
      this.canvas.width = this.img.width;
      this.canvas.height = this.img.height;
      this.drawShapes();
    } else {
      console.error('Canvas not available for size update');
    }
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
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.isSelected? 3 : 1;

    const scaledShape = this.scaleShape(shape);
    const scale = this.img.width / shape.originalPictureWidth;

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
    const calculatedScale = this.img.width / shape.originalPictureWidth;
    console.log(`Original width: ${shape.originalPictureWidth}, crurrent width: ${this.img.width}, calculated scale: ${calculatedScale}`);
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
        x * this.scale - handleSize / 2,
        y * this.scale - handleSize / 2,
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

  onMousedown(event: MouseEvent) {
    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - this.lastClickTime;
  
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
    this.drawingService.handleRightClick(event);
  }
  
  onDoubleClick(event: MouseEvent) {
    console.log('doubleclick');
    const { x, y } = this.viewportToPictureCoordinates(event.clientX, event.clientY);
    this.drawingService.handleDoubleClick({
      offsetX: x,
      offsetY: y,
      button: event.button
    } as MouseEvent);
  }

  onMouseUp(event: MouseEvent) {
    this.panning = false;
    this.toggleDraggingClass(false);
    this.setTransition('0.1s'); // Restore transition after dragging
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

  onMouseMove(event: MouseEvent) {
    event.preventDefault();
    const { x, y } = this.viewportToPictureCoordinates(event.clientX, event.clientY);
    if (this.panning) {
      this.setTransition('0s'); // Ensure no transition during dragging
      this.pointX = event.clientX - this.start.x;
      this.pointY = event.clientY - this.start.y;
      this.transform();
    }else if(this.drawingService.getSelectedShape() && this.drawingService.isDraggingShape){
      const dx = event.offsetX - this.lastX;
      const dy = event.offsetY - this.lastY;
      this.drawingService.dragSelectedShape(dx, dy);
      this.lastX = event.offsetX;
      this.lastY = event.offsetY;
    }
    this.drawingService.handleMouseMove(event,x,y);
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
  
    // Calculate click position relative to the image
    const imageX = viewportX - imgRect.left;
    const imageY = viewportY - imgRect.top;
  
    // Convert to original image coordinates
    const originalX = imageX / this.scale;
    const originalY = imageY / this.scale;
  
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
    return this.img.width / this.pictureOriginalWidth;
  }

}

