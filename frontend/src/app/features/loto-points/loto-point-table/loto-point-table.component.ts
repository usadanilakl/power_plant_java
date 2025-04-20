import { ChangeDetectorRef, Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { Column } from '../../../models/column.model';
import { LotoPointDetailFormComponent } from "../loto-point-detail-form/loto-point-detail-form.component";
import { PopupComponent } from "../../../shared/popup/popup.component";
import { LotoPointService } from '../../../services/loto/loto-point.service';
import { BehaviorSubject, catchError, map, Observable, of, Subject, take, takeUntil, tap } from 'rxjs';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';

@Component({
  selector: 'app-loto-point-table',
  standalone: true,
  imports: [CommonModule, TableComponent, LotoPointDetailFormComponent, PopupComponent],
  templateUrl: './loto-point-table.component.html',
})
export class LotoPointTableComponent implements OnInit {
  private destroy$ = new Subject<void>();
  // @Input() clientSideData: LotoPointDto[] | null = null;
  @Input() submitCallback?: (data: any) => void;
  @Input() deleteCallback?: (id: number) => void;

  @Input() clientSideData$: Observable<LotoPointDto[]> | null = null;

  columns: Column[] = [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
    { id: 'description', header: 'Description', accessorKey: 'description' },
    { id: 'unit', header: 'Unit', accessorKey: 'unit' },
    { id: 'specificLocation', header: 'Specific Location', accessorKey: 'specificLocation' }
  ];

  selectedItem: LotoPointDto | null = null;
  isPopupOpen: boolean = false;
  LotoPointDetailFormComponent = LotoPointDetailFormComponent;

  isImagePopupOpen: boolean = false;
  selectedImagePath: string | null = null;

  private currentPage = 1;
  private pageSize = 50;
  private isLoading = false;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  private lotoPointService = inject(LotoPointService);

  private initialItemsSubject = new BehaviorSubject<LotoPointDto[]>([]);
  initialItems$ = this.initialItemsSubject.asObservable();

  private relatedImagesSubject = new BehaviorSubject<string[]>([]);
  relatedImages$ = this.relatedImagesSubject.asObservable();

  ngOnInit() {
    if (this.clientSideData$) {
      this.clientSideData$.pipe(
        takeUntil(this.destroy$) // Don't forget to implement OnDestroy and create this Subject
      ).subscribe(data => {
        if (data) {
          this.initialItemsSubject.next(data);
        }
      });
    } else {
      this.loadItems();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  loadItems(): void {
    if (this.clientSideData$) {
      this.updateClientSideData();
    } else {
      if (this.isLoading) return;
      this.isLoading = true;
  
      this.lotoPointService.getLotoPoints(this.currentPage, this.pageSize).pipe(
        map((response: SpringPaginatedResponse<LotoPointDto[]>) => 
          response.responseData.content.map(item => LotoPointDto.fromJson(item))
        ),
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
  }

  private performSearch(criteria: SearchCriteria) {
    if (this.clientSideData$) {
      this.updateClientSideData(criteria);
    } else {
      this.lotoPointService.searchLotoPoints(criteria, this.pageSize).pipe(
        map((response: SpringPaginatedResponse<LotoPointDto[]>) => 
          response.responseData.content.map(item => LotoPointDto.fromJson(item))
        ),
        tap(results => {
          if (criteria.page === 1) {
            this.initialItemsSubject.next(results);
          } else {
            const currentItems = this.initialItemsSubject.value;
            this.initialItemsSubject.next([...currentItems, ...results]);
          }
        }),
        catchError(error => {
          console.error('Error performing search:', error);
          return of(null);
        })
      ).subscribe();
    }
  }

  private updateClientSideData(criteria?: SearchCriteria) {
    if (!this.clientSideData$) return;
  
    this.clientSideData$.pipe(
      take(1),
      map(data => criteria ? this.applySearchCriteria(data, criteria) : data)
    ).subscribe(filteredData => {
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);
  
      if (this.currentPage === 1) {
        this.initialItemsSubject.next(paginatedData);
      } else {
        const currentItems = this.initialItemsSubject.value;
        this.initialItemsSubject.next([...currentItems, ...paginatedData]);
      }
    });
  }
  
  private applySearchCriteria(data: LotoPointDto[], criteria: SearchCriteria): LotoPointDto[] {
    return data.filter(item => {
      return Object.entries(criteria).every(([key, value]) => {
        if (key === 'page') return true;
        if (item.hasOwnProperty(key)) {
          const itemValue = item[key as keyof LotoPointDto];
          return itemValue && itemValue.toString().toLowerCase().includes(value.toLowerCase());
        }
        return false;
      });
    });
  }

  onFormSubmit(formData: Partial<LotoPointDto>) {
    if (!this.selectedItem) {
      console.error('No item selected for update');
      return;
    }
  
    console.log('Form submitted with data:', formData);
  
    if (this.submitCallback) {
      // Use the provided callback
      this.submitCallback(formData);
    } else {
      // Default behavior
      const updatedItem = new LotoPointDto({ ...this.selectedItem, ...formData });
      // Implement your default update logic here
      console.log('Updating item with default behavior:', updatedItem);
    }
  
    this.closePopup();
  }

  resetAndLoadItems(): void {
    this.currentPage = 1;
    if (this.clientSideData$) {
      this.clientSideData$.pipe(take(1)).subscribe(data => {
        this.initialItemsSubject.next(data);
      });
    } else {
      this.initialItemsSubject.next([]);
      this.loadItems();
    }
  }
  
  onSearch(criteria: SearchCriteria) {
    this.currentPage = 1;
    if (this.clientSideData$) {
      this.updateClientSideData(criteria);
    } else {
      this.performSearch(criteria);
    }
  }
  
  loadMoreItems(criteria: SearchCriteria | void) {
    if (this.clientSideData$) {
      this.currentPage++;
      this.updateClientSideData(criteria as SearchCriteria);
    } else {
      if (criteria && 'page' in criteria) {
        this.performSearch(criteria);
      } else {
        this.loadItems();
      }
    }
  }

  onItemClick = (item: LotoPointDto) => {
    this.selectedItem = item;
    this.isPopupOpen = true;
    this.lotoPointService.getRelatedImages(this.selectedItem.id).subscribe(
      (response: SpringApiResponse<string[]>) => {
        if (response.responseData) {
          const fullUrls = response.responseData.map(url => `http://localhost:8082/${url}`);
          this.relatedImagesSubject.next(fullUrls);
          console.log('Related images fetched successfully:', fullUrls);
        } else {
          this.relatedImagesSubject.next([]);
        }
      },
      error => {
        console.error('Error fetching related images:', error);
        this.relatedImagesSubject.next([]);
      }
    );
  }

  closePopup() {
    this.isPopupOpen = false;
    this.selectedItem = null;
  }

  onFormDelete() {
    if (this.selectedItem) {
      if (this.deleteCallback) {
        // Use the provided callback
        this.deleteCallback(this.selectedItem.id);
      } else {
        // Default behavior
        console.log('Deleting item with default behavior:', this.selectedItem.id);
        // Implement your default delete logic here
      }
      this.closePopup();
    }
  }
  
  onOpenImage() {
    // Implement open image logic here
  }

  closeImagePopup() {
    this.isImagePopupOpen = false;
    this.selectedImagePath = null;
  }
}


// import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TableComponent } from '../../../shared/table/table.component';
// import { Column } from '../../../models/column.model';
// import { LotoPointDetailFormComponent } from "../loto-point-detail-form/loto-point-detail-form.component";
// import { PopupComponent } from "../../../shared/popup/popup.component";
// import { LotoPointService } from '../../../services/loto/loto-point.service';
// import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
// import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
// import { LotoPointDto } from '../../../models/loto/loto-point.model';
// import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
// import { SearchCriteria } from '../../../models/api/search-criteria.model';

// @Component({
//   selector: 'app-loto-point-table',
//   standalone: true,
//   imports: [CommonModule, TableComponent, LotoPointDetailFormComponent, PopupComponent],
//   templateUrl: './loto-point-table.component.html',
// })
// export class LotoPointTableComponent implements OnInit {
//   columns: Column[] = [
//     { id: 'id', header: 'ID', accessorKey: 'id' },
//     { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
//     { id: 'description', header: 'Description', accessorKey: 'description' },
//     { id: 'unit', header: 'Unit', accessorKey: 'unit' },
//     { id: 'specificLocation', header: 'Specific Location', accessorKey: 'specificLocation' }
//   ];

//   selectedItem: LotoPointDto | null = null;
//   isPopupOpen: boolean = false;
//   LotoPointDetailFormComponent = LotoPointDetailFormComponent;

//   isImagePopupOpen: boolean = false;
//   selectedImagePath: string | null = null;

//   private currentPage = 1;
//   private pageSize = 50;
//   private isLoading = false;

//   constructor() {}

//   private lotoPointService = inject(LotoPointService);

//   private initialItemsSubject = new BehaviorSubject<LotoPointDto[]>([]);
//   initialItems$ = this.initialItemsSubject.asObservable();

//   private relatedImagesSubject = new BehaviorSubject<string[]>([]);
//   relatedImages$ = this.relatedImagesSubject.asObservable();

//   ngOnInit() {
//     this.loadItems();
//   }

//   loadItems(): void {
//     if (this.isLoading) return;
//     this.isLoading = true;

//     this.lotoPointService.getLotoPoints(this.currentPage, this.pageSize).pipe(
//       map((response: SpringPaginatedResponse<LotoPointDto[]>) => 
//         response.responseData.content.map(item => LotoPointDto.fromJson(item))
//       ),
//       tap(newItems => {
//         const currentItems = this.initialItemsSubject.value;
//         const updatedItems = this.currentPage === 1 ? newItems : [...currentItems, ...newItems];
//         this.initialItemsSubject.next(updatedItems);
//         this.currentPage++;
//         this.isLoading = false;
//       }),
//       catchError(error => {
//         console.error('Error loading items:', error);
//         this.isLoading = false;
//         return of([]);
//       })
//     ).subscribe();
//   }

//   private performSearch(criteria: SearchCriteria) {
//     this.lotoPointService.searchLotoPoints(criteria, this.pageSize).pipe(
//       map((response: SpringPaginatedResponse<LotoPointDto[]>) => 
//         response.responseData.content.map(item => LotoPointDto.fromJson(item))
//       ),
//       tap(results => {
//         if (criteria.page === 1) {
//           this.initialItemsSubject.next(results);
//         } else {
//           const currentItems = this.initialItemsSubject.value;
//           this.initialItemsSubject.next([...currentItems, ...results]);
//         }
//       }),
//       catchError(error => {
//         console.error('Error performing search:', error);
//         return of(null);
//       })
//     ).subscribe();
//   }

//   onFormSubmit(formData: Partial<LotoPointDto>) {
//     if (!this.selectedItem) {
//       console.error('No item selected for update');
//       return;
//     }

//     console.log('Form submitted with data:', formData);

//     // const updatedItem = new LotoPointDto({ ...this.selectedItem, ...formData });

//     // this.lotoPointService.updateLotoPoint(this.selectedItem.tagNumber, updatedItem).subscribe(
//     //   (response) => {
//     //     console.log('LOTO point updated successfully', response);
//     //     const updatedItems = this.initialItemsSubject.value.map(item => 
//     //       item.tagNumber === this.selectedItem?.tagNumber ? updatedItem : item
//     //     );
//     //     this.initialItemsSubject.next(updatedItems);
//     //     this.selectedItem = null;
//     //   },
//     //   error => {
//     //     console.error('Error updating LOTO point:', error);
//     //   }
//     // );
//   }

//   resetAndLoadItems(): void {
//     this.currentPage = 1;
//     this.initialItemsSubject.next([]);
//     this.loadItems();
//   }

//   onSearch(criteria: SearchCriteria) {
//     this.currentPage = 1;
//     this.performSearch(criteria);
//   }

//   loadMoreItems(criteria: SearchCriteria | void) {
//     if (criteria && 'page' in criteria) {
//       this.performSearch(criteria);
//     } else {
//       this.loadItems();
//     }
//   }

//   onItemClick = (item: LotoPointDto) => {
//     this.selectedItem = item;
//     this.isPopupOpen = true;
//     this.lotoPointService.getRelatedImages(this.selectedItem.id).subscribe(
//       (response: SpringApiResponse<string[]>) => {
//         if (response.responseData) {
//           const fullUrls = response.responseData.map(url => `http://localhost:8082/${url}`);
//           this.relatedImagesSubject.next(fullUrls);
//           console.log('Related images fetched successfully:', fullUrls);
//         } else {
//           this.relatedImagesSubject.next([]);
//         }
//       },
//       error => {
//         console.error('Error fetching related images:', error);
//         this.relatedImagesSubject.next([]);
//       }
//     );
//   }

//   closePopup() {
//     this.isPopupOpen = false;
//     this.selectedItem = null;
//   }

//   onFormDelete() {
//     if (this.selectedItem) {
//       // this.lotoPointService.deleteLotoPoint(this.selectedItem.tagNumber).subscribe(
//       //   () => {
//       //     console.log('LOTO point deleted successfully');
//       //     const updatedItems = this.initialItemsSubject.value.filter(item => item.tagNumber !== this.selectedItem?.tagNumber);
//       //     this.initialItemsSubject.next(updatedItems);
//       //     this.selectedItem = null;
//       //   },
//       //   error => console.error('Error deleting LOTO point:', error)
//       // );
//     }
//   }
  
// onOpenImage() {
//   // if (this.selectedItem && this.selectedItem.imagePath) {
//   //   this.selectedImagePath = this.selectedItem.imagePath;
//   //   this.isImagePopupOpen = true;
//   // } else {
//   //   console.log('No image available for this LOTO point');
//   // }
// }

// closeImagePopup() {
//   this.isImagePopupOpen = false;
//   this.selectedImagePath = null;
// }
// }