import { Component, EventEmitter, Output } from '@angular/core';
import { Tool } from '../../../models/tool.model';

@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css'
})
export class ToolbarComponent {
  @Output() toolSelected = new EventEmitter<Tool>();
  Tool = Tool; // Make the enum available in the template

  selectTool(tool: Tool) {
    this.toolSelected.emit(tool);
  }
}
