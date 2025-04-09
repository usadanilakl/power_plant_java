import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCanvasComponent } from '../image-canvas/image-canvas.component';
import { ShapeService } from '../image-services/shape.service';
import { ZoomService } from '../image-services/zoom.service';
import { DragService } from '../image-services/drag.service';
import { Shape } from '../../../models/shape.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-image-interactive',
  standalone: true,
  imports: [CommonModule, ImageCanvasComponent],
  // template: `
  //   <div #container class="interactive-image-container">
  //     <div class="interactive-image-content">
  //       <img #img [src]="imagePath" [alt]="imageName" class="interactive-image-img">
  //       <app-image-canvas
  //         [width]="zoomService.pictureCurrentWidth"
  //         [height]="zoomService.pictureCurrentHeight"
  //         [shapes]="shapes"
  //         [offsetX]="zoomService.offsetX"
  //         [offsetY]="zoomService.offsetY"
  //         [scale]="zoomService.scale">
  //       </app-image-canvas>
  //     </div>
  //     <button (click)="openPopup()">Open in Popup</button>
  //   </div>
  // `,
  templateUrl: './image-interactive.component.html',
  styleUrls: ['./image-interactive.component.css'],
  providers: [ShapeService, ZoomService, DragService]
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

  constructor(
    private shapeService: ShapeService,
    public zoomService: ZoomService,
    private dragService: DragService
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
    this.shapeService.initializeShapes(this.elements, img.naturalWidth, img.naturalHeight);
    this.shapes = this.shapeService.shapes;
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
  }

  handleWheel(e: WheelEvent) {
    e.preventDefault();
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - this.zoomService.offsetX;
    const mouseY = e.clientY - rect.top - this.zoomService.offsetY;
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoomService.zoom(zoomFactor, mouseX, mouseY);
    this.updateShapes();
  }

  handleMouseDown(e: MouseEvent) {
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.dragService.startDrag(x, y);
  }
  
  handleMouseMove(e: MouseEvent) {
    if (this.dragService.isDragging) {
      const rect = this.containerRef.nativeElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.dragService.drag(x, y);
      // this.canvasComponent.drawShapes();
      this.updateShapes();
    }
  }

  handleMouseUp() {
    this.dragService.endDrag();
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
}