import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCanvasComponent } from '../image-canvas/image-canvas.component';
import { ShapeService } from '../image-services/shape.service';
import { ZoomService } from '../image-services/zoom.service';
import { DragService } from '../image-services/drag.service';

@Component({
  selector: 'app-image-interactive',
  standalone: true,
  imports: [CommonModule, ImageCanvasComponent],
  template: `
    <div #container class="interactive-image-container">
      <div class="interactive-image-content">
        <img #img [src]="imagePath" [alt]="imageName" class="interactive-image-img">
        <app-image-canvas></app-image-canvas>
      </div>
      <button (click)="openPopup()">Open in Popup</button>
    </div>
  `,
  styleUrls: ['./image-interactive.component.css']
})
export class ImageInteractiveComponent implements AfterViewInit {
  @Input() imagePath!: string;
  @Input() imageName!: string;
  @Input() elements: any[] = [];

  @ViewChild('container') containerRef!: ElementRef;
  @ViewChild('img') imgRef!: ElementRef;
  @ViewChild(ImageCanvasComponent) canvasComponent!: ImageCanvasComponent;

  constructor(
    private shapeService: ShapeService,
    private zoomService: ZoomService,
    private dragService: DragService
  ) {}

  ngAfterViewInit() {
    const img = this.imgRef.nativeElement;
    const container = this.containerRef.nativeElement;

    img.onload = () => {
      this.shapeService.initializeShapes(this.elements, img.naturalWidth, img.naturalHeight);
      this.zoomService.initialize(container, img, this.canvasComponent.canvas);
      this.dragService.initialize(container, img, this.canvasComponent.canvas);
      this.setupEventListeners();
    };
  }

  setupEventListeners() {
    const container = this.containerRef.nativeElement;

    container.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - this.zoomService.offsetX;
      const mouseY = e.clientY - rect.top - this.zoomService.offsetY;
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoomService.zoom(zoomFactor, mouseX, mouseY);
      this.canvasComponent.drawShapes();
    });

    // Add touch event listeners here (similar to the original code)
  }

  openPopup() {
    // Implement popup functionality
  }
}