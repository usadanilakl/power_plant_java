import { Injectable, signal } from "@angular/core";
import { Shape } from "../../../models/shape.model";
import { Tool } from "../../../models/tool.model";
import { ShapeFactoryService } from "./shape-factory.service";
import { ShapeUtilService } from "./shape-util.service";
import { BehaviorSubject } from "rxjs";
import { ZoomService } from "./zoom.service";
import e from "express";

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
  private cursorSubject = new BehaviorSubject<string>('default');
  cursor$ = this.cursorSubject.asObservable();
  isEditingEnabled = signal<boolean>(false);

  constructor(
    private shapeFactory: ShapeFactoryService,
    private shapeUtil: ShapeUtilService,
    private zoomService: ZoomService
  ) {}

  isDraggingShape = false;
  isRightClickDrawEnabled = true;
  isDragAndDropEnabled = false;
  private initialMouseX = 0;
  private initialMouseY = 0;
  private isDrawingWithRightClick = false;
  private isResizing = false;
  private resizeCorner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null = null;


  setShapes(shapes: Shape[]) {
    this.shapes = shapes;
  }
  
  setOriginalPictureDimensions(width: number, height: number) {
    this.originalPictureWidth = width;
    this.originalPictureHeight = height;
  }

  setCurrentTool(tool: Tool) {
    this.currentTool = tool;
  }

  setCurrentColor(color: string) {
    this.currentColor = color;
  }

  handleDoubleClick(event: MouseEvent) {
    this.selectShape(event);
  }

  handleLeftClick(event: MouseEvent, imageX: number, imageY: number) : boolean {
    if(this.selectedShape && this.isEditingEnabled()){
      if (this.isClickWithinSelectedShape(imageX, imageY)) {
        this.isDraggingShape = true;
        return true;
      }else if(this.isOverCorner(this.selectedShape,imageX, imageY)!==null) {
        const scale = this.zoomService.scale;
        this.initialMouseX = event.offsetX;
        this.initialMouseY = event.offsetY;
        this.resizeCorner = this.isOverCorner(this.selectedShape,imageX, imageY);
        this.isResizing = true;
        return true;
      }
    }else if (this.selectedShape){
      console.log('Editing is disabled. Cannot change shape with left click');
      this.isDragAndDropEnabled = true;
    }
    return false;
  }

  handleRightClick(event: MouseEvent) {
    if (this.isRightClickDrawEnabled && this.isEditingEnabled()) {
      this.drawWithRightClick(event);
    }
  }

  handleMouseMove(event: MouseEvent, x: number, y: number) {

    if (this.isDrawingWithRightClick && this.selectedShape) {
      this.resizeShape(event);
    }
    if(this.isResizing) {
      this.resizeExistingShape(event);
    }
    if(this.isDragAndDropEnabled) {
      this.moveShape(event,x,y);
    }

    const cursorStyle = this.pointerChangingCornerDetector(x,y);
    if(cursorStyle !== null) {
      this.cursorSubject.next(cursorStyle);
    } else if (this.isClickWithinSelectedShape(x, y)) {
      this.cursorSubject.next('move');
    } else {
      this.cursorSubject.next('default');
    }

  }

  handleMouseUp(event: MouseEvent) {
    this.isDraggingShape = false;
    this.isResizing = false;

    
    if (this.isDrawingWithRightClick) {
      this.isDrawingWithRightClick = false;
      this.selectedShape = null;
      // The shape is already saved in the shapes array, so we just need to notify subscribers
      this.shapesSubject.next(this.shapes);
    }

    this.isDragAndDropEnabled = false;
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

  private isOverCorner(shape: Shape, x: number, y: number): 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null {

    if (!this.selectedShape) {
      return null;
    }
    const scale = this.zoomService.scale;
    const cornerSize = 10 / scale; // Adjust this value to change the corner hit area

    if (shape.type === 'rectangle') {
      const rect = shape as any;
      if (Math.abs(x - rect.x) <= cornerSize && Math.abs(y - rect.y) <= cornerSize) return 'topLeft';
      if (Math.abs(x - (rect.x + rect.width)) <= cornerSize && Math.abs(y - rect.y) <= cornerSize) return 'topRight';
      if (Math.abs(x - rect.x) <= cornerSize && Math.abs(y - (rect.y + rect.height)) <= cornerSize) return 'bottomLeft';
      if (Math.abs(x - (rect.x + rect.width)) <= cornerSize && Math.abs(y - (rect.y + rect.height)) <= cornerSize) return 'bottomRight';
    }
    // Add similar checks for other shape types

    return null;
  }

  pointerChangingCornerDetector(x: number, y: number): string | null {
    if (!this.selectedShape) return null;
  
    const corner = this.isOverCorner(this.selectedShape, x, y);
    if (corner) {
      switch (corner) {
        case 'topLeft':
        case 'bottomRight':
          return 'nwse-resize';
        case 'topRight':
        case 'bottomLeft':
          return 'nesw-resize';
      }
    }
    return null;
  }

  dragSelectedShape(dx: number, dy: number): void {
    if (!this.selectedShape) {
      return;
    }
    if(!this.isEditingEnabled()) return;
    const scale = this.zoomService.scale;
    const _dx = dx / scale;
    const _dy = dy / scale;

  
    switch (this.selectedShape.type) {
      case 'rectangle':
        (this.selectedShape as any).x += _dx;
        (this.selectedShape as any).y += _dy;
        break;
      case 'circle':
        (this.selectedShape as any).x += _dx;
        (this.selectedShape as any).y += _dy;
        break;
      case 'line':
        (this.selectedShape as any).startX += _dx;
        (this.selectedShape as any).startY += _dy;
        (this.selectedShape as any).endX += _dx;
        (this.selectedShape as any).endY += _dy;
        break;
      case 'text':
        (this.selectedShape as any).x += _dx;
        (this.selectedShape as any).y += _dy;
        break;
    }
  
    // Notify subscribers of the change
    this.shapesSubject.next(this.shapes);
  }

  private resizeShape(event: MouseEvent) {
    if (!this.selectedShape) return;
    if(!this.isEditingEnabled()) return;

    const scale = this.zoomService.scale;
    const dx = (event.offsetX - this.initialMouseX) / scale;
    const dy = (event.offsetY - this.initialMouseY) / scale;

    switch (this.selectedShape.type) {
      case 'rectangle':
        const rect = this.selectedShape as any;
        rect.width = Math.abs(dx);
        rect.height = Math.abs(dy);
        if (dx < 0) rect.x = this.initialMouseX / scale + dx;
        if (dy < 0) rect.y = this.initialMouseY / scale + dy;
        break;
      // Add cases for other shape types as needed
    }

    // Notify subscribers of the change
    this.shapesSubject.next(this.shapes);
  }

  private resizeExistingShape(event: MouseEvent) {
    if (!this.selectedShape || !this.resizeCorner) return;
    if(!this.isEditingEnabled()) return;
  
    const scale = this.zoomService.scale;
    const dx = (event.offsetX - this.initialMouseX) / scale;
    const dy = (event.offsetY - this.initialMouseY) / scale;
  
    switch (this.selectedShape.type) {
      case 'rectangle':
        const rect = this.selectedShape as any;
        switch (this.resizeCorner) {
          case 'topLeft':
            rect.x += dx;
            rect.y += dy;
            rect.width -= dx;
            rect.height -= dy;
            break;
          case 'topRight':
            rect.y += dy;
            rect.width += dx;
            rect.height -= dy;
            break;
          case 'bottomLeft':
            rect.x += dx;
            rect.width -= dx;
            rect.height += dy;
            break;
          case 'bottomRight':
            rect.width += dx;
            rect.height += dy;
            break;
        }
        // Ensure width and height are always positive
        if (rect.width < 0) {
          rect.x += rect.width;
          rect.width = Math.abs(rect.width);
          this.resizeCorner = this.resizeCorner === 'topLeft' ? 'topRight' : 'bottomRight';
        }
        if (rect.height < 0) {
          rect.y += rect.height;
          rect.height = Math.abs(rect.height);
          this.resizeCorner = this.resizeCorner === 'topLeft' ? 'bottomLeft' : 'bottomRight';
        }
        break;
      // Add cases for other shape types as needed
    }
  
    // Update initial mouse position for smooth resizing
    this.initialMouseX = event.offsetX;
    this.initialMouseY = event.offsetY;
  
    // Notify subscribers of the change
    this.shapesSubject.next(this.shapes);
  }

  drawWithRightClick(event: MouseEvent) {
    if(!this.isEditingEnabled()) return;
    event.preventDefault(); // Prevent the default context menu
    const scale = this.zoomService.scale;
    
    // Create a new shape on right mouse button down
    this.selectedShape = this.shapeFactory.createRectangle(
      event.offsetX/scale,
      event.offsetY/scale,
      10, // Initial width
      10, // Initial height
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

  moveShape(event: MouseEvent, x: number, y: number){
    console.log('move shape',x,y);
  }

}