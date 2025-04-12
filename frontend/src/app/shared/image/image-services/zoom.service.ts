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
    this.pictureOriginalWidth = img.naturalWidth;
    this.pictureOriginalHeight = img.naturalHeight;
    this.pictureCurrentWidth = this.pictureOriginalWidth;
    this.pictureCurrentHeight = this.pictureOriginalHeight;
    this.initializeZoom();
  }

  initializeZoom() {
    const containerAspectRatio = this.container.clientWidth / this.container.clientHeight;
    const imageAspectRatio = this.pictureOriginalWidth / this.pictureOriginalHeight;

    if (containerAspectRatio > imageAspectRatio) {
      // Fit to height
      this.zoomLevel = this.container.clientHeight / this.pictureOriginalHeight;
    } else {
      // Fit to width
      this.zoomLevel = this.container.clientWidth / this.pictureOriginalWidth;
    }

    this.updateImageAndCanvasDimensions();
    this.centerImageAndCanvas();
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

    this.updateImageAndCanvasPosition();
    this.zoomChanged.next();
  }

  setZoom(zoom: number) {
    this.zoomLevel = zoom;
    this.updateImageAndCanvasDimensions();
    this.updateImageAndCanvasPosition();
    this.zoomChanged.next();
  }

  updateImageAndCanvasDimensions() {
    this.pictureCurrentWidth = Math.round(this.pictureOriginalWidth * this.zoomLevel);
    this.pictureCurrentHeight = Math.round(this.pictureOriginalHeight * this.zoomLevel);

    this.img.style.width = `${this.pictureCurrentWidth}px`;
    this.img.style.height = `${this.pictureCurrentHeight}px`;

    this.canvas.width = this.pictureCurrentWidth;
    this.canvas.height = this.pictureCurrentHeight;
    this.canvas.style.width = `${this.pictureCurrentWidth}px`;
    this.canvas.style.height = `${this.pictureCurrentHeight}px`;
  }

  updateImageAndCanvasPosition() {
    const transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
    this.img.style.transform = transform;
    this.canvas.style.transform = transform;
  }

  centerImageAndCanvas() {
    this.offsetX = Math.round((this.container.clientWidth - this.pictureCurrentWidth) / 2);
    this.offsetY = Math.round((this.container.clientHeight - this.pictureCurrentHeight) / 2);
    this.updateImageAndCanvasPosition();
  }

  get scale(): number {
    return this.zoomLevel;
  }

  viewportToPictureCoordinates(viewportX: number, viewportY: number): { x: number, y: number } {

    const containerRect = this.container.getBoundingClientRect();
    const imgRect = this.img.getBoundingClientRect();
  
    // Calculate click position relative to the container
    const containerX = viewportX - containerRect.left;
    const containerY = viewportY - containerRect.top;
  
    // Calculate click position relative to the image, accounting for zoom and offset
    const imageX = (containerX - (imgRect.left - containerRect.left)) / this.scale;
    const imageY = (containerY - (imgRect.top - containerRect.top)) / this.scale;
  
  
    return {
      x: Math.round(imageX),
      y: Math.round(imageY)
    };
  }

  moveBy(dx: number, dy: number) {
    this.offsetX += dx;
    this.offsetY += dy;
    this.updateImageAndCanvasPosition();
  }

  keepPictureInView() {
    const containerRect = this.container.getBoundingClientRect();
    const imageRect = this.img.getBoundingClientRect();
  
    let dx = 0;
    let dy = 0;
  
    const minVisibleWidth = imageRect.width * 0.1;
    const minVisibleHeight = imageRect.height * 0.1;
  
    // Horizontal adjustment
    if (imageRect.right < containerRect.left + minVisibleWidth) {
      dx = (containerRect.left + minVisibleWidth) - imageRect.right;
    } else if (imageRect.left > containerRect.right - minVisibleWidth) {
      dx = (containerRect.right - minVisibleWidth) - imageRect.left;
    }
  
    // Vertical adjustment
    if (imageRect.bottom < containerRect.top + minVisibleHeight) {
      dy = (containerRect.top + minVisibleHeight) - imageRect.bottom;
    } else if (imageRect.top > containerRect.bottom - minVisibleHeight) {
      dy = (containerRect.bottom - minVisibleHeight) - imageRect.top;
    }
  
    // If any adjustment is needed, use moveBy
    if (dx !== 0 || dy !== 0) {
      this.moveBy(dx, dy);
    }
  }

  getMouseOnPictureCoordinates(event: MouseEvent): { x: number, y: number } {
    const eventX = event.clientX;
    const eventY = event.clientY;

    return this.viewportToPictureCoordinates(eventX, eventY);
  }
  moveImageElementToMouse(imageCoords: { x: number, y: number }, viewPortCoords: { x: number, y: number }) {
    // Get the current position of the image in the viewport
    const containerRect = this.container.getBoundingClientRect();
    const imgRect = this.img.getBoundingClientRect();
  
    // Calculate the current position of the image coordinates in the viewport
    const currentViewportX = imgRect.left - containerRect.left + (imageCoords.x * this.scale);
    const currentViewportY = imgRect.top - containerRect.top + (imageCoords.y * this.scale);
  
    // Calculate the difference between the current position and the desired position
    const dx = viewPortCoords.x - currentViewportX;
    const dy = viewPortCoords.y - currentViewportY;
  
    // Move the image by this difference
    this.moveBy(dx, dy);
  
    // Ensure the image stays within the allowed bounds
    this.keepPictureInView();
  }
  
}