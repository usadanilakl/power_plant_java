import { Component, ViewChild, ElementRef, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ShapeService } from '../image-services/shape.service';
import { Shape } from '../../../models/shape.model';

@Component({
  selector: 'app-image-canvas',
  standalone: true,
  template: '<canvas #canvas class="interactive-image-canvas"></canvas>',
  styles: [':host { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }']
})
export class ImageCanvasComponent implements AfterViewInit, OnChanges {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() width!: number;
  @Input() height!: number;
  @Input() shapes: Shape[] = [];
  @Input() offsetX = 0;
  @Input() offsetY = 0;
  @Input() scale = 1;

  private isCanvasReady = false;

  constructor(private shapeService: ShapeService) {}

  ngAfterViewInit() {
    this.isCanvasReady = true;
    this.updateCanvasSize();
    this.drawShapes();
  }

  getCanvas(): HTMLCanvasElement {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }
    return this.canvas;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.isCanvasReady) return;

    if (changes['width'] || changes['height']) {
      this.updateCanvasSize();
    }
    if (changes['shapes'] || changes['offsetX'] || changes['offsetY'] || changes['scale']) {
      this.drawShapes();
    }
  }

  updateCanvasSize(width?: number, height?: number) {
    this.width = width ?? this.width;
    this.height = height ?? this.height;
    
    const canvas = this.canvas;
    if (canvas) {
      canvas.width = this.width;
      canvas.height = this.height;
      this.drawShapes();
    } else {
      console.error('Canvas not available for size update');
    }
  }

  get canvas(): HTMLCanvasElement | null {
    return this.isCanvasReady ? this.canvasRef.nativeElement : null;
  }

  drawShapes() {
    if (!this.isCanvasReady) return;
    const canvas = this.canvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.shapeService.drawShapes(ctx, this.width, this.height);

    ctx.restore();
  }
}