import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ShapeService {
  shapes: any[] = [];

  initializeShapes(elements: any[], originalWidth: number, originalHeight: number) {
    this.shapes = elements.map(element => ({
      type: element.shapeType.name,
      color: element.color,
      ...element.shapeData,
      originalPictureWidth: originalWidth,
      originalPictureHeight: originalHeight
    }));
  }

  scaleShape(shape: any, currentWidth: number, currentHeight: number) {
    // Implement shape scaling logic here (similar to the original scaleShape function)
  }
}