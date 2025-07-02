import { Component, ElementRef, input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-image-zoom',
  imports: [],
  templateUrl: './image-zoom.component.html',
  styleUrl: './image-zoom.component.css'
})
export class ImageZoomComponent {
  imageUrl = input<string>()

  constructor() { }
//Zooming and panning functionality variables
  private scale: number = 1;
  private panning: boolean = false;
  private pointX: number = 0;
  private pointY: number = 0;
  private start: { x: number, y: number } = { x: 0, y: 0 };

//Click functionality variables
  private clickTimeout: any;
  private isDoubleClick: boolean = false;
  private lastClickTime: number = 0;
  private readonly DOUBLE_CLICK_DELAY = 300; // milliseconds

  @ViewChild('zoomElement') zoomElement!: ElementRef<HTMLDivElement>;
  @ViewChild('zoomOuter') zoomOuter!: ElementRef<HTMLDivElement>;

  transform() {
    if (this.zoomElement && this.zoomElement.nativeElement) {
      this.zoomElement.nativeElement.style.transform = `translate(${this.pointX}px, ${this.pointY}px) scale(${this.scale})`;
      // Call onZoomEnd after the transition is complete
      setTimeout(() => this.onZoomEnd(), 100);
    }
  }

  onMousedown(event: MouseEvent) {
    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - this.lastClickTime;
  
    if (timeSinceLastClick < this.DOUBLE_CLICK_DELAY) {
      this.isDoubleClick = true;
      clearTimeout(this.clickTimeout);
      this.onDoubleClick(event);
    } else {
      this.isDoubleClick = false;
      this.clickTimeout = setTimeout(() => {
        if (!this.isDoubleClick && event.button === 0) { // Left click
          this.onLeftClick(event);
        }else if (event.button === 1) { // Middle click
          this.onMiddleClick(event);
        } else if (event.button === 2) { // Right click 
          this.onRightClick(event);
        }
      }, this.DOUBLE_CLICK_DELAY);
    }
  
    this.lastClickTime = currentTime;
    event.preventDefault();
  }

  onLeftClick(event: MouseEvent) {
    this.start = { x: event.clientX - this.pointX, y: event.clientY - this.pointY };
    this.panning = true;
    this.toggleDraggingClass(true);
    this.setTransition('0s'); // Remove transition during dragging

  }

  onMiddleClick(event: MouseEvent) {
    console.log('middleclick');
  }

  onRightClick(event: MouseEvent) {
    console.log('rightclick');
  }
  
  onDoubleClick(event: MouseEvent) {
    console.log('doubleclick');
  }

  onMouseUp(event: MouseEvent) {
    this.panning = false;
    this.toggleDraggingClass(false);
    this.setTransition('0.1s'); // Restore transition after dragging
    
    clearTimeout(this.clickTimeout);
  }
  
  onWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomOuterRect = this.zoomOuter.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - zoomOuterRect.left;
    const mouseY = event.clientY - zoomOuterRect.top;
  
    const delta = event.deltaY > 0 ? 0.8 : 1.2;
    const newScale = Math.min(Math.max(0.1, this.scale * delta), 10);
  
    // Calculate the new position
    const newPosition = this.positioner(mouseX, mouseY, this.scale, newScale);
  
    // Set transition for smooth zooming
    this.setTransition('0.1s');
  
    // Update the scale and position
    this.scale = newScale;
    this.pointX = newPosition.left;
    this.pointY = newPosition.top;
  
    this.transform();
  
    // Remove transition after zooming
    setTimeout(() => this.setTransition('0s'), 100);
  }

  onMouseMove(event: MouseEvent) {
    event.preventDefault();
    if (this.panning) {
      this.setTransition('0s'); // Ensure no transition during dragging
      this.pointX = event.clientX - this.start.x;
      this.pointY = event.clientY - this.start.y;
      this.transform();
    }
  }





  private onZoomEnd() {
    this.setTransition('0s');
  }

  private positioner(mouseX: number, mouseY: number, oldScale: number, newScale: number): { left: number, top: number } {
    const containerRect = this.zoomOuter.nativeElement.getBoundingClientRect();
    const imageRect = this.zoomElement.nativeElement.getBoundingClientRect();
  
    // Calculate the position of the mouse relative to the image's current position
    const relativeX = (mouseX - this.pointX) / imageRect.width;
    const relativeY = (mouseY - this.pointY) / imageRect.height;
  
    // Calculate the new dimensions of the image
    const newWidth = imageRect.width * newScale / oldScale;
    const newHeight = imageRect.height * newScale / oldScale;
  
    // Calculate the new position to keep the mouse at the same relative point on the image
    let newLeft = mouseX - relativeX * newWidth;
    let newTop = mouseY - relativeY * newHeight;
  
    // Calculate the bounds for the image position
    const minLeft = Math.min(0, containerRect.width - newWidth);
    const maxLeft = Math.max(0, containerRect.width - newWidth);
    const minTop = Math.min(0, containerRect.height - newHeight);
    const maxTop = Math.max(0, containerRect.height - newHeight);
  
    // // Adjust the position to keep the image within the container bounds
    // newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
    // newTop = Math.max(minTop, Math.min(newTop, maxTop));
  
    return { left: newLeft, top: newTop };
  }

  private setTransition(duration: string, timingFunction: string = 'ease-out') {
      if (this.zoomElement && this.zoomElement.nativeElement) {
          this.zoomElement.nativeElement.style.setProperty('--transition-duration', duration);
          this.zoomElement.nativeElement.style.setProperty('--transition-timing-function', timingFunction);
      }
  }
  
  private toggleDraggingClass(isDragging: boolean) {
      if (this.zoomElement && this.zoomElement.nativeElement) {
          if (isDragging) {
              this.zoomElement.nativeElement.classList.add('dragging');
          } else {
              this.zoomElement.nativeElement.classList.remove('dragging');
          }
      }
  }










}

