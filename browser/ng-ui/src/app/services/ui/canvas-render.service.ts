import { Injectable } from '@angular/core';
import { CircleShape, LineShape, RectangleShape, Shape, TextShape } from '../../models/ui/shape.model';

@Injectable({
  providedIn: 'root'
})
export class CanvasRenderService {
  private readonly HANDLE_SIZE = 8;
  private readonly SELECTED_LINE_WIDTH = 3;
  private readonly DEFAULT_LINE_WIDTH = 1;

  drawShapes(
    canvas: HTMLCanvasElement,
    shapes: Shape[],
    scale: number
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Unable to get 2D context from canvas');
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach(shape => this.drawShape(ctx, shape, scale));
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    scale: number
  ): void {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.isSelected ? this.SELECTED_LINE_WIDTH : this.DEFAULT_LINE_WIDTH;

    const scaledShape = this.scaleShape(shape, scale);

    switch (scaledShape.type) {
      case 'rectangle':
        this.drawRectangle(ctx, scaledShape as RectangleShape, shape, scale);
        break;
      case 'circle':
        this.drawCircle(ctx, scaledShape as CircleShape, scale);
        break;
      case 'line':
        this.drawLine(ctx, scaledShape as LineShape, scale);
        break;
      case 'text':
        this.drawText(ctx, scaledShape as TextShape, scale);
        break;
    }
  }

  private drawRectangle(
    ctx: CanvasRenderingContext2D,
    rect: RectangleShape,
    originalShape: Shape,
    scale: number
  ): void {
    ctx.strokeRect(
      rect.x * scale,
      rect.y * scale,
      rect.width,
      rect.height
    );

    if (originalShape.isBulkSelected) {
      this.drawSelectionHandles(ctx, originalShape, scale, 'orange');
    }

    if (originalShape.isSelected) {
      this.drawSelectionHandles(ctx, originalShape, scale);
    }
  }

  private drawCircle(
    ctx: CanvasRenderingContext2D,
    circle: CircleShape,
    scale: number
  ): void {
    ctx.beginPath();
    ctx.arc(
      circle.x * scale,
      circle.y * scale,
      circle.radius,
      0,
      2 * Math.PI
    );
    ctx.stroke();
  }

  private drawLine(
    ctx: CanvasRenderingContext2D,
    line: LineShape,
    scale: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(line.startX * scale, line.startY * scale);
    ctx.lineTo(line.endX * scale, line.endY * scale);
    ctx.stroke();
  }

  private drawText(
    ctx: CanvasRenderingContext2D,
    text: TextShape,
    scale: number
  ): void {
    ctx.font = `${16 * scale}px Arial`;
    ctx.fillText(text.text, text.x * scale, text.y * scale);
  }

  private scaleShape(shape: Shape, scale: number): Shape {
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

  private drawSelectionHandles(
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    scale: number,
    color: string = 'blue'
  ): void {
    ctx.fillStyle = color;
    const corners = this.getShapeCorners(shape);

    corners.forEach(([x, y]) => {
      ctx.fillRect(
        x * scale - this.HANDLE_SIZE / 2,
        y * scale - this.HANDLE_SIZE / 2,
        this.HANDLE_SIZE,
        this.HANDLE_SIZE
      );
    });
  }

  private getShapeCorners(shape: Shape): [number, number][] {
    switch (shape.type) {
      case 'rectangle':
        const rect = shape as RectangleShape;
        return [
          [rect.x, rect.y],
          [rect.x + rect.width, rect.y],
          [rect.x, rect.y + rect.height],
          [rect.x + rect.width, rect.y + rect.height]
        ];
      case 'circle':
        const circle = shape as CircleShape;
        return [
          [circle.x - circle.radius, circle.y - circle.radius],
          [circle.x + circle.radius, circle.y - circle.radius],
          [circle.x - circle.radius, circle.y + circle.radius],
          [circle.x + circle.radius, circle.y + circle.radius]
        ];
      case 'line':
        const line = shape as LineShape;
        return [
          [line.startX, line.startY],
          [line.endX, line.endY]
        ];
      default:
        return [];
    }
  }

  updateCanvasSize(canvas: HTMLCanvasElement, img: HTMLImageElement): void {
    const imgRect = img.getBoundingClientRect();
    canvas.width = imgRect.width;
    canvas.height = imgRect.height;
  }

  calculateScale(img: HTMLImageElement): number {
    const imgRect = img.getBoundingClientRect();
    return imgRect.width / img.naturalWidth;
  }
}