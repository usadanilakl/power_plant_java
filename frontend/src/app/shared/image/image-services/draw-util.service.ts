import { inject, signal } from "@angular/core";
import { RectangleShape, Shape } from "../../../models/shape.model";
import { Tool } from "../../../models/tool.model";
import { ShapeFactoryService } from "./shape-factory.service";
import { ShapeUtilService } from "./shape-util.service";
import { BehaviorSubject, Subject } from "rxjs";
import { CurrentEquipmentService } from "../../../services/current-items-services/current-equipment.service";

export class DrawUtilService {
  private shapes: Shape[] = [];
  private currentTool: Tool = Tool.Select;
  private currentColor: string = '#000000';
  private selectedShape: Shape | null = null;
  private shapesSubject = new BehaviorSubject<Shape[]>([]);
  shapes$ = this.shapesSubject.asObservable();
  private cursorSubject = new BehaviorSubject<string>('default');
  cursor$ = this.cursorSubject.asObservable();
  private img!: HTMLImageElement;
  private scale = 1;
  isEditingEnabled = signal<boolean>(false);

  currentEquipmentService = inject(CurrentEquipmentService);

  private newShapeSubject = new Subject<Shape | null>();
  newShape$ = this.newShapeSubject.asObservable();

  private selectedShapeSubject = new Subject<Shape | null>();
  selectedShape$ = this.selectedShapeSubject.asObservable();

  constructor(
    private shapeFactory: ShapeFactoryService,
    private shapeUtil: ShapeUtilService
  ) {}

  isDraggingShape = false;
  isRightClickDrawEnabled = true;
  isDragAndDropEnabled = false;
  private initialMouseX = 0;
  private initialMouseY = 0;
  private isDrawingWithRightClick = false;
  private isResizing = false;
  private resizeCorner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null = null;


  setScale(scale: number) {
    this.scale = scale;
  }

  getImgCoordinates(x: number, y: number): { x: number, y: number } {
    const imgRect = this.img.getBoundingClientRect()
    return {
      x: (x - imgRect.left) / this.scale,
      y: (y - imgRect.top) / this.scale
    };
  }

  init(img: HTMLImageElement, shapes: Shape[] = []): void {
    this.img = img;
    this.shapes = shapes;
    this.shapesSubject.next(this.shapes);

  }

  setShapes(shapes: Shape[]) {
    this.shapes = shapes;
    this.shapesSubject.next(this.shapes);
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

  handleRightClick(event: MouseEvent, imageX: number, imageY: number) {
    const rightClickedShape = this.getClickedShape(imageX, imageY);
    if(this.isEditingEnabled()){
      if (rightClickedShape){
        this.currentEquipmentService.setShapeRightClickDetector(rightClickedShape);
        return;
      }
      if (this.isRightClickDrawEnabled) {
        this.drawWithRightClick(event, imageX, imageY);
      }
    }else{
      console.log('Editing is disabled. Cannot create new shape with right click');
    }
  }

  handleMouseMove(event: MouseEvent, x: number, y: number) {

    if (this.isDrawingWithRightClick && this.selectedShape) {
      this.resizeShape(event);
    }
    if(this.isResizing) {
      this.resizeExistingShape(event);
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
    if((this.isResizing || this.isDraggingShape) && this.selectedShape && this.selectedShape.id && this.selectedShape.id !== 0) {
      // Update the shape's original picture dimensions
      this.selectedShape.originalPictureWidth = this.img.naturalWidth;
      this.selectedShape.originalPictureHeight = this.img.naturalHeight;

      // Now notify the currentEquipmentService
      this.currentEquipmentService.setResizeDetector(this.selectedShape);
    }

    this.isDraggingShape = false;
    this.isResizing = false;

    
    if (this.isDrawingWithRightClick) {
      this.isDrawingWithRightClick = false;
      if (this.selectedShape && 
          this.selectedShape.type === 'rectangle' && 
          (this.selectedShape as RectangleShape).width > 20 && 
          (this.selectedShape as RectangleShape).height > 20) {
        this.newShapeSubject.next(this.selectedShape);
        this.selectedShape = null;
        this.shapesSubject.next(this.shapes);
      } else {
        // Remove the shape if it doesn't meet the criteria
        if (this.selectedShape) {
          const index = this.shapes.indexOf(this.selectedShape);
          if (index > -1) {
            this.shapes.splice(index, 1);
          }
          this.selectedShape = null;
          this.shapesSubject.next(this.shapes);
        }
      }
    }

    if(this.isDragAndDropEnabled) { 
      this.isDragAndDropEnabled = false;
      console.log('Drag and drop enabled is now false');
    }
  }


  private createRectangle(event: MouseEvent) {
    const newRect = this.shapeFactory.createRectangle(
      event.offsetX,
      event.offsetY,
      50,
      100,
      this.currentColor,
      this.img.naturalWidth,
      this.img.naturalHeight
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
    this.selectedShapeSubject.next(this.selectedShape);
  
  }

  public updateSelectedShape(shape: Shape | null) {
    if (shape && !this.shapes.some(s => s.id === shape.id)) {
      this.shapes.push(shape);
    }
    // Deselect all shapes
    this.shapes.forEach(s => s.isSelected = false);
  
    // Set the new selected shape
    this.selectedShape = shape;
  
    if (this.selectedShape) {
      this.selectedShape.isSelected = true;
    }
  
    // Notify subscribers of the change
    this.shapesSubject.next(this.shapes);
  }

  updateSecondarySelectedShapes(ids: number[]){
    this.shapes.forEach(shape => {
      if (ids.includes(shape.id)) {
        shape.isSecondarySelected = true;
      } else {
        shape.isSecondarySelected = false;
      }
    });
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

  isClickWithinAnyShape(x: number, y: number): boolean {
    return this.shapes.some(shape => this.shapeUtil.containsPoint(shape, x, y));
  }

  getClickedShape(x: number, y: number): Shape | undefined {
    return this.shapes.find(shape => this.shapeUtil.containsPoint(shape, x, y));
  }

  private isOverCorner(shape: Shape, x: number, y: number): 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null {

    if (!this.selectedShape) {
      return null;
    }
    
    const cornerSize = 10 / this.scale; // Adjust this value to change the corner hit area

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
    if(!this.isEditingEnabled()) return;
    if (!this.selectedShape) {
      return;
    }
    const scale = this.scale;
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
  
    const scale = this.calculateScale();
    const imgRect = this.img.getBoundingClientRect();
    
    // Calculate the mouse position relative to the image
    const mouseX = (event.clientX - imgRect.left) / scale;
    const mouseY = (event.clientY - imgRect.top) / scale;
  
    switch (this.selectedShape.type) {
      case 'rectangle':
        const rect = this.selectedShape as any;
        
        // Calculate new width and height based on mouse position
        const newWidth = mouseX - rect.x;
        const newHeight = mouseY - rect.y;
  
        // Update rectangle dimensions
        rect.width = Math.abs(newWidth);
        rect.height = Math.abs(newHeight);
  
        // Adjust position if necessary
        if (newWidth < 0) rect.x = mouseX;
        if (newHeight < 0) rect.y = mouseY;
        break;
      // Add cases for other shape types as needed
    }
  
    // Notify subscribers of the change
    this.shapesSubject.next(this.shapes);
  }

  private resizeExistingShape(event: MouseEvent) {
    if (!this.selectedShape || !this.resizeCorner) return;
    if(!this.isEditingEnabled()) return;
  
    const scale = this.calculateScale();
    const imgRect = this.img.getBoundingClientRect();
    
    // Calculate the mouse position relative to the image
    const mouseX = (event.clientX - imgRect.left) / scale;
    const mouseY = (event.clientY - imgRect.top) / scale;
  
    switch (this.selectedShape.type) {
      case 'rectangle':
        const rect = this.selectedShape as any;
        switch (this.resizeCorner) {
          case 'topLeft':
            rect.width = rect.x + rect.width - mouseX;
            rect.height = rect.y + rect.height - mouseY;
            rect.x = mouseX;
            rect.y = mouseY;
            break;
          case 'topRight':
            rect.width = mouseX - rect.x;
            rect.height = rect.y + rect.height - mouseY;
            rect.y = mouseY;
            break;
          case 'bottomLeft':
            rect.width = rect.x + rect.width - mouseX;
            rect.height = mouseY - rect.y;
            rect.x = mouseX;
            break;
          case 'bottomRight':
            rect.width = mouseX - rect.x;
            rect.height = mouseY - rect.y;
            break;
        }
        // Ensure width and height are always positive
        if (rect.width < 0) {
          rect.x += rect.width;
          rect.width = Math.abs(rect.width);
          this.resizeCorner = this.resizeCorner === 'topLeft' ? 'topRight' : 
                              this.resizeCorner === 'bottomLeft' ? 'bottomRight' : this.resizeCorner;
        }
        if (rect.height < 0) {
          rect.y += rect.height;
          rect.height = Math.abs(rect.height);
          this.resizeCorner = this.resizeCorner === 'topLeft' ? 'bottomLeft' : 
                              this.resizeCorner === 'topRight' ? 'bottomRight' : this.resizeCorner;
        }
        break;
      // Add cases for other shape types as needed
    }
  
    // Notify subscribers of the change
    this.shapesSubject.next(this.shapes);
  }

  drawWithRightClick(event: MouseEvent, imgX: number, imgY: number) {
    if(!this.isEditingEnabled()) return;
    event.preventDefault(); // Prevent the default context menu
    const scale = this.calculateScale();
    
    // Create a new shape on right mouse button down
    this.selectedShape = this.shapeFactory.createRectangle(
      imgX,
      imgY,
      10, // Initial width
      10, // Initial height
      this.currentColor,
      this.img.naturalWidth,
      this.img.naturalHeight
    );
    this.shapes.push(this.selectedShape);
    this.isDrawingWithRightClick = true;
    this.initialMouseX = event.offsetX;
    this.initialMouseY = event.offsetY;
  }

  toggleRightClickDraw() {
    this.isRightClickDrawEnabled = !this.isRightClickDrawEnabled;
  }

  calculateScale(): number{
    const naturalWidth = this.img.naturalWidth;
    const currentWidth = this.img.getBoundingClientRect().width;
    return currentWidth / naturalWidth;
    // return naturalWidth / currentWidth;
  }



}