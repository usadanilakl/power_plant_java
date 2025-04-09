import { Component } from "@angular/core";
import { Shape } from "../../../models/shape.model";
import { Tool } from "../../../models/tool.model";
import { DrawingService } from "../image-services/drawing.service";
import { ImageInteractiveComponent } from "../image-interactive/image-interactive.component";

@Component({
  selector: 'app-drawing',
  template: `
    <app-toolbar (toolSelected)="onToolSelected($event)"></app-toolbar>
    <app-color-picker (colorSelected)="onColorSelected($event)"></app-color-picker>
    <app-image-interactive 
      [imagePath]="imagePath" 
      [imageName]="imageName">
    </app-image-interactive>
    <app-shape-properties *ngIf="selectedShape" [shape]="selectedShape"></app-shape-properties>
  `,
  imports: [ImageInteractiveComponent]
})
export class DrawingComponent {
  imagePath = 'path/to/your/image.jpg';
  imageName = 'Your Image Name';
  selectedShape: Shape | null = null;

  constructor(private drawingService: DrawingService) {}

  onToolSelected(tool: Tool) {
    this.drawingService.setCurrentTool(tool);
  }

  onColorSelected(color: string) {
    this.drawingService.setCurrentColor(color);
  }

  // Add method to update selectedShape when a shape is selected
  updateSelectedShape() {
    this.selectedShape = this.drawingService.getSelectedShape();
  }
}
