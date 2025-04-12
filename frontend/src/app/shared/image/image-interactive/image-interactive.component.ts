import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCanvasComponent } from '../image-canvas/image-canvas.component';
import { ShapeService } from '../image-services/shape.service';
import { ZoomService } from '../image-services/zoom.service';
import { DragService } from '../image-services/drag.service';
import { Shape } from '../../../models/shape.model';
import { Subscription } from 'rxjs';
import { DrawingService } from '../image-services/drawing.service';
import { DrawingComponent } from '../drawing/drawing.component';

@Component({
  selector: 'app-image-interactive',
  standalone: true,
  imports: [CommonModule, ImageCanvasComponent, DrawingComponent],
  templateUrl: './image-interactive.component.html',
  styleUrls: ['./image-interactive.component.css'],
  providers: [ShapeService, ZoomService, DragService, DrawingService]
})
export class ImageInteractiveComponent implements AfterViewInit, OnDestroy {
  @Input() imagePath!: string;
  @Input() imageName!: string;
  @Input() elements: any[] = [];

  @ViewChild('container') containerRef!: ElementRef;
  @ViewChild('img') imgRef!: ElementRef;
  @ViewChild(ImageCanvasComponent) canvasComponent!: ImageCanvasComponent;

  shapes: Shape[] = [];
  private zoomSubscription!: Subscription;
  private isInitialized = false;

  private clickTimeout: any;
  private isDoubleClick: boolean = false;
  private lastClickTime: number = 0;
  private readonly DOUBLE_CLICK_DELAY = 300; // milliseconds
  
  private lastX: number = 0;
  private lastY: number = 0;
  cursor: string = 'default';

  constructor(
    private shapeService: ShapeService,
    public zoomService: ZoomService,
    private dragService: DragService,
    private drawingService: DrawingService,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit() {
    const img = this.imgRef.nativeElement;
    const container = this.containerRef.nativeElement;
  
    if (img.complete) {
      this.onImageLoad(img, container);
    } else {
      img.onload = () => this.onImageLoad(img, container);
    }
  }

  
  private onImageLoad(img: HTMLImageElement, container: HTMLElement) {
    this.initializeShapes(this.elements, img.naturalWidth, img.naturalHeight);
    this.drawingService.setShapes(this.shapes)
    // this.shapes = this.shapeService.shapes;
    this.initializeServices(container, img);

    // Set initial zoom to fit the container
    this.setInitialZoom(container, img);
    
    this.zoomSubscription = this.zoomService.zoomChanged.subscribe((zoomLevel) => {
      if (this.isInitialized) {
        this.canvasComponent.updateCanvasSize(
          this.zoomService.pictureCurrentWidth,
          this.zoomService.pictureCurrentHeight
        );
        this.updateShapes();
      }
    });
  }

  private setInitialZoom(container: HTMLElement, img: HTMLImageElement) {
    const containerAspectRatio = container.clientWidth / container.clientHeight;
    const imageAspectRatio = img.naturalWidth / img.naturalHeight;

    let zoom;
    if (containerAspectRatio > imageAspectRatio) {
      // Fit to height
      zoom = container.clientHeight / img.naturalHeight;
    } else {
      // Fit to width
      zoom = container.clientWidth / img.naturalWidth;
    }

    this.zoomService.setZoom(zoom);
  }

  private initializeServices(container: HTMLElement, img: HTMLImageElement) {
    const canvas = this.canvasComponent.getCanvas();
    if (!canvas) {
      console.error('Canvas not available. Services not initialized.');
      return;
    }
  
    // Initialize ZoomService first
    this.zoomService.initialize(container, img, canvas);
  
    // Now initialize canvas with correct dimensions
    this.canvasComponent.updateCanvasSize(this.zoomService.pictureCurrentWidth, this.zoomService.pictureCurrentHeight);
  
    // Initialize DragService
    this.dragService.initialize(container, img, canvas);
  
    this.setupEventListeners();
    this.isInitialized = true;
    this.updateShapes();
    this.drawingService.setOriginalPictureDimensions(img.naturalWidth, img.naturalHeight);
  }

  ngOnDestroy() {
    this.zoomSubscription.unsubscribe();
  }

  updateShapes() {
    if (!this.isInitialized || !this.canvasComponent) return;
  
    this.canvasComponent.updateCanvasSize(
      this.zoomService.pictureCurrentWidth,
      this.zoomService.pictureCurrentHeight
    );
    this.canvasComponent.drawShapes();
  }

  setupEventListeners() {
    const container = this.containerRef.nativeElement;

    container.addEventListener('wheel', this.handleWheel.bind(this));
    container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    container.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    container.addEventListener('contextmenu', this.handleContextMenu.bind(this));
  }

  handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    return false;
  }

  handleWheel(e: WheelEvent) {
    e.preventDefault();

    // const imageCoordsBeforeZoom = this.zoomService.getMouseOnPictureCoordinates(e)
    
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - this.zoomService.offsetX;
    const mouseY = e.clientY - rect.top - this.zoomService.offsetY;
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoomService.zoom(zoomFactor, mouseX, mouseY);
    this.updateShapes();

    // this.zoomService.moveImageElementToMouse(imageCoordsBeforeZoom,{x:e.clientX, y:e.clientY});
  }
  
  handleMouseDown(e: MouseEvent) {
    e.preventDefault();
    this.lastX = e.offsetX;
    this.lastY = e.offsetY;
    const containerRect = this.containerRef.nativeElement.getBoundingClientRect();
    const imgRect = this.imgRef.nativeElement.getBoundingClientRect();
  
    // Calculate click position relative to the container
    const containerX = e.clientX - containerRect.left;
    const containerY = e.clientY - containerRect.top;
  
    // Calculate click position relative to the image, accounting for zoom and offset
    const imageX = (containerX - (imgRect.left - containerRect.left)) / this.zoomService.scale;
    const imageY = (containerY - (imgRect.top - containerRect.top)) / this.zoomService.scale;
  
    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - this.lastClickTime;
  
    if (timeSinceLastClick < this.DOUBLE_CLICK_DELAY) {
      // Double click detected
      this.isDoubleClick = true;
      clearTimeout(this.clickTimeout);
      this.handleDoubleClick(e, imageX, imageY);
    } else {
      this.isDoubleClick = false;
      this.clickTimeout = setTimeout(() => {
        if (!this.isDoubleClick) {
          this.handleSingleClick(e, imageX, imageY);
        }
      }, this.DOUBLE_CLICK_DELAY);
    }
  
    this.lastClickTime = currentTime;
  }
  
  private handleSingleClick(e: MouseEvent, imageX: number, imageY: number) {
    if (e.button === 2) { // Right click
      console.log('Drawing mode');
      this.drawingService.handleRightClick(e);
    } else if (e.button === 0) { // Left click

      if(!this.drawingService.handleLeftClick(e, imageX, imageY)) {  
        const rect = this.containerRef.nativeElement.getBoundingClientRect();
        const dragX = e.clientX - rect.left;
        const dragY = e.clientY - rect.top;
        this.dragService.startDrag(dragX, dragY);
      }
      
    }
  }
  
  private handleDoubleClick(e: MouseEvent, imageX: number, imageY: number) {
    console.log('Double click detected');
    console.log('Drawing mode');
    this.drawingService.handleDoubleClick({
      offsetX: imageX,
      offsetY: imageY,
      button: e.button
    } as MouseEvent);

  }

  handleMouseMove(e: MouseEvent) {
    if (this.dragService.isDragging) {
      const rect = this.containerRef.nativeElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.dragService.drag(x, y);
      // this.canvasComponent.drawShapes();
      this.updateShapes();
    }else if (this.drawingService.getSelectedShape() && this.drawingService.isDraggingShape) {    
      const dx = e.offsetX - this.lastX;
      const dy = e.offsetY - this.lastY;
      this.drawingService.dragSelectedShape(dx, dy);
      this.lastX = e.offsetX;
      this.lastY = e.offsetY;
    }

    
    this.drawingService.handleMouseMove(e);
  }

  handleMouseUp(e: MouseEvent) {
    this.dragService.endDrag();
    this.drawingService.handleMouseUp(e);
    clearTimeout(this.clickTimeout);
  }

  handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const rect = this.containerRef.nativeElement.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      this.dragService.startDrag(x, y);
    }
  }
  
  handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1 && this.dragService.isDragging) {
      const rect = this.containerRef.nativeElement.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      this.dragService.drag(x, y);
      this.zoomService.updateImageAndCanvasPosition();
      this.canvasComponent.drawShapes();
    }
  }

  handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    this.dragService.endDrag();
  }

  openPopup() {
    // Implement popup functionality
    console.log('Open popup functionality to be implemented');
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
}