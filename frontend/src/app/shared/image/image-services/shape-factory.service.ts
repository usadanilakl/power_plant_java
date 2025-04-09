import { Injectable } from '@angular/core';
import { RectangleShape, CircleShape, LineShape, TextShape, Shape } from '../../../models/shape.model';

@Injectable({
  providedIn: 'root'
})
export class ShapeFactoryService {
  createRectangle(x: number, y: number, width: number, height: number, color: string, originalPictureWidth: number, originalPictureHeight: number): RectangleShape {
    return {
      type: 'rectangle',
      x,
      y,
      width,
      height,
      color,
      originalPictureWidth,
      originalPictureHeight
    };
  }

  createCircle(x: number, y: number, radius: number, color: string, originalPictureWidth: number, originalPictureHeight: number): CircleShape {
    return {
      type: 'circle',
      x,
      y,
      radius,
      color,
      originalPictureWidth,
      originalPictureHeight
    };
  }

  // Add similar methods for creating LineShape and TextShape
}