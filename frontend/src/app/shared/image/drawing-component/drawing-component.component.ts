import { Shape } from "../../../models/shape.model";
import { Tool } from "../../../models/tool.model";

@Component({
  selector: 'app-drawing',
  template: `
    <app-toolbar (toolSelected)="onToolSelected($event)"></app-toolbar>
    <app-color-picker (colorSelected)="onColorSelected($event)"></app-color-picker>
    <app-drawing-canvas></app-drawing-canvas>
    <app-shape-properties *ngIf="selectedShape" [shape]="selectedShape"></app-shape-properties>
  `
})
export class DrawingComponent {
  selectedShape: Shape | null = null;

  onToolSelected(tool: Tool) {
    this.drawingService.setCurrentTool(tool);
  }

  onColorSelected(color: string) {
    this.drawingService.setCurrentColor(color);
  }
}
