import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FloatingMenuComponent, MenuPosition } from "../../../../shared/menu/floating-menu/floating-menu.component";
import { Shape } from '../../../../models/shape.model';
import { CurrentFileService } from '../../../../services/current-file.service';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { CurrentEquipmentService } from '../../../../services/current-items-services/current-equipment.service';
import { debounceTime, Subject } from 'rxjs';
import { EquipmentTableComponent } from "../../../equipment/equipment-table/equipment-table.component";


  type DisplayData = {
    id: number;
    data: string;
  }
@Component({
  selector: 'app-file-bulk-editor-menu',
  imports: [FloatingMenuComponent, EquipmentTableComponent],
  templateUrl: './file-bulk-editor-menu.component.html',
  styleUrl: './file-bulk-editor-menu.component.css'
})
export class FileBulkEditorMenuComponent implements OnInit {

  private currentFileService = inject(CurrentFileService);
  private currentEquipmentService = inject(CurrentEquipmentService);

  private hoverSubject = new Subject<number | null>();
  
  shapes = input<Shape[]>([]);
  isOpen = input<boolean>(false);

  displayData = signal<DisplayData[]>([]);

  MenuPosition = MenuPosition;

  private lastSelectedKey: string | null = null;
  private isAscending = true;

  constructor() {
    this.hoverSubject.pipe(
      debounceTime(200)  // Adjust this value as needed (200ms debounce time)
    ).subscribe(shapeId => {
      this.currentEquipmentService.setCurrentShapeWithId(shapeId);
    });
  }
  ngOnInit(): void {
    this.currentFileService.getElementsToRender().subscribe(equipmentList => {
      this.equipmentData.set(equipmentList);
    });
  }

handleClose() {
  // Handle menu close
}

setDataToDisplay(key: string) {
  if (this.lastSelectedKey === key) {
    this.isAscending = !this.isAscending;
  } else {
    this.isAscending = true;
  }
  
  this.currentFileService.getElementsToRender().subscribe(elements => {
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
  updateSelectedShape(shapeId: number | null) {
    this.hoverSubject.next(shapeId);
  }



  //Table related methods
  equipmentData = signal<EquipmentDto[]>([]);

onEquipmentSelected(equipment: EquipmentDto) {
  // Handle equipment selection
}

onEquipmentEdit(equipment: EquipmentDto) {
  // Handle equipment edit (e.g., open edit form)
}

onEquipmentContextMenu(equipment: EquipmentDto) {
  // Handle right-click context menu
}

onEquipmentHover(equipment: EquipmentDto) {
  this.currentEquipmentService.setCurrentEquipment(equipment);
}

onEquipmentDelete(id: string) {
  // Handle equipment deletion
}

}
