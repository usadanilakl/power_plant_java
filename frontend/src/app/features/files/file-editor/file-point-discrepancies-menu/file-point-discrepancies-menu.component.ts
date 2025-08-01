import { Component, inject, signal, OnInit, DestroyRef, computed, ViewChild } from '@angular/core';
import { CurrentFileService } from '../../../../services/current-file.service';
import { EquipmentService } from '../../../../services/equipment.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { EquipmentTableComponent } from "../../../equipment/equipment-table/equipment-table.component";
import { FileService } from '../../../../services/file.service';
import { FileDto } from '../../../../models/file/file.model';
import { SpringPaginatedResponse } from '../../../../models/api/spring-pagenated.response.model';
import { SearchableDropdownComponent } from "../../../../shared/searchable-dropdown/searchable-dropdown.component";
import { Option } from '../../../../models/option.model';
import { EquipmentFormComponent } from "../../../equipment/equipment-form/equipment-form.component";
import { Column } from '../../../../models/column.model';

@Component({
  selector: 'app-file-point-discrepancies-menu',
  standalone: true,
  imports: [EquipmentTableComponent, SearchableDropdownComponent, EquipmentFormComponent],
  templateUrl: './file-point-discrepancies-menu.component.html',
  styleUrl: './file-point-discrepancies-menu.component.css'
})
export class FilePointDiscrepanciesMenuComponent implements OnInit {
  private currentFileService = inject(CurrentFileService);
  private equipmentService = inject(EquipmentService);
  private fileService = inject(FileService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('currentTable') currentTable!: EquipmentTableComponent;
  @ViewChild('otherTable') otherTable!: EquipmentTableComponent;

  currentItems = signal<EquipmentDto[]>([]);
  otherUnitItems = signal<EquipmentDto[]>([]);
  filesWithPoints = signal<FileDto[]>([]);
  fileOptions = computed(() => {
    return this.filesWithPoints().map(file => ({ label: `${file.fileNumber} - ${file.name}`, value: file.id } as Option));
  });
  selectedCurrentEquipment = signal<EquipmentDto | null>(null);
  selectedOtherEquipment = signal<EquipmentDto | null>(null);

  
  ngOnInit() {
    this.currentFileService.getElements().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (equipmentList: EquipmentDto[]) => {
        this.currentItems.set(equipmentList || []);
      },
      error: (error) => {
        console.error('Error fetching current items:', error);
      }
    });

    this.fileService.getFilesWithPoints().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response: SpringPaginatedResponse<FileDto>) => {
        this.filesWithPoints.set(response.responseData.content || []);
      },
      error: (error) => {
        console.error('Error fetching files with points:', error);
      }
    });
  
  }
  
  fetchOtherUnitItems(fileId: string | number): void {
    
      this.fileService.getEquipmentByFileId(fileId).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (response: SpringApiResponse<EquipmentDto[]>) => {
          if (response.responseData) {
            this.otherUnitItems.set(response.responseData);
          }
        },
        error: (error) => {
          console.error('Error fetching other unit items:', error);
        }
      });
    
  }

  // onItemClick(item: EquipmentDto, isCurrentTable: boolean) {
  //   if(!item || !item.tagNumber) return;
  //   const sourceTable = isCurrentTable ? this.currentTable : this.otherTable;
  //   const targetTable = isCurrentTable ? this.otherTable : this.currentTable;
  //   const targetItems = isCurrentTable ? this.otherUnitItems() : this.currentItems();
  
  //   const flippedTagNumber = this.flipTagNumber(item.tagNumber);
  //   const correspondingItem = targetItems.find(i => i.tagNumber === flippedTagNumber);
  
  //   if (correspondingItem) {
  //     const sourceIndex = sourceTable.getItemIndex(item);
  //     const targetIndex = targetTable.getItemIndex(correspondingItem);

  //     console.log(`Swapping ${item.tagNumber} with ${correspondingItem.tagNumber}`);
  //     console.log(`Source table index: ${sourceIndex}, Target table index: ${targetIndex}`);
  
  //     if (sourceIndex !== -1 && targetIndex !== -1) {
  //       targetTable.scrollToIndex(targetIndex);
  //       sourceTable.scrollToIndex(sourceIndex);
  //     }
  //   }
  // }  
  onItemClick(item: EquipmentDto, isCurrentTable: boolean) {
    if(!item || !item.tagNumber) return;
    const sourceTable = isCurrentTable ? this.currentTable : this.otherTable;
    const targetTable = isCurrentTable ? this.otherTable : this.currentTable;
    const targetItems = isCurrentTable ? this.otherUnitItems() : this.currentItems();
  
    const flippedTagNumber = this.flipTagNumber(item.tagNumber);
    const correspondingItem = targetItems.find(i => i.tagNumber === flippedTagNumber);
  
    this.selectedCurrentEquipment.set(item);
    this.selectedOtherEquipment.set(correspondingItem? correspondingItem : new EquipmentDto());
  }
resetSelectedEquipment() {
  this.selectedOtherEquipment.set(null);
  this.selectedCurrentEquipment.set(null);
}
  
  private flipTagNumber(tagNumber: string): string {
    if (tagNumber.startsWith('01')) {
      return '02' + tagNumber.slice(2);
    } else if (tagNumber.startsWith('02')) {
      return '01' + tagNumber.slice(2);
    }
    return tagNumber; // Return original if it doesn't start with 01 or 02
  }
private processDescription(description: string, fromUnit: string, toUnit: string): string {
  return description.split(" ")
    .map(e => e.startsWith(fromUnit) ? toUnit + e.substring(2) : e)
    .join(" ")
    .replace(new RegExp(`Unit${fromUnit[1]}`, 'g'), `Unit${toUnit[1]}`)
    .replace(new RegExp(`Unit ${fromUnit[1]}`, 'g'), `Unit ${toUnit[1]}`)
    .replace(new RegExp(`U${fromUnit[1]}`, 'g'), `U${toUnit[1]}`);
}
  
    columns: Column[] = [
      {
        id: 'tagNumber',
        header: 'Tag Number',
        accessorKey: 'tagNumber',
        conditionalStyling: (item: EquipmentDto) => {
          if (!item.tagNumber) return { 'background-color': '#ffcccc' };
          const flippedTagNumber = this.flipTagNumber(item.tagNumber);
          const otherUnitItem = this.otherUnitItems().find(i => i.tagNumber === flippedTagNumber);
          
          if (!otherUnitItem) {
            return { 'background-color': '#ffff99' };
          } else {
            return { 'background-color': '' };
          }
        }
      },
        {
          id: 'description',
          header: 'Description',
          accessorKey: 'description',
          conditionalStyling: (item: EquipmentDto) => {
            if (!item.description || !item.tagNumber) {
              return { 'background-color': '#ffcccc' }; // Red if description is missing
            }

            const flippedTagNumber = this.flipTagNumber(item.tagNumber);
            const otherUnitItem = this.otherUnitItems().find(i => i.tagNumber === flippedTagNumber);

            if (!otherUnitItem) {
              return { 'background-color': '#ffff99' }; // Yellow if no corresponding item in other unit
            }

            const fromUnit = item.tagNumber.startsWith('01') ? '01' : '02';
            const toUnit = fromUnit === '01' ? '02' : '01';
            const processedDescription = this.processDescription(item.description, fromUnit, toUnit);

            if (processedDescription !== otherUnitItem.description) {
              return { 'background-color': '#ffa500' }; // Orange if descriptions don't match after processing
            }

            return { 'background-color': '' }; // No background if everything matches
          }
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
        id: 'isVerified',
        header: 'Verified',
        accessorFn: (item: EquipmentDto) => item.isVerified ? 'Yes' : 'No',
        conditionalStyling: (item: any, column: Column) => 
        item.isVerified ? { 'background-color': '#90EE90' } : { 'background-color': '#FFCCCB' }
      },
      {
        id: 'lotoPointsCount',
        header: 'LOTO Points',
        accessorFn: (item: EquipmentDto) => item.lotoPoints?.length.toString() || '',
        conditionalStyling: (item: any, column: Column) => 
          item.lotoPoints.length === 0 ? { 'background-color': '#ffcccc' } : { 'background-color': '' }
      }
    ];


}