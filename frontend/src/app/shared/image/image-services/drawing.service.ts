@Injectable({
    providedIn: 'root'
  })
  export class DrawingService {
    private shapes: Shape[] = [];
    private currentTool: Tool = Tool.Select;
    private currentColor: string = '#000000';
    private selectedShape: Shape | null = null;
  
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
      const newRect = new Rectangle(event.offsetX, event.offsetY, 0, 0, this.currentColor);
      this.shapes.push(newRect);
      this.selectedShape = newRect;
    }
  
    private selectShape(event: MouseEvent) {
      this.selectedShape = this.shapes.find(shape => shape.containsPoint(event.offsetX, event.offsetY)) || null;
    }
  
    // Implement other methods for editing, moving, resizing, deleting shapes...
  }