import { Component, ViewChild, ElementRef, AfterViewInit, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { ShapeService } from '../image-services/shape.service';
import { CircleShape, LineShape, RectangleShape, Shape, TextShape } from '../../../models/shape.model';
import { DrawingService } from '../image-services/drawing.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-image-canvas',
  standalone: true,
  template: '<canvas #canvas class="interactive-image-canvas"></canvas>',
  styleUrls: ['./image-canvas.component.css']
  // styles: [':host { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }']
})
export class ImageCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() width!: number;
  @Input() height!: number;
  @Input() shapes: Shape[] = [];
  @Input() offsetX = 0;
  @Input() offsetY = 0;
  @Input() scale = 1;

  private isCanvasReady = false;
  private shapesSubscription: Subscription;

  constructor(private shapeService: ShapeService, private drawingService: DrawingService) {
    this.shapesSubscription = this.drawingService.shapes$.subscribe(shapes => {
      this.shapes = shapes;
      console.log('shapes updated:', shapes);
      this.drawShapes();
    });
  }

  ngOnDestroy() {
    this.shapesSubscription.unsubscribe();
  }

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
  
    // this.shapeService.drawShapes(ctx, this.scale);
    this.draw(ctx, this.scale);
  
    ctx.restore();
  }

    draw(ctx: CanvasRenderingContext2D, scale: number) {
      this.shapes.forEach(shape => {
        ctx.strokeStyle = shape.color;
        ctx.fillStyle = shape.color;
        ctx.lineWidth = shape.isSelected ? 3 : 1;
    
        const scaledShape = this.scaleShape(shape, scale);
    
        switch (scaledShape.type) {
          case 'rectangle':
            const rect = scaledShape as RectangleShape;
            ctx.strokeRect(
              rect.x * scale,
              rect.y * scale,
              rect.width,
              rect.height
            );

            if (shape.isSelected) {
              // Draw selection handles
              this.drawSelectionHandles(ctx, shape);
            }
            break;
          case 'circle':
            const circle = scaledShape as CircleShape;
            ctx.beginPath();
            ctx.arc(
              circle.x * scale,
              circle.y * scale,
              circle.radius,
              0,
              2 * Math.PI
            );
            ctx.stroke();
            break;
          case 'line':
            const line = scaledShape as LineShape;
            ctx.beginPath();
            ctx.moveTo(line.startX * scale, line.startY * scale);
            ctx.lineTo(line.endX * scale, line.endY * scale);
            ctx.stroke();
            break;
          case 'text':
            const text = scaledShape as TextShape;
            ctx.font = `${16 * scale}px Arial`;
            ctx.fillText(text.text, text.x * scale, text.y * scale);
            break;
        }
      });
    }

    private drawSelectionHandles(ctx: CanvasRenderingContext2D, shape: Shape) {
      const handleSize = 8;
      ctx.fillStyle = 'blue';
    
      let corners: [number, number][] = [];
    
      switch (shape.type) {
        case 'rectangle':
          const rect = shape as RectangleShape;
          corners = [
            [rect.x, rect.y],
            [rect.x + rect.width, rect.y],
            [rect.x, rect.y + rect.height],
            [rect.x + rect.width, rect.y + rect.height]
          ];
          break;
        case 'circle':
          const circle = shape as CircleShape;
          corners = [
            [circle.x - circle.radius, circle.y - circle.radius],
            [circle.x + circle.radius, circle.y - circle.radius],
            [circle.x - circle.radius, circle.y + circle.radius],
            [circle.x + circle.radius, circle.y + circle.radius]
          ];
          break;
        case 'line':
          const line = shape as LineShape;
          corners = [
            [line.startX, line.startY],
            [line.endX, line.endY]
          ];
          break;
        // case 'text':
        //   const text = shape as TextShape;
        //   // Assuming text has width and height properties, adjust if not
        //   corners = [
        //     [text.x, text.y],
        //     [text.x + text.width, text.y],
        //     [text.x, text.y + text.height],
        //     [text.x + text.width, text.y + text.height]
        //   ];
        //   break;
      }
    
      corners.forEach(([x, y]) => {
        ctx.fillRect(
          x * this.scale - handleSize / 2,
          y * this.scale - handleSize / 2,
          handleSize,
          handleSize
        );
      });
    }

    scaleShape(shape: Shape, scale: number): Shape {
      switch (shape.type) {
        case 'rectangle':
          return {
            ...shape,
            width: shape.width * scale,
            height: shape.height * scale,
          };
        case 'circle':
          return {
            ...shape,
            radius: shape.radius * scale,
          };
        case 'line':
        case 'text':
          return { ...shape };
        default:
          return shape;
      }
    }
}