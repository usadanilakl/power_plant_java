import { Injectable } from '@angular/core';
import { ZoomService } from './zoom.service';

@Injectable({
  providedIn: 'root'
})
export class DragService {
  isDragging = false;
  private startX = 0;
  private startY = 0;
  private container!: HTMLElement;
  private img!: HTMLImageElement;
  private canvas!: HTMLCanvasElement;

  constructor(private zoomService: ZoomService) {}

  initialize(container: HTMLElement, img: HTMLImageElement, canvas: HTMLCanvasElement) {
    this.container = container;
    this.img = img;
    this.canvas = canvas;
  }

  startDrag(clientX: number, clientY: number) {
    this.isDragging = true;
    this.startX = clientX - this.zoomService.offsetX;
    this.startY = clientY - this.zoomService.offsetY;
  }

  drag(clientX: number, clientY: number) {
    if (this.isDragging) {
      this.zoomService.offsetX = clientX - this.startX;
      this.zoomService.offsetY = clientY - this.startY;
      this.zoomService.updateImagePosition();
    }
  }

  endDrag() {
    this.isDragging = false;
  }
}