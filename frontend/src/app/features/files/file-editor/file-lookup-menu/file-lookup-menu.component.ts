import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { EquipmentTableComponent } from "../../../equipment/equipment-table/equipment-table.component";
import { CurrentFileService } from '../../../../services/current-file.service';
import { CurrentEquipmentService } from '../../../../services/current-items-services/current-equipment.service';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchableDropdownComponent } from "../../../../shared/searchable-dropdown/searchable-dropdown.component";
import { FileDto } from '../../../../models/file/file.model';
import { FileService } from '../../../../services/file.service';
import { Option } from '../../../../models/option.model';
import { SpringPaginatedResponse } from '../../../../models/api/spring-pagenated.response.model';
import { map } from 'rxjs';
import { EquipmentService } from '../../../../services/equipment.service';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';

@Component({
  selector: 'app-file-lookup-menu',
  imports: [EquipmentTableComponent, SearchableDropdownComponent],
  standalone: true,
  templateUrl: './file-lookup-menu.component.html',
  styleUrl: './file-lookup-menu.component.css'
})
export class FileLookupMenuComponent implements OnInit  {

  private currentFileService = inject(CurrentFileService);
  private fileService = inject(FileService);
  private currentEquipmentService = inject(CurrentEquipmentService);
  private equipmentService = inject(EquipmentService);
  private destroyRef = inject(DestroyRef);

  currentItems = signal<EquipmentDto[]>([]);
  searchedItems = signal<EquipmentDto[]>([]);
  filteredItems = signal<EquipmentDto[]>([]);
  filesWithPoints = signal<FileDto[]>([]);
  fileOptions = computed(() => {
    return this.filesWithPoints().map(file => ({ label: `${file.fileNumber} - ${file.name}`, value: file.id } as Option));
  });
  isGlobalSearch = signal<boolean>(true);

  ngOnInit(): void {
    this.currentFileService.getElements().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.currentItems.set(items || []);
    });

  this.fileService.getFilesWithPoints().pipe(
    map((response: SpringPaginatedResponse<FileDto>) => response.responseData.content || []),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe({
    next: (content: FileDto[]) => {
      this.filesWithPoints.set(content);
    },
    error: (error) => {
      console.error('Error fetching files with points:', error);
    }
  });
  }


handleFileSelect($event: any) {
  const fileId = $event;
  this.fileService.getFileById(fileId).pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(file => {
    this.searchedItems.set(file.responseData.points)
    this.filteredItems.set(file.responseData.points);
  });
  this.isGlobalSearch.set(false);
}

copyEquipmentToCurrent(equipment: EquipmentDto): void {
  const fileId = this.currentFileService.getCurrentFile();
  if (!fileId) {
    console.error('No current file selected');
    return;
  }
  if(!equipment.id){
    console.error('Invalid equipment');
    return;
  }
  this.equipmentService.copyEquipment(equipment.id, fileId.id).pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe({
    next: (response: SpringApiResponse<EquipmentDto>) => {
      this.currentFileService.addElementToRenderedArray(response.responseData);
    },
    error: (error) => {
      console.error('Error copying equipment:', error);
    }
  });
}

copyAllPoints() {
  if(this.searchedItems().length > 200)return;
  this.searchedItems().forEach(equipment => {
    this.copyEquipmentToCurrent(equipment);
  });
}

onSearchtable(searchCriteria: SearchCriteria) {
  if(!this.isGlobalSearch()){
    console.log('Searching within current items',searchCriteria);
    // Search within the existing items
    const filteredItems = this.searchedItems().filter(item => {
      if (searchCriteria.type === 'global' && searchCriteria.query) {
        // Global search
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchCriteria.query!.toLowerCase())
        );
      } else if (searchCriteria.type === 'column' && searchCriteria.filters) {
        // Column-specific search
        return Object.entries(searchCriteria.filters).every(([key, value]) => 
          String(item[key as keyof EquipmentDto]).toLowerCase().includes(value.toLowerCase())
        );
      }
      return true;
    });
    this.filteredItems.set(filteredItems);

  }else{
    this.equipmentService.searchEquipment(searchCriteria).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response =>{
      this.filteredItems.set(response.responseData.content);
    });
  }
}




}
