import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ZoomService {
  zoomLevel = 1;
  offsetX = 0;
  offsetY = 0;
  private container!: HTMLElement;
  private img!: HTMLImageElement;
  private canvas!: HTMLCanvasElement;
  private pictureOriginalWidth = 0;
  private pictureOriginalHeight = 0;
  pictureCurrentWidth = 0;
  pictureCurrentHeight = 0;

  zoomChanged = new BehaviorSubject<void>(undefined);

  initialize(container: HTMLElement, img: HTMLImageElement, canvas: HTMLCanvasElement) {
    this.container = container;
    this.img = img;
    this.canvas = canvas;  // Add this line
    this.pictureOriginalWidth = img.naturalWidth;
    this.pictureOriginalHeight = img.naturalHeight;
    this.pictureCurrentWidth = this.pictureOriginalWidth;
    this.pictureCurrentHeight = this.pictureOriginalHeight;
    this.initializeZoom();  // Call initializeZoom instead of updateImageAndCanvasDimensions
  }

  initializeZoom() {
    this.zoomLevel = this.container.clientHeight / this.pictureOriginalHeight;
    
    this.updateImageAndCanvasDimensions();
    this.updateImagePosition();
    this.zoomChanged.next();
  }

  zoom(factor: number, mouseX: number, mouseY: number) {
    const oldZoom = this.zoomLevel;
    this.zoomLevel *= factor;
  
    // Only use height for minimum zoom
    const minZoom = this.container.clientHeight / this.pictureOriginalHeight;
  
    this.zoomLevel = Math.max(this.zoomLevel, minZoom * 0.9);
    this.zoomLevel = Math.min(this.zoomLevel, 5);
  
    const mouseXRatio = mouseX / this.pictureCurrentWidth;
    const mouseYRatio = mouseY / this.pictureCurrentHeight;
  
    this.updateImageAndCanvasDimensions();
  
    const newMouseX = this.pictureCurrentWidth * mouseXRatio;
    const newMouseY = this.pictureCurrentHeight * mouseYRatio;
  
    this.offsetX -= newMouseX - mouseX;
    this.offsetY -= newMouseY - mouseY;
  
    this.updateImagePosition();
    this.zoomChanged.next();
  }

  setZoom(zoom: number) {
    this.zoomLevel = zoom;
    this.updateImageAndCanvasDimensions();
    this.updateImagePosition();
    this.zoomChanged.next();
  }

  updateImageAndCanvasDimensions() {
    this.pictureCurrentWidth = this.pictureOriginalWidth * this.zoomLevel;
    this.pictureCurrentHeight = this.pictureOriginalHeight * this.zoomLevel;

    this.img.style.width = `${this.pictureCurrentWidth}px`;
    this.img.style.height = `${this.pictureCurrentHeight}px`;

    this.canvas.width = this.pictureCurrentWidth;
    this.canvas.height = this.pictureCurrentHeight;
  }

  updateImagePosition() {
    const maxOffsetX = Math.max(0, (this.pictureCurrentWidth - this.container.clientWidth) / 2);
    const maxOffsetY = Math.max(0, (this.pictureCurrentHeight - this.container.clientHeight) / 2);

    this.offsetX = Math.max(-maxOffsetX, Math.min(this.offsetX, maxOffsetX));
    this.offsetY = Math.max(-maxOffsetY, Math.min(this.offsetY, maxOffsetY));

    this.img.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
    this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
  }

  get scale(): number {
    return this.zoomLevel;
  }
}