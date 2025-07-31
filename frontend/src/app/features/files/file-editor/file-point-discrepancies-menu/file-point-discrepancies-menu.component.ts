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

@Component({
  selector: 'app-file-point-discrepancies-menu',
  standalone: true,
  imports: [EquipmentTableComponent, SearchableDropdownComponent],
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
  
    if (correspondingItem) {
      const sourceIndex = sourceTable.getItemIndex(item);
      const targetIndex = targetTable.getItemIndex(correspondingItem);

      console.log(`Swapping ${item.tagNumber} with ${correspondingItem.tagNumber}`);
      console.log(`Source table index: ${sourceIndex}, Target table index: ${targetIndex}`);
  
      if (sourceIndex !== -1 && targetIndex !== -1) {
        targetTable.scrollToIndex(targetIndex);
        sourceTable.scrollToIndex(sourceIndex);
      }
    }
  }
  
  private flipTagNumber(tagNumber: string): string {
    if (tagNumber.startsWith('01')) {
      return '02' + tagNumber.slice(2);
    } else if (tagNumber.startsWith('02')) {
      return '01' + tagNumber.slice(2);
    }
    return tagNumber; // Return original if it doesn't start with 01 or 02
  }


}