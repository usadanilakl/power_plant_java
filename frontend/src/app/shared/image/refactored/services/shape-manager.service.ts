
import { Injectable, signal } from '@angular/core';
import { PIDSymbol } from './pid-symbols.service';
import { RfRectangleShape, RfShape, SVGSymbolShape } from '../models/fr-shape.model';

export interface ShapeManagerState {
  shapes: RfShape[];
  selectedShapeIds: number[];
  singleSelectedShapeId: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class ShapeManagerService {
  testShapes: RfShape[] = [
    {
      id: 1,
      fileId: 1,
      type: 'rectangle',
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      color: '#FF0000',
      originalPictureWidth: 1920,
      originalPictureHeight: 1080,
      originalWidth: 200,
      originalHeight: 200,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: 1920,
      currentImgHeigth: 1080,
      scaleToCurrentImage: 1,
    },
    {
      id: 2,
      fileId: 1,
      type: 'rectangle',
      x: 300,
      y: 200,
      width: 150,
      height: 100,
      color: '#00FF00',
      originalPictureWidth: 1920,
      originalPictureHeight: 1080,
      originalWidth: 150,
      originalHeight: 200,
      isSelected: true,
      isBulkSelected: false,
      currentImgWidth: 1920,
      currentImgHeigth: 1080,
      scaleToCurrentImage: 1,
    },
    {
      id: 3,
      fileId: 1,
      type: 'rectangle',
      x: 500,
      y: 100,
      width: 180,
      height: 120,
      color: '#0000FF',
      originalPictureWidth: 1920,
      originalPictureHeight: 1080,
      originalWidth: 180,
      originalHeight: 200,
      isSelected: false,
      isBulkSelected: true,
      currentImgWidth: 1920,
      currentImgHeigth: 1080,
      scaleToCurrentImage: 1,
    },
    {
      id: 4,
      fileId: 1,
      type: 'rectangle',
      x: 100,
      y: 300,
      width: 250,
      height: 80,
      color: '#FFA500',
      originalPictureWidth: 1920,
      originalPictureHeight: 1080,
      originalWidth: 250,
      originalHeight: 200,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: 1920,
      currentImgHeigth: 1080,
      scaleToCurrentImage: 1,
    },
  ];
  // State signals
  private shapesSignal = signal<RfShape[]>(this.testShapes);
  private selectedShapeIdsSignal = signal<number[]>([]);
  private singleSelectedShapeIdSignal = signal<number | null>(null);

  // Public readonly signals
  readonly shapes = this.shapesSignal.asReadonly();
  readonly selectedShapeIds = this.selectedShapeIdsSignal.asReadonly();
  readonly singleSelectedShapeId =
    this.singleSelectedShapeIdSignal.asReadonly();

  // Shape CRUD Operations

  addShape(shape: RfShape): void {
    this.shapesSignal.update((shapes) => [...shapes, shape]);
  }

  addShapes(newShapes: RfShape[]): void {
    this.shapesSignal.update((shapes) => [...shapes, ...newShapes]);
  }

  updateShape(shapeId: number, updates: Partial<RfShape>): void {
    this.shapesSignal.update((shapes) =>
      shapes.map((shape) => {
        if (shape.id !== shapeId) return shape;

        // Preserve the shape type and merge updates properly
        return { ...shape, ...updates } as RfShape;
      })
    );
  }

  replaceShape(shapeId: number, newShape: RfShape): void {
    this.shapesSignal.update((shapes) =>
      shapes.map((shape) => (shape.id === shapeId ? newShape : shape))
    );
  }

  deleteShape(shapeId: number): void {
    this.shapesSignal.update((shapes) =>
      shapes.filter((shape) => shape.id !== shapeId)
    );
  }

  deleteShapes(shapeIds: number[]): void {
    const idsSet = new Set(shapeIds);
    this.shapesSignal.update((shapes) =>
      shapes.filter((shape) => !idsSet.has(shape.id))
    );
  }

  getShapeById(shapeId: number): RfShape | undefined {
    return this.shapesSignal().find((s) => s.id === shapeId);
  }

  setShapes(shapes: RfShape[]): void {
    this.shapesSignal.set(shapes);
  }

  clearShapes(): void {
    this.shapesSignal.set([]);
  }

  // Selection Management

  selectShape(shapeId: number, exclusive: boolean = true): void {
    if (exclusive) {
      // Clear all selections first
      this.clearSelections();
      this.singleSelectedShapeIdSignal.set(shapeId);
    }

    this.selectedShapeIdsSignal.update((ids) =>
      ids.includes(shapeId) ? ids : [...ids, shapeId]
    );

    // Update the shape's selection state
    this.shapesSignal.update((shapes) =>
      shapes.map((shape) => {
        if (shape.id !== shapeId) return shape;
        return { ...shape, isSelected: true } as RfShape;
      })
    );
  }

  // Update deselectShape similarly:
  deselectShape(shapeId: number): void {
    this.selectedShapeIdsSignal.update((ids) =>
      ids.filter((id) => id !== shapeId)
    );

    if (this.singleSelectedShapeIdSignal() === shapeId) {
      this.singleSelectedShapeIdSignal.set(null);
    }

    this.shapesSignal.update((shapes) =>
      shapes.map((shape) => {
        if (shape.id !== shapeId) return shape;
        return { ...shape, isSelected: false } as RfShape;
      })
    );
  }

  // Update selectMultipleShapes:
  selectMultipleShapes(shapeIds: number[]): void {
    this.clearSelections();
    this.selectedShapeIdsSignal.set([...shapeIds]);

    const idsSet = new Set(shapeIds);
    this.shapesSignal.update((shapes) =>
      shapes.map(
        (shape) =>
          ({
            ...shape,
            isBulkSelected: idsSet.has(shape.id),
          } as RfShape)
      )
    );
  }

  toggleShapeSelection(shapeId: number): void {
    console.log('Toggle shape selection', shapeId);
    const isSelected = this.selectedShapeIdsSignal().includes(shapeId);
    if (isSelected) {
      this.deselectShape(shapeId);
    } else {
      this.selectShape(shapeId, false);
    }
  }

  clearSelections(): void {
    this.selectedShapeIdsSignal.set([]);
    this.singleSelectedShapeIdSignal.set(null);

    this.shapesSignal.update((shapes) =>
      shapes.map((shape) => ({
        ...shape,
        isSelected: false,
        isBulkSelected: false,
      }))
    );
  }

  // Utility Methods

  getNextShapeId(): number {
    const shapes = this.shapesSignal();
    return shapes.length > 0 ? Math.max(...shapes.map((s) => s.id)) + 1 : 1;
  }

  getSelectedShapes(): RfShape[] {
    const selectedIds = new Set(this.selectedShapeIdsSignal());
    return this.shapesSignal().filter((shape) => selectedIds.has(shape.id));
  }

  hasSelection(): boolean {
    return this.selectedShapeIdsSignal().length > 0;
  }

  // Shape Type Specific Operations

  createRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    imageWidth: number,
    imageHeight: number,
    color: string = '#FF0000'
  ): RfRectangleShape {
    return {
      id: this.getNextShapeId(),
      fileId: 0,
      type: 'rectangle',
      x,
      y,
      width,
      height,
      color,
      originalPictureWidth: imageWidth,
      originalPictureHeight: imageHeight,
      originalWidth: 200,
      originalHeight: 200,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: imageWidth,
      currentImgHeigth: imageHeight,
      scaleToCurrentImage: 1,
    };
  }

  createSymbol(
    symbol: PIDSymbol,
    x: number,
    y: number,
    imageWidth: number,
    imageHeight: number
  ): SVGSymbolShape {
    return {
      id: this.getNextShapeId(),
      fileId: 0,
      type: 'svg-symbol',
      symbolId: symbol.id,
      svgPath: symbol.svgPath,
      x: x - symbol.width / 2,
      y: y - symbol.height / 2,
      width: symbol.width,
      height: symbol.height,
      color: '#000000',
      rotation: 0,
      originalPictureWidth: imageWidth,
      originalPictureHeight: imageHeight,
      originalWidth: symbol.originalWidth,
      originalHeight: symbol.originalHeight,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: imageWidth,
      currentImgHeigth: imageHeight,
      scaleToCurrentImage: 1,
    };
  }

  // Bulk Operations

  updateAllShapesScale(newScale: number): void {
    this.shapesSignal.update((shapes) =>
      shapes.map((shape) => ({
        ...shape,
        scaleToCurrentImage: newScale,
      }))
    );
  }

  updateAllShapesImageSize(width: number, height: number): void {
    this.shapesSignal.update((shapes) =>
      shapes.map((shape) => ({
        ...shape,
        currentImgWidth: width,
        currentImgHeigth: height,
      }))
    );
  }
}