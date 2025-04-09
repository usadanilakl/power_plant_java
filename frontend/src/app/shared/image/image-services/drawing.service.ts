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

  handleMouseDown(event: MouseEvent) {
    switch (this.currentTool) {
      case Tool.Rectangle:
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
      0,
      0,
      this.currentColor,
      this.originalPictureWidth,
      this.originalPictureHeight
    );
    this.shapes.push(newRect);
    this.selectedShape = newRect;
    this.shapesSubject.next(this.shapes);
  }

  private selectShape(event: MouseEvent) {
    this.selectedShape = this.shapes.find(shape => 
      this.shapeUtil.containsPoint(shape, event.offsetX, event.offsetY)
    ) || null;
  }

  getSelectedShape(): Shape | null {
    return this.selectedShape;
  }
}