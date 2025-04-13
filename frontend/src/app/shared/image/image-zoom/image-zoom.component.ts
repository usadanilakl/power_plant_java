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

  scale: number = 1;
  panning: boolean = false;
  pointX: number = 0;
  pointY: number = 0;
  start: { x: number, y: number } = { x: 0, y: 0 };

  @ViewChild('zoomElement') zoomElement!: ElementRef<HTMLDivElement>;
  @ViewChild('zoomOuter') zoomOuter!: ElementRef<HTMLDivElement>;
  // transform() {
  //   if (this.zoomElement && this.zoomElement.nativeElement) {
  //     console.log('transform');
  //     this.zoomElement.nativeElement.style.transform = `translate(${this.pointX}px, ${this.pointY}px) scale(${this.scale})`;
  //   }
  // }

  transform() {
    if (this.zoomElement && this.zoomElement.nativeElement) {
      console.log('transform');
      this.zoomElement.nativeElement.style.transform = `translate(${this.pointX}px, ${this.pointY}px) scale(${this.scale})`;
      // Call onZoomEnd after the transition is complete
      setTimeout(() => this.onZoomEnd(), 100);
    }
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

  onMousedown(event: MouseEvent) {
    event.preventDefault();
    console.log('mousedown');
    this.start = { x: event.clientX - this.pointX, y: event.clientY - this.pointY };
    this.panning = true;
    this.toggleDraggingClass(true);
    this.setTransition('0s'); // Remove transition during dragging
  }
  
  onMouseUp(event: MouseEvent) {
    console.log('mouseup');
    this.panning = false;
    this.toggleDraggingClass(false);
    this.setTransition('0.1s'); // Restore transition after dragging
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

  // onMousedown(event: MouseEvent) {
  //   event.preventDefault();
  //   console.log('mousedown');
  //   this.start = { x: event.clientX-this.pointX, y: event.clientY-this.pointY };
  //   this.panning = true;
  // }

  // onMouseUp(event: MouseEvent) {
  //   console.log('mouseup');
  //   this.panning = false;
  // }

  // onMouseMove(event: MouseEvent) {
  //   event.preventDefault();
  //   if (this.panning) {
  //     this.pointX = event.clientX - this.start.x;
  //     this.pointY = event.clientY - this.start.y;
  //     this.transform();
  //   }
  // }

  // onWheel(event: WheelEvent) {
  //   event.preventDefault();
  //   const zoomOuterRect = this.zoomOuter.nativeElement.getBoundingClientRect();
  //   const mouseX = event.clientX - zoomOuterRect.left;
  //   const mouseY = event.clientY - zoomOuterRect.top;
  
  //   const delta = event.deltaY > 0 ? 0.8 : 1.2;
  //   const newScale = Math.min(Math.max(0.1, this.scale * delta), 10);
  
  //   // Calculate the new position
  //   const newPosition = this.positioner(mouseX, mouseY, this.scale, newScale);
  
  //   // Update the scale and position
  //   this.scale = newScale;
  //   this.pointX = newPosition.left;
  //   this.pointY = newPosition.top;
  
  //   this.transform();
  // }

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
  
    console.log('New dimensions:', { newWidth, newHeight });
    console.log('New position:', { left: newLeft, top: newTop });
    return { left: newLeft, top: newTop };
  }









}

