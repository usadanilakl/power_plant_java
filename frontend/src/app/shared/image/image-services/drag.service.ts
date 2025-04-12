// import { Injectable } from '@angular/core';
// import { ZoomService } from './zoom.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class DragService {
//   isDragging = false;
//   private startX = 0;
//   private startY = 0;
//   private container!: HTMLElement;
//   private img!: HTMLImageElement;
//   private canvas!: HTMLCanvasElement;

//   constructor(private zoomService: ZoomService) {}

//   initialize(container: HTMLElement, img: HTMLImageElement, canvas: HTMLCanvasElement) {
//     this.container = container;
//     this.img = img;
//     this.canvas = canvas;
//   }

//   startDrag(clientX: number, clientY: number) {
//     this.isDragging = true;
//     this.startX = clientX - this.zoomService.offsetX;
//     this.startY = clientY - this.zoomService.offsetY;
//   }

//   drag(clientX: number, clientY: number) {
//     if (this.isDragging) {
//       const newOffsetX = clientX - this.startX;
//       const newOffsetY = clientY - this.startY;
      
//       this.zoomService.offsetX = newOffsetX;
//       this.zoomService.offsetY = newOffsetY;
      
//       this.zoomService.updateImageAndCanvasPosition();
//     }
//   }

//   endDrag() {
//     this.isDragging = false;
//   }
// }

import { Injectable } from '@angular/core';
import { ZoomService } from './zoom.service';

@Injectable({
  providedIn: 'root'
})
export class DragService {
  isDragging = false;
  private lastX = 0;
  private lastY = 0;

  constructor(private zoomService: ZoomService) {}

  initialize(container: HTMLElement, img: HTMLImageElement, canvas: HTMLCanvasElement) {
    // This method can remain empty if we're not using these elements directly in this service
  }

  startDrag(clientX: number, clientY: number) {
    this.isDragging = true;
    this.lastX = clientX;
    this.lastY = clientY;
  }

  drag(clientX: number, clientY: number) {
    const sensetivity = 0.5; // Adjust sensitivity as needed
    if (this.isDragging) {
      const dx = (clientX - this.lastX) * sensetivity;
      const dy = (clientY - this.lastY) * sensetivity;
      
      this.zoomService.moveBy(dx, dy);
      
      this.lastX = clientX;
      this.lastY = clientY;
    }
  }

  endDrag() {
    this.isDragging = false;
    this.zoomService.keepPictureInView();
  }
}