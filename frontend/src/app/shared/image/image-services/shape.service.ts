import { Injectable } from '@angular/core';
import { Shape, RectangleShape, CircleShape, LineShape, TextShape } from '../../../models/shape.model';

@Injectable({
  providedIn: 'root'
})
export class ShapeService {
  shapes: Shape[] = [];

  initializeShapes(elements: any[], originalWidth: number, originalHeight: number) {
    this.shapes = elements.map(element => ({
      type: element.shapeType.name,
      color: element.color,
      ...element.shapeData,
      originalPictureWidth: originalWidth,
      originalPictureHeight: originalHeight
    })) as Shape[];
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
  
  drawShapes(ctx: CanvasRenderingContext2D, scale: number) {
    this.shapes.forEach(shape => {
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.lineWidth = 2;
  
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
}