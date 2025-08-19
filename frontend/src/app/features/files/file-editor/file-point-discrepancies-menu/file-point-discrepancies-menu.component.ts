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
import { catchError, tap, throwError } from 'rxjs';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';

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

  @ViewChild('currentForm') currentForm!: EquipmentFormComponent;
  @ViewChild('otherForm') otherForm!: EquipmentFormComponent;

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
  
  private updateEquipment(equipment: EquipmentDto) {
    if (!equipment) {
      console.error('Invalid equipment');
      return;
    }
  
    const eq = new EquipmentDto({...equipment});
  
    this.equipmentService.updateEquipment(eq).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((resp) => {
        if (resp && resp.responseData) {
          const updatedEquipment = new EquipmentDto(resp.responseData);
          
          // Update the equipment in the appropriate list
          if (this.currentItems().some(item => item.id === updatedEquipment.id)) {
            this.currentItems.update(items => 
              items.map(item => item.id === updatedEquipment.id ? updatedEquipment : item)
            );
          } else if (this.otherUnitItems().some(item => item.id === updatedEquipment.id)) {
            this.otherUnitItems.update(items => 
              items.map(item => item.id === updatedEquipment.id ? updatedEquipment : item)
            );
          }
  
          // Update selected equipment if it's the one that was updated
          if (this.selectedCurrentEquipment()?.id === updatedEquipment.id) {
            this.selectedCurrentEquipment.set(updatedEquipment);
          } else if (this.selectedOtherEquipment()?.id === updatedEquipment.id) {
            this.selectedOtherEquipment.set(updatedEquipment);
          }
  
          // console.log('Equipment updated successfully:', updatedEquipment);
          // this.resetSelectedEquipment();
        } else {
          throw new Error('Invalid response from server');
        }
      }),
      catchError((error) => {
        console.error('Error updating equipment:', error);
        // You might want to show an error message to the user here
        return throwError(() => new Error('Failed to update equipment'));
      })
    ).subscribe();
  }
  
  public onSubmit(equipment: EquipmentDto) {
    this.updateEquipment(equipment);
    this.resetSelectedEquipment();
  }

  removeLotoPoint($event: LotoPointDto, isCurrentForm: boolean) {
    const currentEquipment = isCurrentForm ? this.selectedCurrentEquipment() : this.selectedOtherEquipment();
    
    if (!currentEquipment) {
      console.error('No equipment selected');
      return;
    }
  
    // Create a new equipment object with the updated LOTO points
    const updatedEquipment = new EquipmentDto({
      ...currentEquipment,
      lotoPoints: currentEquipment.lotoPoints?.filter(lp => lp.id !== $event.id) || []
    });
  
    // Update the equipment
    this.updateEquipment(updatedEquipment);
  
    // Update the selected equipment signal
    if (isCurrentForm) {
      this.selectedCurrentEquipment.set(updatedEquipment);
    } else {
      this.selectedOtherEquipment.set(updatedEquipment);
    }
  }
  
  addLotoPoint($event: LotoPointDto, isCurrentForm: boolean) {
    const currentEquipment = isCurrentForm ? this.selectedCurrentEquipment() : this.selectedOtherEquipment();
    
    if (!currentEquipment) {
      console.error('No equipment selected');
      return;
    }
  
    // Create a new equipment object with the updated LOTO points
    const updatedEquipment = new EquipmentDto({
      ...currentEquipment,
      lotoPoints: [...(currentEquipment.lotoPoints || []), $event]
    });
  
    // Update the equipment
    this.updateEquipment(updatedEquipment);
    // Update the selected equipment signal
    if (isCurrentForm) {
      this.selectedCurrentEquipment.set(updatedEquipment);
    } else {
      this.selectedOtherEquipment.set(updatedEquipment);
    }
  }
  
  
  /********************************************************************************************
  TABLE COLUMNS
  *********************************************************************************************/
  private getTagNumberStyling(item: EquipmentDto): { 'background-color': string } {
    if (!item.tagNumber) return { 'background-color': '#ffcccc' };
  
    const isCurrentUnit = this.currentItems().some(i => i.id === item.id);
    const flippedTagNumber = this.flipTagNumber(item.tagNumber);
    const oppositeArray = isCurrentUnit ? this.otherUnitItems() : this.currentItems();
    
    const correspondingItem = oppositeArray.find(i => i.tagNumber === flippedTagNumber);
    
    if (!correspondingItem) {
      return { 'background-color': '#ffff99' }; // Yellow if no corresponding item in the opposite array
    } else {
      return { 'background-color': '' }; // No background if a corresponding item is found
    }
  }
  private getDescriptionStyling(item: EquipmentDto): { 'background-color': string } {
    if (!item.description || !item.tagNumber) {
      return { 'background-color': '#ffcccc' }; // Red if description or tag number is missing
    }

    const isCurrentUnit = this.currentItems().some(i => i.id === item.id);
    const flippedTagNumber = this.flipTagNumber(item.tagNumber);
    const oppositeArray = isCurrentUnit ? this.otherUnitItems() : this.currentItems();
    
    const correspondingItem = oppositeArray.find(i => i.tagNumber === flippedTagNumber);

    if (!correspondingItem) {
      return { 'background-color': '#ffff99' }; // Yellow if no corresponding item in the opposite array
    }

    const fromUnit = item.tagNumber.startsWith('01') ? '01' : '02';
    const toUnit = fromUnit === '01' ? '02' : '01';
    const processedDescription = this.processDescription(item.description, fromUnit, toUnit);

    if (processedDescription !== correspondingItem.description) {
      return { 'background-color': '#ffa500' }; // Orange if descriptions don't match after processing
    }

    return { 'background-color': '' }; // No background if everything matches
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
          conditionalStyling: (item: EquipmentDto) => this.getTagNumberStyling(item)
        },
        
        {
          id: 'description',
          header: 'Description',
          accessorKey: 'description',
          conditionalStyling: (item: EquipmentDto) => this.getDescriptionStyling(item)
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