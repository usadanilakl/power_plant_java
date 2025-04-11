import { Injectable } from "@angular/core";
import { Shape } from "../../../models/shape.model";
import { Tool } from "../../../models/tool.model";
import { ShapeFactoryService } from "./shape-factory.service";
import { ShapeUtilService } from "./shape-util.service";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DrawingService {
  private shapes: Shape[] = [];
  private currentTool: Tool = Tool.Select;
  private currentColor: string = '#000000';
  private selectedShape: Shape | null = null;
  private originalPictureWidth: number = 0;
  private originalPictureHeight: number = 0;
  private shapesSubject = new BehaviorSubject<Shape[]>([]);
  shapes$ = this.shapesSubject.asObservable();

  constructor(
    private shapeFactory: ShapeFactoryService,
    private shapeUtil: ShapeUtilService
  ) {}

  isDraggingShape = false;
  isRightClickDrawEnabled = false;
  private initialMouseX = 0;
  private initialMouseY = 0;
  private isDrawingWithRightClick = false;

  setShapes(shapes: Shape[]) {
    this.shapes = shapes;
  }
  
  setOriginalPictureDimensions(width: number, height: number) {
    this.originalPictureWidth = width;
    this.originalPictureHeight = height;
  }

  setCurrentTool(tool: Tool) {
    console.log(`Setting current tool to ${tool}`);
    this.currentTool = tool;
  }

  setCurrentColor(color: string) {
    this.currentColor = color;
  }

  handleMouseDown(event: MouseEvent) {
    console.log(this.currentTool);
    switch (this.currentTool) {
      case Tool.Rectangle:
        console.log('Creating rectangle');
        this.createRectangle(event);
        break;
      case Tool.Select:
        this.selectShape(event);
        break;
      // Handle other tools...
    }
  }

  handleDoubleClick(event: MouseEvent) {
    this.selectShape(event);
  }

  handleMouseMove(event: MouseEvent) {
    if (this.isDrawingWithRightClick && this.selectedShape) {
      this.resizeShape(event);
    }

  }
  handleMouseUp(event: MouseEvent) {
    this.isDraggingShape = false;

    
    if (this.isDrawingWithRightClick) {
      this.isDrawingWithRightClick = false;
      this.selectedShape = null;
      // The shape is already saved in the shapes array, so we just need to notify subscribers
      this.shapesSubject.next(this.shapes);
    }
  }
  handleRightClick(event: MouseEvent) {
    if (this.isRightClickDrawEnabled) {
      this.drawWithRightClick(event);
    }
  }


  private createRectangle(event: MouseEvent) {
    const newRect = this.shapeFactory.createRectangle(
      event.offsetX,
      event.offsetY,
      50,
      100,
      this.currentColor,
      this.originalPictureWidth,
      this.originalPictureHeight
    );
    newRect.isSelected = true;
    this.shapes.push(newRect);
    this.selectedShape = newRect;
    this.shapesSubject.next(this.shapes);
  }

  private selectShape(event: MouseEvent) {
    console.log('Selecting shape');
    // Deselect all shapes
    this.shapes.forEach(shape => shape.isSelected = false);
    
    // Find and select the new shape
    this.selectedShape = this.shapes.find(shape => 
      this.shapeUtil.containsPoint(shape, event.offsetX, event.offsetY)
    ) || null;
    
    if (this.selectedShape) {
      this.selectedShape.isSelected = true;
    }
    
    // Notify subscribers of the change
    this.shapesSubject.next(this.shapes);
    
    console.log(this.selectedShape);
  }

  getSelectedShape(): Shape | null {
    return this.selectedShape;
  }

  isClickWithinSelectedShape(x: number, y: number): boolean {
    if (!this.selectedShape) {
      return false;
    }

    return this.shapeUtil.containsPoint(this.selectedShape, x, y);
  }

  dragSelectedShape(dx: number, dy: number): void {
    if (!this.selectedShape) {
      return;
    }
  
    switch (this.selectedShape.type) {
      case 'rectangle':
        (this.selectedShape as any).x += dx;
        (this.selectedShape as any).y += dy;
        break;
      case 'circle':
        (this.selectedShape as any).x += dx;
        (this.selectedShape as any).y += dy;
        break;
      case 'line':
        (this.selectedShape as any).startX += dx;
        (this.selectedShape as any).startY += dy;
        (this.selectedShape as any).endX += dx;
        (this.selectedShape as any).endY += dy;
        break;
      case 'text':
        (this.selectedShape as any).x += dx;
        (this.selectedShape as any).y += dy;
        break;
    }
  
    // Notify subscribers of the change
    this.shapesSubject.next(this.shapes);
  }

  private resizeShape(event: MouseEvent) {
    if (!this.selectedShape) return;
  
    const dx = event.offsetX - this.initialMouseX;
    const dy = event.offsetY - this.initialMouseY;
  
    switch (this.selectedShape.type) {
      case 'rectangle':
        (this.selectedShape as any).width = Math.abs(dx);
        (this.selectedShape as any).height = Math.abs(dy);
        if (dx < 0) (this.selectedShape as any).x = event.offsetX;
        if (dy < 0) (this.selectedShape as any).y = event.offsetY;
        break;
      // Add cases for other shape types as needed
    }
  
    // Notify subscribers of the change
    this.shapesSubject.next(this.shapes);
  }

  drawWithRightClick(event: MouseEvent) {
    event.preventDefault(); // Prevent the default context menu
    
    // Create a new shape on right mouse button down
    this.selectedShape = this.shapeFactory.createRectangle(
      event.offsetX,
      event.offsetY,
      0, // Initial width
      0, // Initial height
      this.currentColor,
      this.originalPictureWidth,
      this.originalPictureHeight
    );
    this.shapes.push(this.selectedShape);
    this.isDrawingWithRightClick = true;
    this.initialMouseX = event.offsetX;
    this.initialMouseY = event.offsetY;
  }

  toggleRightClickDraw() {
    this.isRightClickDrawEnabled = !this.isRightClickDrawEnabled;
  }

}