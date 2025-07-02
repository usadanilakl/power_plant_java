import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ZoomService {
  constructor(private ngZone: NgZone) {}
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

      // Set initial positioning
  this.container.style.position = 'relative';
  this.img.style.position = 'absolute';
  this.canvas.style.position = 'absolute';


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


  // zoomToMousePosition(factor: number, x: number, y: number) {

  //   const { x:imgX, y:imgY } = this.viewportToPictureCoordinates(x, y);

  //   const oldOffsetX = this.offsetX;
  //   const oldOffsetY = this.offsetY;
  
  //   // Update the zoom level
  //   this.zoomLevel *= factor;
  //   this.updateImageAndCanvasDimensions();

  //   // this.offsetX = this.pictureCurrentWidth - imgX*this.zoomLevel;
  //   // this.offsetY = this.pictureCurrentHeight - imgY*this.zoomLevel;

  //   // this.moveImageElementToMouse({x:imgX, y:imgY},{x,y});
  
  //   // // Force a reflow to ensure the image dimensions are updated
  //   // this.img.offsetHeight;
  
  //   setTimeout(() => {
  //     const {x:newX, y: newY } = this.pictureToViewportCoordinates(imgX, imgY);
  
  //     // Calculate the required offset to keep the mouse position stable
  //     const dx = newX - x;
  //     const dy = newY - y;
  
  //     // Adjust the offset
  //     this.offsetX -= dx;
  //     this.offsetY -= dy;
  
  //     // Update the position of the image and canvas
  //     // this.updateImageAndCanvasPosition();
  
  //     // Notify that zoom has changed
  //     this.zoomChanged.next();
  
  //     console.log(`Zoom: ${this.zoomLevel}, OffsetX: ${this.offsetX}, OffsetY: ${this.offsetY}`);
  //   }, 0);
  // }


  zoomToMousePosition(factor: number, x: number, y: number) {
    const { x: imgX, y: imgY } = this.viewportToPictureCoordinates(x, y);

    this.zoomLevel *= factor;
    this.updateImageAndCanvasDimensions();

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        const { x: newX, y: newY } = this.pictureToViewportCoordinates(imgX, imgY);

        const dx = newX - x;
        const dy = newY - y;

        this.offsetX -= dx;
        this.offsetY -= dy;

        this.ngZone.run(() => {
          // this.updateImageAndCanvasPosition();
          this.zoomChanged.next();
        });

      });
    });
  }




  setZoom(zoom: number) {
    this.zoomLevel = zoom;
    this.updateImageAndCanvasDimensions();
    this.updateImageAndCanvasPosition();
    this.zoomChanged.next();
  }

  updateImageAndCanvasDimensions() {
    this.pictureCurrentWidth = this.pictureOriginalWidth * this.zoomLevel;
    this.pictureCurrentHeight = this.pictureOriginalHeight * this.zoomLevel;
  
    // Calculate the center point of the image before resizing
    const centerX = this.offsetX + this.pictureCurrentWidth / 2;
    const centerY = this.offsetY + this.pictureCurrentHeight / 2;
  
    // Update image dimensions
    this.img.style.width = `${this.pictureCurrentWidth}px`;
    this.img.style.height = `${this.pictureCurrentHeight}px`;
  
    // Update canvas dimensions
    this.canvas.width = this.pictureCurrentWidth;
    this.canvas.height = this.pictureCurrentHeight;
    this.canvas.style.width = `${this.pictureCurrentWidth}px`;
    this.canvas.style.height = `${this.pictureCurrentHeight}px`;
  
    // Recalculate offset to keep the center point stable
    this.offsetX = centerX - this.pictureCurrentWidth / 2;
    this.offsetY = centerY - this.pictureCurrentHeight / 2;
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
  
    // Calculate click position relative to the image
    const imageX = viewportX - imgRect.left;
    const imageY = viewportY - imgRect.top;
  
    // Convert to original image coordinates
    const originalX = imageX / this.zoomLevel;
    const originalY = imageY / this.zoomLevel;
  
    return {
      x: Math.round(originalX),
      y: Math.round(originalY)
    };
  }
  
  pictureToViewportCoordinates(imageX: number, imageY: number): { x: number, y: number } {
    const containerRect = this.container.getBoundingClientRect();
    const imgRect = this.img.getBoundingClientRect();
  
    // Scale the coordinates
    const scaledX = imageX * this.zoomLevel;
    const scaledY = imageY * this.zoomLevel;
  
    // Add the image's position in the viewport
    const viewportX = scaledX + imgRect.left;
    const viewportY = scaledY + imgRect.top;
  
    return {
      x: Math.round(viewportX),
      y: Math.round(viewportY)
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

  moveImageElementToMouse(imageCoords: { x: number, y: number }, viewPortCoords: { x: number, y: number }) {
    // Calculate the position of the point in the zoomed image
    const zoomedX = imageCoords.x * this.zoomLevel;
    const zoomedY = imageCoords.y * this.zoomLevel;
  
    // Calculate the new offsets
    const newOffsetX = viewPortCoords.x - zoomedX;
    const newOffsetY = viewPortCoords.y - zoomedY;
  
    // Update the offsets
    this.offsetX = newOffsetX;
    this.offsetY = newOffsetY;
  
    // Update the position of the image and canvas
    this.updateImageAndCanvasPosition();
  
    // Optionally, ensure the image stays within the allowed bounds
    // this.keepPictureInView();
  }


  calculateNewDimensions() {
    const newWidth = this.pictureOriginalWidth * this.zoomLevel;
    const newHeight = this.pictureOriginalHeight * this.zoomLevel;
  
    // Calculate the center point of the image before resizing
    const centerX = this.offsetX + this.pictureCurrentWidth / 2;
    const centerY = this.offsetY + this.pictureCurrentHeight / 2;
  
    // Calculate new offsets to keep the center point stable
    const newOffsetX = centerX - newWidth / 2;
    const newOffsetY = centerY - newHeight / 2;
  
    return {
      width: newWidth,
      height: newHeight,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    };
  }

  applyImageAndCanvasDimensions(applyVisually = true) {
    const newDimensions = this.calculateNewDimensions();
  
    this.pictureCurrentWidth = newDimensions.width;
    this.pictureCurrentHeight = newDimensions.height;
    this.offsetX = newDimensions.offsetX;
    this.offsetY = newDimensions.offsetY;
  
    if (applyVisually) {
      this.applyVisualUpdate();
    }
  }

  applyVisualUpdate() {
    // Update image dimensions
    this.img.style.width = `${this.pictureCurrentWidth}px`;
    this.img.style.height = `${this.pictureCurrentHeight}px`;
  
    // Update canvas dimensions
    this.canvas.width = this.pictureCurrentWidth;
    this.canvas.height = this.pictureCurrentHeight;
    this.canvas.style.width = `${this.pictureCurrentWidth}px`;
    this.canvas.style.height = `${this.pictureCurrentHeight}px`;
  
    // Update position
    this.updateImageAndCanvasPosition();
  }



  
}