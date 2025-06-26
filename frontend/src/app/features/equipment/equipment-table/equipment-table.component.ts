
import { Component, Input, Output, EventEmitter, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipmentDto } from '../../../models/equipment/equipment.model';
import { TableComponent } from '../../../shared/table/table.component';
import { Column } from '../../../models/column.model';

@Component({
  selector: 'app-equipment-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  template: `
    <app-shared-table
      [columns]="columns"
      [items]="equipmentList"
      [hoverDebounceTime]="debounceTime()"
      [clickCallback]="onEquipmentClick"
      [cellDoubleClickCallback]="onEquipmentDoubleClick"
      [rightClickCallback]="onEquipmentRightClick"
      [deleteItem]="onDeleteEquipment"
      (rowHoveredEvent)="onEquipmentHover($event)"
    ></app-shared-table>
  `
})
export class EquipmentTableComponent {
  @Input() equipmentList: EquipmentDto[] = [];
  debounceTime = input<number>(300);
  @Output() equipmentClicked = new EventEmitter<EquipmentDto>();
  @Output() equipmentDoubleClicked = new EventEmitter<{item: EquipmentDto, column: Column}>();
  @Output() equipmentRightClicked = new EventEmitter<EquipmentDto>();
  @Output() equipmentHovered = new EventEmitter<EquipmentDto>();
  @Output() equipmentDeleted = new EventEmitter<string>();

  columns: Column[] = [
    { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
    { id: 'description', header: 'Description', accessorKey: 'description' },
    { id: 'specificLocation', header: 'Specific Location', accessorKey: 'specificLocation' },
    { id: 'eqType', header: 'Equipment Type', accessorKey: 'eqType.name' },
    { id: 'vendor', header: 'Vendor', accessorKey: 'vendor.name' },
    { id: 'location', header: 'Location', accessorKey: 'location.name' },
    { id: 'system', header: 'System', accessorKey: 'system.name' },
    { id: 'coordinates', header: 'Coordinates', accessorKey: 'coordinates' },
    { id: 'isVerified', header: 'Verified', accessorFn: (item: EquipmentDto) => item.isVerified ? 'Yes' : 'No' },
    { id: 'conflictStatus', header: 'Conflict Status', accessorKey: 'conflictStatus' },
    { id: 'lotoPointsCount', header: 'LOTO Points', accessorFn: (item: EquipmentDto) => item.lotoPoints.length.toString() }
  ];

  onEquipmentClick = (item: EquipmentDto, event: MouseEvent) => {
    this.equipmentClicked.emit(item);
  }

  onEquipmentDoubleClick = (item: EquipmentDto, column: Column) => {
    this.equipmentDoubleClicked.emit({item, column});
  }

  onEquipmentRightClick = (item: EquipmentDto) => {
    this.equipmentRightClicked.emit(item);
  }

  onEquipmentHover = (item: EquipmentDto) => {
    this.equipmentHovered.emit(item);
  }

  onDeleteEquipment = (id: string) => {
    this.equipmentDeleted.emit(id);
  }
}