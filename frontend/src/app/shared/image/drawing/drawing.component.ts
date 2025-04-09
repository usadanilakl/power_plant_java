import { Component, Input } from "@angular/core";
import { Shape } from "../../../models/shape.model";
import { Tool } from "../../../models/tool.model";
import { DrawingService } from "../image-services/drawing.service";
import { ImageInteractiveComponent } from "../image-interactive/image-interactive.component";
import { ToolbarComponent } from "../toolbar/toolbar.component";
import { ColorPickerComponent } from "../color-picker/color-picker.component";
import { ShapePropertiesComponent } from "../shape-properties/shape-properties.component";

@Component({
  selector: 'app-drawing',
  standalone: true,
  templateUrl: `./drawing.component.html`,
  imports: [ImageInteractiveComponent, ToolbarComponent, ColorPickerComponent, ShapePropertiesComponent]
})
export class DrawingComponent {

  @Input() imagePath: string = '';
  @Input() imageName: string = '';
  @Input() elements: any[] = [];
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
