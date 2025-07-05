
import { Component, Input, Output, EventEmitter, input, output } from '@angular/core';
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
      (selectedItemsEvent)="onSelectedItems($event)"
      (rowHoveredEvent)="onEquipmentHover($event)"
    >
      <div table-controls>
        <ng-content select="[table-controls]"></ng-content>
      </div>
  </app-shared-table>
  `
})
export class EquipmentTableComponent {
  @Input() equipmentList: EquipmentDto[] = [];
  debounceTime = input<number>(500);
  @Output() equipmentClicked = new EventEmitter<EquipmentDto>();
  @Output() equipmentDoubleClicked = new EventEmitter<{item: EquipmentDto, column: Column}>();
  @Output() equipmentRightClicked = new EventEmitter<EquipmentDto>();
  @Output() equipmentHovered = new EventEmitter<EquipmentDto>();
  @Output() equipmentDeleted = new EventEmitter<string>();
  selectedItemsEvent = output<EquipmentDto[]>();

  // columns: Column[] = [
  //   { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
  //   { id: 'description', header: 'Description', accessorKey: 'description' },
  //   { id: 'specificLocation', header: 'Specific Location', accessorKey: 'specificLocation' },
  //   { id: 'eqType', header: 'Equipment Type', accessorKey: 'eqType.name' },
  //   { id: 'vendor', header: 'Vendor', accessorKey: 'vendor.name' },
  //   { id: 'location', header: 'Location', accessorKey: 'location.name' },
  //   { id: 'system', header: 'System', accessorKey: 'system.name' },
  //   { id: 'coordinates', header: 'Coordinates', accessorKey: 'coordinates' },
  //   { id: 'isVerified', header: 'Verified', accessorFn: (item: EquipmentDto) => item.isVerified ? 'Yes' : 'No' },
  //   { id: 'conflictStatus', header: 'Conflict Status', accessorKey: 'conflictStatus' },
  //   { id: 'lotoPointsCount', header: 'LOTO Points', accessorFn: (item: EquipmentDto) => item.lotoPoints.length.toString() }
  // ];

  columns: Column[] = [
    {
      id: 'isVerified',
      header: 'Verified',
      accessorFn: (item: EquipmentDto) => item.isVerified ? 'Yes' : 'No',
      conditionalStyling: (item: any, column: Column) => 
      item.isVerified ? { 'background-color': '#90EE90' } : { 'background-color': '#FFCCCB' }
    },
    {
      id: 'tagNumber',
      header: 'Tag Number',
      accessorKey: 'tagNumber',
      conditionalStyling: (item: any, column: Column) => 
        !item.tagNumber ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      conditionalStyling: (item: any, column: Column) => 
        !item.description ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
    },
    // {
    //   id: 'specificLocation',
    //   header: 'Specific Location',
    //   accessorKey: 'specificLocation',
    //   conditionalStyling: (item: any, column: Column) => 
    //     !item.specificLocation ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
    // },
    {
      id: 'eqType',
      header: 'Equipment Type',
      accessorKey: 'eqType.name',
      conditionalStyling: (item: any, column: Column) => 
        !item.eqType?.name ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
    },
    {
      id: 'vendor',
      header: 'Vendor',
      accessorKey: 'vendor.name',
      conditionalStyling: (item: any, column: Column) => 
        !item.vendor?.name ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
    },
    {
      id: 'location',
      header: 'Location',
      accessorKey: 'location.name',
      conditionalStyling: (item: any, column: Column) => 
        !item.location?.name ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
    },
    {
      id: 'system',
      header: 'System',
      accessorKey: 'system.name',
      conditionalStyling: (item: any, column: Column) => 
        !item.system?.name ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
    },
    // {
    //   id: 'coordinates',
    //   header: 'Coordinates',
    //   accessorKey: 'coordinates',
    //   conditionalStyling: (item: any, column: Column) => 
    //     !item.coordinates ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
    // },
    // {
    //   id: 'conflictStatus',
    //   header: 'Conflict Status',
    //   accessorKey: 'conflictStatus',
    //   conditionalStyling: (item: any, column: Column) => 
    //     !item.conflictStatus ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
    // },
    {
      id: 'lotoPointsCount',
      header: 'LOTO Points',
      accessorFn: (item: EquipmentDto) => item.lotoPoints?.length.toString() || '',
      conditionalStyling: (item: any, column: Column) => 
        item.lotoPoints.length === 0 ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
    }
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

    onSelectedItems = (items: EquipmentDto[]) => {
      this.selectedItemsEvent.emit(items);
    }
}