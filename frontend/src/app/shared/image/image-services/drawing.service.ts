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

  // private selectShape(event: MouseEvent) {
  //   console.log('Selecting shape');
  //   this.selectedShape = this.shapes.find(shape => 
  //     this.shapeUtil.containsPoint(shape, event.offsetX, event.offsetY)
  //   ) || null;
  //   console.log(this.selectedShape);
  // }

  getSelectedShape(): Shape | null {
    return this.selectedShape;
  }
}