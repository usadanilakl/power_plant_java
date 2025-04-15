import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { Column } from '../../../models/column.model';
import { FileDetailFormComponent } from "../file-detail-form/file-detail-form.component";
import { PopupComponent } from "../../../shared/popup/popup.component";
import { FileService } from '../../../services/file.service';
import { ImageInteractiveComponent } from "../../../shared/image/image-interactive/image-interactive.component";
import { DrawingComponent } from '../../../shared/image/drawing/drawing.component';
import { ImageZoomInteractiveComponent } from '../../../shared/image/image-zoom-interactive/image-zoom-interactive.component';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';

@Component({
  selector: 'app-file-table',
  standalone: true,
  imports: [CommonModule, TableComponent, FileDetailFormComponent, PopupComponent, ImageInteractiveComponent],
  templateUrl: './file-table.component.html',
})
export class FileTableComponent implements OnInit {
  columns: Column[] = [
    { id: 'fileName', header: 'File Name', accessorKey: 'name' },
    { id: 'fileType', header: 'File Type', accessorKey: 'fileType.name' },
    { id: 'fileNumber', header: 'File Number', accessorKey: 'fileNumber' },
    { id: 'relatedSystems', header: 'Systems', accessorKey: 'relatedSystems' }
  ];


  selectedItem: any = null;
  isPopupOpen: boolean = false;
  FileDetailFormComponent = FileDetailFormComponent;
  ImageInteractiveComponent = ImageInteractiveComponent;
  ImageZoomInteractiveComponent = ImageZoomInteractiveComponent;
  DrawingComponent = DrawingComponent;
  isImagePopupOpen: boolean = false;
  selectedImagePath: string = '';

  constructor() {}

  private fileService = inject(FileService);
  private cdr = inject(ChangeDetectorRef); 

  private initialItemsSubject = new BehaviorSubject<any[]>([]);
  initialItems$ = this.initialItemsSubject.asObservable();

  private elementsSubject = new BehaviorSubject<any[]>([]);
  elements$ = this.elementsSubject.asObservable();

  ngOnInit() {
    this.loadInitialItems();
  }

  loadInitialItems() {
    this.fileService.getFiles().pipe(
      tap(response => console.log('Raw response:', response)),
      map((response: any) => {
        if (Array.isArray(response)) {
          return response;
        } else if (response && typeof response === 'object' && 'responseData' in response && 'content' in response.responseData) {
          return response.responseData.content;
        } else {
          console.error('Unexpected response structure:', response);
          return [];
        }
      }),
      tap(items => {
        console.log('Processed items:', items);
        this.initialItemsSubject.next(items); // Update the BehaviorSubject
        this.cdr.detectChanges(); // Trigger change detection
      }),
      catchError(error => {
        console.error('Error loading items:', error);
        this.initialItemsSubject.next([]); // Update with empty array on error
        return of([]);
      })
    ).subscribe();
  }


  loadMoreItems = async () => {
    const currentItems = this.initialItemsSubject.value;
    if (currentItems.length === 0) {
      console.error('No items to load more from');
      return [];
    }
    
    const lastItem = currentItems[currentItems.length - 1];
    const params = { lastId: lastItem.id };
    
    return new Promise<any[]>((resolve, reject) => {
      this.fileService.getFiles(params).subscribe(
        (data) => {
          const updatedItems = [...currentItems, ...data];
          this.initialItemsSubject.next(updatedItems);
          resolve(data);
        },
        (error) => {
          console.error('Error loading more items:', error);
          reject([]);
        }
      );
    });
  };

  searchItems = async (criteria: any) => {
    return new Promise<any[]>((resolve, reject) => {
      this.fileService.searchFiles(criteria).subscribe(
        (data) => resolve(data),
        (error) => {
          console.error('Error searching items:', error);
          reject([]);
        }
      );
    });
  };

  onItemClick = (item: any) => {
    this.selectedItem = item;
    // this.selectedImagePath = item.fileLink;
    this.isPopupOpen = true;
  
    // Fetch elements
    this.fetchElements(item.id);
  }
  
  fetchElements(itemId: number) {
    this.fileService.getFileById(itemId.toString()).pipe(
      tap(response => {
        if (response && response.responseData) {
          // Update selectedItem with the full version
          this.selectedItem = response.responseData;
          
          // Extract elements from the points field
          const elements = this.selectedItem.points || [];
          this.elementsSubject.next(elements);
          console.log('Elements:', elements);
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
  
    // Merge the existing item data with the new form data
    const updatedItem = { ...this.selectedItem, ...formData };
  
    // Update the item in the table
    const updatedItems = [...this.initialItemsSubject.value];
    const index = updatedItems.findIndex(item => item.id === this.selectedItem.id);
    if (index !== -1) {
      updatedItems[index] = updatedItem;
      this.initialItemsSubject.next(updatedItems);
    }
  
    // Update in the backend
    this.fileService.updateFile(this.selectedItem.id, updatedItem).subscribe(
      (response) => {
        console.log('File updated successfully', response);
        this.selectedItem = null; // Close the form
      },
      error => {
        console.error('Error updating file:', error);
        // Revert the change in the local array if the server update fails
        if (index !== -1) {
          const revertedItems = [...this.initialItemsSubject.value];
          revertedItems[index] = this.selectedItem;
          this.initialItemsSubject.next(revertedItems);
        }
      }
    );
  }

  onFormDelete() {
    if (this.selectedItem) {
      this.fileService.deleteFile(this.selectedItem.id).subscribe(
        () => {
          console.log('File deleted successfully');
          const updatedItems = this.initialItemsSubject.value.filter(item => item.id !== this.selectedItem.id);
          this.initialItemsSubject.next(updatedItems);
          this.selectedItem = null; // Close the form
        },
        error => console.error('Error deleting file:', error)
      );
    }
  }
  
  onOpenImage() {
    console.log('Opening image popup');
    if (this.selectedItem && this.selectedItem.fileLink) {
      console.log('Selected image:', this.selectedItem.fileLink);
      this.selectedImagePath = this.selectedItem.fileLink;
      this.isImagePopupOpen = true;
    } else {
      console.log('Selected file is not an image or no file is selected');
    }
  }

  closeImagePopup() {
    this.isImagePopupOpen = false;
  }

  mockData ='[{"id":5202,"name":"Hydrogen Supply Hose","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/001-GA-0004-001.01.INF.01.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"001-GA-0004-001.01.INF.01.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5203,"name":"Hydrogen Supply PR station","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/001-GA-0005-001.01.INF.01.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"001-GA-0005-001.01.INF.01.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5204,"name":"Electric Superheater","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.32.175-PD-0003-001.02.APP.02.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.175-PD-0003-001.02.APP.02.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5205,"name":"Sample Panel","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.34.100-PD-0002-001.04.APP.04.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.34.100-PD-0002-001.04.APP.04.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5206,"name":"Sample Panel TCU","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.34.100-PD-0003-001.02.INF.02.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.34.100-PD-0003-001.02.INF.02.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5207,"name":"HP phosphate pumps","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.34.125-PD-0001-001.06.APP.06.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.34.125-PD-0001-001.06.APP.06.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5208,"name":"Condensate Ammonia Pumps","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.34.125-PD-0003-001.06.APP.06.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.34.125-PD-0003-001.06.APP.06.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5209,"name":"IP phosphate pumps","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.34.125-PD-0002-001.06.APP.06.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.34.125-PD-0002-001.06.APP.06.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5210,"name":"Aux Boiler Ammonia Pumps","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Cleaver Brooks/94.03.34.125-PD-0004-001.06.APP.06.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.34.125-PD-0004-001.06.APP.06.01","vendor":{"id":5552,"name":"Cleaver Brooks","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5211,"name":"Ammonia Offload Station","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.34.125-PD-0005-001.06.APP.06.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.34.125-PD-0005-001.06.APP.06.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5212,"name":"Instrument Air Compressor","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.38.100.02-PD-0001-001.05.APP.05.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.38.100.02-PD-0001-001.05.APP.05.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5213,"name":"Instrument Air Driers","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.38.100.02-PD-0002-001.05.APP.05.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.38.100.02-PD-0002-001.05.APP.05.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5214,"name":"CEMS System Block Diagram","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.42.100-ES-0003-001.06.APP.06.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.42.100-ES-0003-001.06.APP.06.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5215,"name":"CEMS flowpath","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.42.100-GA-0003-001.06.APP.06.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.42.100-GA-0003-001.06.APP.06.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5216,"name":"CEMS heated probe","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.42.100-GA-0005-001.06.APP.06.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.42.100-GA-0005-001.06.APP.06.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5217,"name":"Fire Pumps","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.46.150-PD-0001-001.04.APP.04.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.46.150-PD-0001-001.04.APP.04.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5218,"name":"Fuel Gas Compressors","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.48.100-PD-0001-001.13.APP.13.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.48.100-PD-0001-001.13.APP.13.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5219,"name":"Nitrogen Generator","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.48.100-PD-0002-001.04.APP.04.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.48.100-PD-0002-001.04.APP.04.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5220,"name":"BFP Luebe Oil System","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.62.100-PD-0002-001.04.APP.04.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.62.100-PD-0002-001.04.APP.04.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5221,"name":"Condensate Pump","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.62.125-PD-0001-001.03.APP.03.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.62.125-PD-0001-001.03.APP.03.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5222,"name":"Condensate Pump","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.62.125-GA-0001-001.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.62.125-GA-0001-001","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5223,"name":"Condensate Pump Suction Strainers","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/20023894-HTT-1241.B.IFFR.B.01-copy.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"20023894-HTT-1241.B.IFFR.B.01-copy","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5224,"name":"Service Water Pumps","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.62.175-PD-0001-001.03.APP.03.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.62.175-PD-0001-001.03.APP.03.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5225,"name":"Demin Water Pumps","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.62.175-PD-0002-001.04.APP.04.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.62.175-PD-0002-001.04.APP.04.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5226,"name":"ST Drains Pit Pumps","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.62.175-PD-0003-001.03.APP.03.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.62.175-PD-0003-001.03.APP.03.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5227,"name":"Tempering Skid Pumps","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.62.175-PD-0004-001.06.APP.06.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.62.175-PD-0004-001.06.APP.06.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5228,"name":"HRSB Blowdown Pumps","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.62.175-PD-0007-001.03.VOID.03.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.62.175-PD-0007-001.03.VOID.03.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5229,"name":"Waste Water Pumps","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.62.175-PD-0008-001.03.VOID.03.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.62.175-PD-0008-001.03.VOID.03.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5230,"name":"HRSG sump Pumps","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.62.175-PD-0009-001.02.APP.02.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.62.175-PD-0009-001.02.APP.02.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5231,"name":"ST Piping Arrangement","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.64-PD-0003-001.01.INF.01.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.64-PD-0003-001.01.INF.01.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5232,"name":"Lube Oil Piping","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.64-PD-0004-001.06.INF.06.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.64-PD-0004-001.06.INF.06.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5233,"name":"All ST Piping","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/Extra/94.03.64-PD-0006-001.02.INF.02.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.64-PD-0006-001.02.INF.02.01","vendor":{"id":4153,"name":"Extra","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5234,"name":"P&ID Symbols","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0001-001.05.INF.05.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0001-001.05.INF.05.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5235,"name":"P&ID Symbols (Peerless)","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0020-001.03.INF.03.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0020-001.03.INF.03.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5236,"name":"P&ID Symbols (Peerless2)","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0021-001.01.INF.01.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0021-001.01.INF.01.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5237,"name":"Code Breakers","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0010-001.04.INF.04.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0010-001.04.INF.04.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5238,"name":"Overview","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0002-001.08.INF.08.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0002-001.08.INF.08.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5239,"name":"LP Economizer","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0014-001.07.INF.07.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0014-001.07.INF.07.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5240,"name":"LP drum","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0011-001.09.INF.09.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0011-001.09.INF.09.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5241,"name":"Lp Superheater","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0003-001.08.INF.08.02.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0003-001.08.INF.08.02","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5242,"name":"IP Economizer","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0004-001.08.INF.08.02.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0004-001.08.INF.08.02","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5243,"name":"IP Drum","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0005-001.08.INF.08.02.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0005-001.08.INF.08.02","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5244,"name":"IP Superheater","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0006-001.07.INF.07.02.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0006-001.07.INF.07.02","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5245,"name":"HRH steam","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0012-001.09.INF.09.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0012-001.09.INF.09.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5246,"name":"HP Economizer","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0007-001.08.INF.08.02.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0007-001.08.INF.08.02","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5247,"name":"HP Drum","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0008-001.09.INF.09.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0008-001.09.INF.09.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5248,"name":"HP Superheater","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0013-001.08.INF.08.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0013-001.08.INF.08.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5249,"name":"Blowdown Tnak","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0009-001.15.AAN.15.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0009-001.15.AAN.15.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5250,"name":"Nitrogen","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0019-001.03.INF.03.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0019-001.03.INF.03.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null},{"id":5251,"name":"Ammonia supply to AFCU","objectType":"FileObject","fileType":{"id":null,"name":"Value","category":null},"fileLink":"uploads/jpg/PID/John Cockerill/94.03.32.100-PD-0016-001.07.INF.07.01.jpg","baseLink":null,"folder":null,"system":null,"fileNumber":"94.03.32.100-PD-0016-001.07.INF.07.01","vendor":{"id":4155,"name":"John Cockerill","category":null},"points":null,"extension":null,"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"isVerified":false,"systems":null}]';
}