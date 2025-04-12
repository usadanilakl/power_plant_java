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

  zoomToMousePosition(factor: number, x: number, y: number) {
    // Get the current dimensions and positions
    const containerRect = this.container.getBoundingClientRect();
    const imgRect = this.img.getBoundingClientRect();
  
    // Calculate the position of the mouse relative to the image's top-left corner
    const mouseXRelative = x - (imgRect.left + this.offsetX);
    const mouseYRelative = y - (imgRect.top + this.offsetY);
  
    // Calculate the mouse position as a fraction of the current image size
    const mouseXFraction = mouseXRelative / this.pictureCurrentWidth;
    const mouseYFraction = mouseYRelative / this.pictureCurrentHeight;
  
    // Calculate the new zoom level
    const newZoom = this.zoomLevel * factor;
  
    // Constrain zoom level if needed
    const minZoom = Math.min(containerRect.width / this.pictureOriginalWidth, containerRect.height / this.pictureOriginalHeight);
    const constrainedZoom = Math.max(Math.min(newZoom, 5), minZoom); // Assuming 5x is max zoom
  
    // Calculate new image dimensions
    const newImageWidth = this.pictureOriginalWidth * constrainedZoom;
    const newImageHeight = this.pictureOriginalHeight * constrainedZoom;
  
    // Calculate new mouse position after zoom
    const newMouseXRelative = newImageWidth * mouseXFraction;
    const newMouseYRelative = newImageHeight * mouseYFraction;
  
    // Calculate new offset to keep the mouse point fixed
    const newOffsetX = this.offsetX - (newMouseXRelative - mouseXRelative);
    const newOffsetY = this.offsetY - (newMouseYRelative - mouseYRelative);
  
    // Update class properties
    this.zoomLevel = constrainedZoom;
    this.pictureCurrentWidth = newImageWidth;
    this.pictureCurrentHeight = newImageHeight;
    this.offsetX = newOffsetX;
    this.offsetY = newOffsetY;
  
    // Apply new dimensions and position to the image and canvas
    this.updateImageAndCanvasDimensions();
    this.updateImageAndCanvasPosition();
  
    // Notify that zoom has changed
    this.zoomChanged.next();
  
    console.log(`Zoom: ${this.zoomLevel.toFixed(2)}, Offset: (${this.offsetX.toFixed(2)}, ${this.offsetY.toFixed(2)})`);
    console.log(`Mouse at viewport: (${x}, ${y}), Mouse fraction: (${mouseXFraction.toFixed(2)}, ${mouseYFraction.toFixed(2)})`);
  }


  // zoomToMousePosition(factor: number, x: number, y: number) {

  //   const { x:oldX, y:oldY } = this.viewportToPictureCoordinates(x, y);

  //   const oldZoom = this.zoomLevel;
  //   this.zoomLevel *= factor;
  //   this.updateImageAndCanvasDimensions();


  //   // const { x:newX, y:newY } = this.pictureToViewportCoordinates(oldX, oldY);



  //   const dx = (newX - x);
  //   const dy = (newY - y);
    

  //   this.offsetX += dx;
  //   this.offsetY += dy;


  //   console.log(`OffsetX: ${this.offsetX}, OffsetY: ${this.offsetY}`);
  //   console.log(`image: ${oldX}, ${oldY}`);
  //   console.log(`Original ViewportX: ${x}, Original ViewportY: ${y}`);
  //   console.log(`New ViewportX: ${newX}, New ViewportY: ${newY}`);
  //   // console.log(`dx: ${dx}, dy: ${dy}`);



  //   this.updateImageAndCanvasPosition();
  //   this.zoomChanged.next();

    
  // }

  // zoomToMousePosition(factor: number, x: number, y: number) {
  //   const containerRect = this.container.getBoundingClientRect();
  //   const imgRect = this.img.getBoundingClientRect();
  //   console.log(`Zooming to mouse position: ${x}, ${y} with factor ${factor}...`);
    
  //   // Calculate the position on the image before zooming
  //   const mouseXRelativeToImage = x - (imgRect.left + this.offsetX);
  //   const mouseYRelativeToImage = y - (imgRect.top + this.offsetY);
    
  //   // Calculate the ratio of the mouse position to the image dimensions
  //   const mouseXRatio = mouseXRelativeToImage / this.pictureCurrentWidth;
  //   const mouseYRatio = mouseYRelativeToImage / this.pictureCurrentHeight;
    
  //   // Update the zoom level
  //   const oldZoom = this.zoomLevel;
  //   this.zoomLevel *= factor;
  //   console.log(`Old zoom level: ${oldZoom}, New zoom level: ${this.zoomLevel}`);
  
  //   // Update image dimensions based on new zoom level
  //   this.updateImageAndCanvasDimensions();
  
  //   // Calculate the new position where the mouse should be after zooming
  //   const newMouseXRelativeToImage = this.pictureCurrentWidth * mouseXRatio;
  //   const newMouseYRelativeToImage = this.pictureCurrentHeight * mouseYRatio;
  
  //   // Adjust the offset to keep the mouse position stable
  //   this.offsetX += mouseXRelativeToImage - newMouseXRelativeToImage;
  //   this.offsetY += mouseYRelativeToImage - newMouseYRelativeToImage;
  
  //   // Update the position of the image and canvas
  //   this.updateImageAndCanvasPosition();
  //   this.zoomChanged.next();
  
  //   console.log(`New offset: (${this.offsetX}, ${this.offsetY})`);
  // }



  setZoom(zoom: number) {
    this.zoomLevel = zoom;
    this.updateImageAndCanvasDimensions();
    this.updateImageAndCanvasPosition();
    this.zoomChanged.next();
  }

  updateImageAndCanvasDimensions() {
    // this.pictureCurrentWidth = Math.round(this.pictureOriginalWidth * this.zoomLevel);
    // this.pictureCurrentHeight = Math.round(this.pictureOriginalHeight * this.zoomLevel);
    
    this.pictureCurrentWidth = this.pictureOriginalWidth * this.zoomLevel;
    this.pictureCurrentHeight = this.pictureOriginalHeight * this.zoomLevel;

    this.img.style.width = `${this.pictureCurrentWidth}px`;
    this.img.style.height = `${this.pictureCurrentHeight}px`;

    this.canvas.width = this.pictureCurrentWidth;
    this.canvas.height = this.pictureCurrentHeight;

    this.canvas.style.width = `${this.pictureCurrentWidth}px`;
    this.canvas.style.height = `${this.pictureCurrentHeight}px`;
  }

  updateImageAndCanvasPosition() {
    // const transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
    // this.img.style.transform = transform;
    // this.canvas.style.transform = transform;

  this.img.style.left = `${this.offsetX}px`;
  this.img.style.top = `${this.offsetY}px`;

  this.canvas.style.left = `${this.offsetX}px`;
  this.canvas.style.top = `${this.offsetY}px`;
    
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
    // this.keepPictureInView();
  }



  
}