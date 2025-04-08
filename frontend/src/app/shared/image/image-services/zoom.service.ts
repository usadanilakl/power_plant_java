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
    this.canvas = canvas;
    
    this.img.onload = () => {
      this.pictureOriginalWidth = this.img.naturalWidth;
      this.pictureOriginalHeight = this.img.naturalHeight;
      this.initializeZoom();
    };

    window.addEventListener('resize', () => this.initializeZoom());
    this.initializeZoom();
  }

  initializeZoom() {
    const containerAspectRatio = this.container.clientWidth / this.container.clientHeight;
    const imageAspectRatio = this.pictureOriginalWidth / this.pictureOriginalHeight;

    if (containerAspectRatio > imageAspectRatio) {
      this.zoomLevel = this.container.clientHeight / this.pictureOriginalHeight;
    } else {
      this.zoomLevel = this.container.clientWidth / this.pictureOriginalWidth;
    }

    this.updateImageAndCanvasDimensions();
    this.updateImagePosition();
    this.zoomChanged.next();
  }

  zoom(factor: number, mouseX: number, mouseY: number) {
    const oldZoom = this.zoomLevel;
    this.zoomLevel *= factor;

    const minZoomX = this.container.clientWidth / this.pictureOriginalWidth;
    const minZoomY = this.container.clientHeight / this.pictureOriginalHeight;
    const minZoom = Math.min(minZoomX, minZoomY);

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