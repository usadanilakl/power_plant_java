import { Component, Input } from "@angular/core";
import { Shape } from "../../../models/shape.model";
import { Tool } from "../../../models/tool.model";
import { DrawingService } from "../image-services/drawing.service";
import { ToolbarComponent } from "../toolbar/toolbar.component";
import { ColorPickerComponent } from "../color-picker/color-picker.component";
import { ShapePropertiesComponent } from "../shape-properties/shape-properties.component";

@Component({
  selector: 'app-drawing',
  standalone: true,
  templateUrl: `./drawing.component.html`,
  imports: [ToolbarComponent, ColorPickerComponent, ShapePropertiesComponent]
})
export class DrawingComponent {
  @Input() imagePath: string = '';
  @Input() imageName: string = '';
  @Input() elements: any[] = [];
  selectedShape: Shape | null = null;

  constructor(private drawingService: DrawingService) {}

  onToolSelected(tool: Tool) {
    console.log('Selected tool:', tool);
    this.drawingService.setCurrentTool(tool);
  }

  onColorSelected(color: string) {
    this.drawingService.setCurrentColor(color);
  }

  updateSelectedShape() {
    this.selectedShape = this.drawingService.getSelectedShape();
  }
}