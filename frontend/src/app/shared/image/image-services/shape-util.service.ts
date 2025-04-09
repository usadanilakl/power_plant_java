import { Injectable } from '@angular/core';
import { Shape, RectangleShape, CircleShape, LineShape, TextShape } from '../../../models/shape.model';

@Injectable({
    providedIn: 'root'
  })
  export class ShapeUtilService {
    containsPoint(shape: Shape, x: number, y: number): boolean {
    switch (shape.type) {
        case 'rectangle':
        return this.containsPointRectangle(shape, x, y);
        case 'circle':
        return this.containsPointCircle(shape, x, y);
        case 'line':
        return this.containsPointLine(shape, x, y);
        case 'text':
        return this.containsPointText(shape, x, y);
        default:
        return false;
    }
    }

    private containsPointRectangle(shape: RectangleShape, x: number, y: number): boolean {
    return x >= shape.x && x <= shape.x + shape.width &&
            y >= shape.y && y <= shape.y + shape.height;
    }

    private containsPointCircle(shape: CircleShape, x: number, y: number): boolean {
    const dx = x - shape.x;
    const dy = y - shape.y;
    return dx * dx + dy * dy <= shape.radius * shape.radius;
    }

    private containsPointLine(shape: LineShape, x: number, y: number): boolean {
    // For simplicity, we'll check if the point is close to the line
    const tolerance = 5; // pixels
    const A = x - shape.startX;
    const B = y - shape.startY;
    const C = shape.endX - shape.startX;
    const D = shape.endY - shape.startY;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    const param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = shape.startX;
        yy = shape.startY;
    } else if (param > 1) {
        xx = shape.endX;
        yy = shape.endY;
    } else {
        xx = shape.startX + param * C;
        yy = shape.startY + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy) <= tolerance;
    }

    private containsPointText(shape: TextShape, x: number, y: number): boolean {
    // For simplicity, we'll treat text as a small rectangle around its position
    // You might want to refine this based on your text rendering
    const textWidth = 50; // Assume a fixed width for simplicity
    const textHeight = 20; // Assume a fixed height for simplicity
    return x >= shape.x && x <= shape.x + textWidth &&
            y >= shape.y - textHeight && y <= shape.y;
    }
}