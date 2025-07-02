import { Component, inject, OnInit } from '@angular/core';
import { FileDto } from '../../../../models/file/file.model';
import { Column } from '../../../../models/column.model';
import { FileDetailFormComponent } from '../../../files/file-detail-form/file-detail-form.component';
import { ImageInteractiveComponent } from '../../../../shared/image/image-interactive/image-interactive.component';
import { ImageZoomInteractiveComponent } from '../../../../shared/image/image-zoom-interactive/image-zoom-interactive.component';
import { DrawingComponent } from '../../../../shared/image/drawing/drawing.component';
import { BehaviorSubject, catchError, map, of, tap } from 'rxjs';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { FileService } from '../../../../services/file.service';
import { SpringPaginatedResponse } from '../../../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { TableComponent } from "../../../../shared/table/table.component";
import { PopupComponent } from "../../../../shared/popup/popup.component";

@Component({
  selector: 'app-new-file-table',
  imports: [TableComponent, PopupComponent],
  templateUrl: './new-file-table.component.html',
  styleUrl: './new-file-table.component.css'
})
export class NewFileTableComponent implements OnInit {
  columns: Column[] = [
    { id: 'name', header: 'File Name', accessorKey: 'name' },
    { id: 'fileType.name', header: 'File Type', accessorKey: 'fileType.name' },
    { id: 'fileNumber', header: 'File Number', accessorKey: 'fileNumber' },
    { id: 'relatedSystems', header: 'Systems', accessorKey: 'relatedSystems' }
  ];


  selectedItem: FileDto | null = null;
  isPopupOpen: boolean = false;
  FileDetailFormComponent = FileDetailFormComponent;
  ImageInteractiveComponent = ImageInteractiveComponent;
  ImageZoomInteractiveComponent = ImageZoomInteractiveComponent;
  DrawingComponent = DrawingComponent;
  isImagePopupOpen: boolean = false;
  selectedImagePath: string = '';

  private currentPage = 1;
  private pageSize = 50;
  private isLoading = false;

  constructor() {}

  private fileService = inject(FileService);

  private initialItemsSubject = new BehaviorSubject<any[]>([]);
  initialItems$ = this.initialItemsSubject.asObservable();

  private elementsSubject = new BehaviorSubject<EquipmentDto[]>([]);
  elements$ = this.elementsSubject.asObservable();


  ngOnInit() {
    this.loadItems();
  }

  loadItems(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.fileService.getFiles(this.currentPage, this.pageSize).pipe(
      map((response: SpringPaginatedResponse<FileDto[]>) => response.responseData.content),
      tap(newItems => {
        const currentItems = this.initialItemsSubject.value;
        const updatedItems = this.currentPage === 1 ? newItems : [...currentItems, ...newItems];
        this.initialItemsSubject.next(updatedItems);
        this.currentPage++;
        this.isLoading = false;
      }),
      catchError(error => {
        console.error('Error loading items:', error);
        this.isLoading = false;
        return of([]);
      })
    ).subscribe();
  }

  // If you need to reset and load from the beginning
  resetAndLoadItems(): void {
    this.currentPage = 1;
    this.initialItemsSubject.next([]);
    this.loadItems();
  }

  onSearch(criteria: SearchCriteria) {
    this.currentPage = 1;
    this.performSearch(criteria);
  }

  loadMoreItems(criteria: SearchCriteria | void) {
    if (criteria && 'page' in criteria) {
      this.performSearch(criteria);
    } else {
      this.loadItems();
    }
  }

  private performSearch(criteria: SearchCriteria) {
    this.fileService.searchFiles(criteria, this.pageSize).pipe(
      tap(results => {
        if (criteria.page === 1) {
          this.initialItemsSubject.next(results.responseData.content);
        } else {
          const currentItems = this.initialItemsSubject.value;
          this.initialItemsSubject.next([...currentItems, ...results.responseData.content]);
        }
      }),
      catchError(error => {
        console.error('Error performing search:', error);
        return of(null);
      })
    ).subscribe();
  }

  onItemClick = (item: any) => {
    this.selectedItem = item;
    this.selectedImagePath = item.fileLink;
    this.isPopupOpen = true;
  
    // Fetch elements
    this.fetchElements(item.id);
  }
  
  fetchElements(itemId: number) {
    this.fileService.getFileById(itemId.toString()).pipe(
      tap((response: SpringApiResponse<FileDto>) => {
        if (response && response.responseData) {
          // Update selectedItem with the full version
          this.selectedItem = response.responseData;
          
          // Extract elements from the points field
          const elements: EquipmentDto[] = this.selectedItem.points || [];
          this.elementsSubject.next(elements);
        } else {
          console.error('Unexpected response structure:', response);
          this.elementsSubject.next([]);
        }
      }),
      catchError(error => {
        console.error('Error fetching elements:', error);
        this.elementsSubject.next([]);
        return of(null);
      })
    ).subscribe();
  }

  closePopup() {
    this.isPopupOpen = false;
    this.selectedItem = null;
  }

  onFormSubmit(formData: any) {
    if (!this.selectedItem) {
      console.error('No item selected for update');
      return;
    }
    // Create a FormData object to send both file and JSON data
    const formDataToSend = new FormData();
  
    // Extract file from formData and remove it from the object
    let file: File | null = null;
    if (formData.file instanceof File) {
      file = formData.file;
      delete formData.file; // Remove file from formData
    }
  
    // Append the file if it exists
    if (file) {
      formDataToSend.append('file', file);
    }
  
    // Continue with the rest of your logic...
    // Merge the existing item data with the new form data
    const updatedItem = { ...this.selectedItem, ...formData };
  
    // Append the JSON data
    formDataToSend.append('fileDto', new Blob([JSON.stringify(new FileDto(updatedItem).toIdModel())], {
      type: "application/json"
    }));
  
    // Update in the backend
    this.fileService.updateFile(formDataToSend).subscribe(
      (response) => {
        
        // Update the item in the table
        const updatedItems = [...this.initialItemsSubject.value];
        const index = updatedItems.findIndex(item => item.id === this.selectedItem?.id);
        if (index !== -1) {
          updatedItems[index] = response.responseData; // Assuming the response contains the updated file data
          this.initialItemsSubject.next(updatedItems);
        }
  
        this.selectedItem = null; // Close the form
      },
      error => {
        console.error('Error updating file:', error);
      }
    );
  }

  onFormDelete() {
    if (this.selectedItem) {
      this.fileService.deleteFile(this.selectedItem.id.toString()).subscribe(
        () => {
          const updatedItems = this.initialItemsSubject.value.filter(item => item.id !== this.selectedItem?.id);
          this.initialItemsSubject.next(updatedItems);
          this.selectedItem = null; // Close the form
        },
        error => console.error('Error deleting file:', error)
      );
    }
  }
  
  onOpenImage() {
    if (this.selectedItem && this.selectedItem.fileLink) {
      this.selectedImagePath = this.selectedItem.fileLink;
      this.isImagePopupOpen = true;
    } else {
      console.log('Selected file is not an image or no file is selected');
    }
  }

  closeImagePopup() {
    this.isImagePopupOpen = false;
  }

}
