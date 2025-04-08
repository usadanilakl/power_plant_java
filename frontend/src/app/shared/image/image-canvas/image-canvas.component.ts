import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ShapeService } from '../image-services/shape.service';

@Component({
  selector: 'app-image-canvas',
  standalone: true,
  template: '<canvas #canvas class="interactive-image-canvas"></canvas>',
  styles: [':host { position: absolute; top: 0; left: 0; }']
})
export class ImageCanvasComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private shapeService: ShapeService) {}

  ngAfterViewInit() {
    this.drawShapes();
  }

  get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  drawShapes() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.shapeService.shapes.forEach(shape => {
      // Draw shapes based on their type (similar to the original drawShapes function)
    });
  }
}