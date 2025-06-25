import { Component, inject, input, signal } from '@angular/core';
import { FloatingMenuComponent, MenuPosition } from "../../../../shared/menu/floating-menu/floating-menu.component";
import { Shape } from '../../../../models/shape.model';
import { CurrentFileService } from '../../../../services/current-file.service';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { CurrentEquipmentService } from '../../../../services/current-items-services/current-equipment.service';


  type DisplayData = {
    id: number;
    data: string;
  }
@Component({
  selector: 'app-file-bulk-editor-menu',
  imports: [FloatingMenuComponent],
  templateUrl: './file-bulk-editor-menu.component.html',
  styleUrl: './file-bulk-editor-menu.component.css'
})
export class FileBulkEditorMenuComponent {

  private currentFileService = inject(CurrentFileService);
  private currentEquipmentService = inject(CurrentEquipmentService);
  
  shapes = input<Shape[]>([]);
  isOpen = input<boolean>(false);

  displayData = signal<DisplayData[]>([]);

  MenuPosition = MenuPosition;

  private lastSelectedKey: string | null = null;
  private isAscending = true;

handleClose() {
  // Handle menu close
}

setDataToDisplay(key: string) {
  if (this.lastSelectedKey === key) {
    this.isAscending = !this.isAscending;
  } else {
    this.isAscending = true;
  }
  
  this.currentFileService.getElements().subscribe(elements => {
    const newDisplayData = elements.map(el => ({
      id: el.id,
      data: this.getNestedValue(el, key)
    }));
    this.displayData.set(newDisplayData);
    this.sortDataToDisplay(this.isAscending);
  });
  
  this.lastSelectedKey = key;
}

sortDataToDisplay(isAscending: boolean = true): void {
  console.log('Sorting data to display ' + isAscending);
  const sortedData = [...this.displayData()].sort((a, b) => 
    isAscending ? a.data.localeCompare(b.data) : b.data.localeCompare(a.data)
  );
  this.displayData.set(sortedData);
}

private getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : '';
  }, obj) || '';
}

  // Add this new method
  updateSelectedShape(shapeId: number | null) {
    this.currentEquipmentService.setCurrentShapeWithId(shapeId);
  }

}
