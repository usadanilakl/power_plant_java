import { Injectable } from '@angular/core';
import { RectangleShape, CircleShape, LineShape, TextShape, Shape } from '../../../models/shape.model';

@Injectable({
  providedIn: 'root'
})
export class ShapeFactoryService {
  createRectangle(x: number, y: number, width: number, height: number, color: string, originalPictureWidth: number, originalPictureHeight: number): RectangleShape {
    return {
      id: 0,
      type: 'rectangle',
      x,
      y,
      width,
      height,
      color,
      originalPictureWidth,
      originalPictureHeight,
      isSelected: false,
      isSecondarySelected: false,
      scaleToCurrentImage: 1,
      currentImgHeigth: 1,
      currentImgWidth: 1
    };
  }

  createCircle(x: number, y: number, radius: number, color: string, originalPictureWidth: number, originalPictureHeight: number): CircleShape {
    return {
      id: 0,
      type: 'circle',
      x,
      y,
      radius,
      color,
      originalPictureWidth,
      originalPictureHeight,
      isSelected: false,
      isSecondarySelected: false,
      scaleToCurrentImage: 1,
      currentImgHeigth: 1,
      currentImgWidth: 1
    };
  }

  // Add similar methods for creating LineShape and TextShape
}