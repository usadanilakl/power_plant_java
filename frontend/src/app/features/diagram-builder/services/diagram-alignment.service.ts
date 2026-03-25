import { Injectable } from '@angular/core';
import { AlignmentType, DiagramPlacement, DistributeType } from '../models/diagram-placement.model';

export interface ShapeUpdate {
  id: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

@Injectable()
export class DiagramAlignmentService {

  alignShapes(shapes: DiagramPlacement[], alignment: AlignmentType): ShapeUpdate[] {
    if (shapes.length < 2) return [];

    const reference = shapes[0];
    const updates: ShapeUpdate[] = [];

    for (let i = 1; i < shapes.length; i++) {
      const shape = shapes[i];
      const update: ShapeUpdate = { id: shape.id };

      switch (alignment) {
        case 'left':
          update.x = reference.x;
          break;
        case 'right':
          update.x = reference.x + reference.width - shape.width;
          break;
        case 'top':
          update.y = reference.y;
          break;
        case 'bottom':
          update.y = reference.y + reference.height - shape.height;
          break;
        case 'h-center':
          update.x = reference.x + reference.width / 2 - shape.width / 2;
          break;
        case 'v-center':
          update.y = reference.y + reference.height / 2 - shape.height / 2;
          break;
      }

      updates.push(update);
    }

    return updates;
  }

  distributeShapes(shapes: DiagramPlacement[], direction: DistributeType): ShapeUpdate[] {
    if (shapes.length < 3) return [];

    const sorted = [...shapes].sort((a, b) =>
      direction === 'horizontal' ? a.x - b.x : a.y - b.y
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const updates: ShapeUpdate[] = [];

    if (direction === 'horizontal') {
      const totalSpace = (last.x + last.width) - first.x;
      const totalShapeWidth = sorted.reduce((sum, s) => sum + s.width, 0);
      const gap = (totalSpace - totalShapeWidth) / (sorted.length - 1);
      let currentX = first.x + first.width + gap;

      for (let i = 1; i < sorted.length - 1; i++) {
        updates.push({ id: sorted[i].id, x: currentX });
        currentX += sorted[i].width + gap;
      }
    } else {
      const totalSpace = (last.y + last.height) - first.y;
      const totalShapeHeight = sorted.reduce((sum, s) => sum + s.height, 0);
      const gap = (totalSpace - totalShapeHeight) / (sorted.length - 1);
      let currentY = first.y + first.height + gap;

      for (let i = 1; i < sorted.length - 1; i++) {
        updates.push({ id: sorted[i].id, y: currentY });
        currentY += sorted[i].height + gap;
      }
    }

    return updates;
  }

  matchSize(shapes: DiagramPlacement[], dimension: 'width' | 'height' | 'both'): ShapeUpdate[] {
    if (shapes.length < 2) return [];

    const reference = shapes[0];
    const updates: ShapeUpdate[] = [];

    for (let i = 1; i < shapes.length; i++) {
      const update: ShapeUpdate = { id: shapes[i].id };
      if (dimension === 'width' || dimension === 'both') {
        update.width = reference.width;
      }
      if (dimension === 'height' || dimension === 'both') {
        update.height = reference.height;
      }
      updates.push(update);
    }

    return updates;
  }
}
