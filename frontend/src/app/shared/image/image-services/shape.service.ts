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

  scaleShape(shape: Shape, currentWidth: number, currentHeight: number): Shape {
    const scaleX = currentWidth / shape.originalPictureWidth;
    const scaleY = currentHeight / shape.originalPictureHeight;

    switch (shape.type) {
      case 'rectangle':
        return {
          ...shape,
          x: shape.x * scaleX,
          y: shape.y * scaleY,
          width: shape.width * scaleX,
          height: shape.height * scaleY
        };
      case 'circle':
        return {
          ...shape,
          x: shape.x * scaleX,
          y: shape.y * scaleY,
          radius: shape.radius * Math.min(scaleX, scaleY)
        };
      case 'line':
        return {
          ...shape,
          startX: shape.startX * scaleX,
          startY: shape.startY * scaleY,
          endX: shape.endX * scaleX,
          endY: shape.endY * scaleY
        };
      case 'text':
        return {
          ...shape,
          x: shape.x * scaleX,
          y: shape.y * scaleY
        };
    }
  }

  drawShapes(ctx: CanvasRenderingContext2D, currentWidth: number, currentHeight: number) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.shapes.forEach(shape => {
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.lineWidth = 2;

      const scaledShape = this.scaleShape(shape, currentWidth, currentHeight);

      switch (scaledShape.type) {
        case 'rectangle':
          ctx.strokeRect(
            scaledShape.x,
            scaledShape.y,
            scaledShape.width,
            scaledShape.height
          );
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(
            scaledShape.x,
            scaledShape.y,
            scaledShape.radius,
            0,
            2 * Math.PI
          );
          ctx.stroke();
          break;
        case 'line':
          ctx.beginPath();
          ctx.moveTo(scaledShape.startX, scaledShape.startY);
          ctx.lineTo(scaledShape.endX, scaledShape.endY);
          ctx.stroke();
          break;
        case 'text':
          ctx.font = '16px Arial';
          ctx.fillText(scaledShape.text, scaledShape.x, scaledShape.y);
          break;
      }
    });
  }
}