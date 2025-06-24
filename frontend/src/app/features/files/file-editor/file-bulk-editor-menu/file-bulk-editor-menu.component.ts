import { Component, input } from '@angular/core';
import { FloatingMenuComponent, MenuPosition } from "../../../../shared/menu/floating-menu/floating-menu.component";
import { Shape } from '../../../../models/shape.model';

@Component({
  selector: 'app-file-bulk-editor-menu',
  imports: [FloatingMenuComponent],
  templateUrl: './file-bulk-editor-menu.component.html',
  styleUrl: './file-bulk-editor-menu.component.css'
})
export class FileBulkEditorMenuComponent {
  
  shapes = input<Shape[]>([]);
  isOpen = input<boolean>(false);


  MenuPosition = MenuPosition;
handleClose() {
  // Handle menu close
}

getVisibleShapes():void {

}

getAllShapes(): void {
  
}

}
