import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { Column } from '../../../models/column.model';
import { LotoDetailFormComponent } from "../loto-detail-form/loto-detail-form.component";
import { PopupComponent } from "../../../shared/popup/popup.component";
import { LotoService } from '../../../services/loto/loto.service';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { LotoDto } from '../../../models/loto/loto.model';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';

@Component({
  selector: 'app-loto-table',
  standalone: true,
  imports: [CommonModule, TableComponent, LotoDetailFormComponent, PopupComponent],
  templateUrl: './loto-table.component.html',
})
export class LotoTableComponent implements OnInit {
  columns: Column[] = [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    { id: 'docNum', header: 'LOTO Number', accessorKey: 'docNum' },
    { id: 'workScope', header: 'Description', accessorKey: 'workScope' },
    { id: 'status.name', header: 'Status', accessorKey: 'status.name' },
    { id: 'startDate', header: 'Start Date', accessorKey: 'startDate' },
    { id: 'endDate', header: 'End Date', accessorKey: 'endDate' }
  ];

  @ViewChild(TableComponent) tableComponent!: TableComponent;

  selectedItem: LotoDto | null = null;
  isPopupOpen: boolean = false;
  LotoDetailFormComponent = LotoDetailFormComponent;

  isImagePopupOpen: boolean = false;
  selectedImagePath: string | null = null;

  private currentPage = 1;
  private pageSize = 50;

  private lotoService = inject(LotoService);

  items$: Observable<LotoDto[]> = of([]);

  private relatedImagesSubject = new BehaviorSubject<string[]>([]);
  relatedImages$ = this.relatedImagesSubject.asObservable();

  ngOnInit() {
    this.items$ = this.loadItems();
  }

  loadItems(): Observable<LotoDto[]> {
    return this.lotoService.getLotos(this.currentPage, this.pageSize).pipe(
      map((response: SpringPaginatedResponse<LotoDto[]>) => 
        response.responseData.content.map(item => LotoDto.fromJson(item))
      ),
      catchError(error => {
        console.error('Error loading items:', error);
        return of([]);
      })
    );
  }

  private performSearch(criteria: SearchCriteria): Observable<LotoDto[]> {
    return this.lotoService.searchLotos(criteria, this.pageSize).pipe(
      map((response: SpringPaginatedResponse<LotoDto[]>) => 
        response.responseData.content.map(item => LotoDto.fromJson(item))
      ),
      catchError(error => {
        console.error('Error performing search:', error);
        return of([]);
      })
    );
  }

  onFormSubmit(formData: Partial<LotoDto>) {
    if (!this.selectedItem) {
      console.error('No item selected for update');
      return;
    }

    const updatedItem = new LotoDto({ ...this.selectedItem, ...formData });

    this.lotoService.updateLoto(updatedItem.toIdModel()).pipe(
      switchMap(() => this.items$),
      map(items => items.map(item => item.id === updatedItem.id ? updatedItem : item)),
      tap(updatedItems => {
        this.items$ = of(updatedItems);
        this.isPopupOpen = false;
        this.selectedItem = null;
      }),
      catchError(error => {
        console.error('Error updating LOTO:', error);
        return of(null);
      })
    ).subscribe();
  }

  onSearch(criteria: SearchCriteria) {
    this.currentPage = 1;
    this.items$ = this.performSearch(criteria);
  }

  loadMoreItems(criteria: SearchCriteria | void) {
    if (criteria && 'page' in criteria) {
      this.items$ = this.items$.pipe(
        switchMap(currentItems => this.performSearch(criteria).pipe(
          map(newItems => [...currentItems, ...newItems])
        ))
      );
    } else {
      this.currentPage++;
      this.items$ = this.items$.pipe(
        switchMap(currentItems => this.loadItems().pipe(
          map(newItems => [...currentItems, ...newItems])
        ))
      );
    }
  }

  onItemClick = (item: LotoDto) => {
    console.log('Item clicked:', item);
    this.selectedItem = item;
    console.log('selectedItem set:', this.selectedItem);
    this.isPopupOpen = true;
  
    this.lotoService.getLotoById(item.id.toString()).pipe(
      tap((response: SpringApiResponse<LotoDto>) => {
        if (response.responseData) {
          this.selectedItem = LotoDto.fromJson(response.responseData);
        } else {
          console.error('No data received for LOTO:', item.id);
        }
      }),
      switchMap(() => this.lotoService.getRelatedImages(item.id))
    ).subscribe(
      (imageResponse: SpringApiResponse<string[]>) => {
        if (imageResponse.responseData) {
          const fullUrls = imageResponse.responseData.map(url => `http://localhost:8082/${url}`);
          this.relatedImagesSubject.next(fullUrls);
        } else {
          this.relatedImagesSubject.next([]);
        }
      },
      error => {
        console.error('Error fetching LOTO details or related images:', error);
        this.relatedImagesSubject.next([]);
      }
    );
  }

  onItemDoubleClick = (item: any) => {
    console.log('Double clicked item:', item);
    // Implement your double-click logic here
  }
  
  onItemRightClick = (item: any) => {
    console.log('Right clicked item:', item);
    // Implement your right-click logic here, e.g., opening a context menu
  }
  
  onItemMiddleClick = (item: any) => {
    console.log('Middle clicked item:', item);
    // Implement your middle-click logic here
  }

  closePopup() {
    this.isPopupOpen = false;
    this.selectedItem = null;
  }

  onFormDelete() {
    if (this.selectedItem) {
      this.lotoService.deleteLoto(this.selectedItem.id.toString()).pipe(
        switchMap(() => this.items$),
        map(items => items.filter(item => item.id !== this.selectedItem?.id)),
        tap(updatedItems => {
          this.items$ = of(updatedItems);
          this.selectedItem = null;
          this.isPopupOpen = false;
        }),
        catchError(error => {
          console.error('Error deleting LOTO:', error);
          return of(null);
        })
      ).subscribe();
    }
  }

  closeImagePopup() {
    this.isImagePopupOpen = false;
    this.selectedImagePath = null;
  }

  createNewLoto() {
    this.selectedItem = new LotoDto();
    this.isPopupOpen = true;
  }
}

// import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TableComponent } from '../../../shared/table/table.component';
// import { Column } from '../../../models/column.model';
// import { LotoDetailFormComponent } from "../loto-detail-form/loto-detail-form.component";
// import { PopupComponent } from "../../../shared/popup/popup.component";
// import { LotoService } from '../../../services/loto/loto.service';
// import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap } from 'rxjs';
// import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
// import { LotoDto } from '../../../models/loto/loto.model';
// import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
// import { SearchCriteria } from '../../../models/api/search-criteria.model';

// @Component({
//   selector: 'app-loto-table',
//   standalone: true,
//   imports: [CommonModule, TableComponent, LotoDetailFormComponent, PopupComponent],
//   templateUrl: './loto-table.component.html',
// })
// export class LotoTableComponent implements OnInit {
//   columns: Column[] = [
//     { id: 'id', header: 'ID', accessorKey: 'id' },
//     { id: 'docNum', header: 'LOTO Number', accessorKey: 'docNum' },
//     { id: 'workScope', header: 'Description', accessorKey: 'workScope' },
//     { id: 'status.name', header: 'Status', accessorKey: 'status.name' },
//     { id: 'startDate', header: 'Start Date', accessorKey: 'startDate' },
//     { id: 'endDate', header: 'End Date', accessorKey: 'endDate' }
//   ];

//   @ViewChild(TableComponent) tableComponent!: TableComponent;

//   selectedItem: LotoDto | null = null;
//   isPopupOpen: boolean = false;
//   LotoDetailFormComponent = LotoDetailFormComponent;

//   isImagePopupOpen: boolean = false;
//   selectedImagePath: string | null = null;

//   private currentPage = 1;
//   private pageSize = 50;
//   private isLoading = false;

//   constructor() {}

//   private lotoService = inject(LotoService);

//   initialItemsSubject = new BehaviorSubject<LotoDto[]>([]);
//   initialItems$ = this.initialItemsSubject.asObservable();

//   private relatedImagesSubject = new BehaviorSubject<string[]>([]);
//   relatedImages$ = this.relatedImagesSubject.asObservable();

//   ngOnInit() {
//     this.loadItems();
//     this.initialItemsSubject.subscribe(items => {
//       if (this.tableComponent) {
//         this.tableComponent.items = items;
//       }
//     });

//   }

//   loadItems(): void {
//     if (this.isLoading) return;
//     this.isLoading = true;

//     this.lotoService.getLotos(this.currentPage, this.pageSize).pipe(
//       map((response: SpringPaginatedResponse<LotoDto[]>) => 
//         response.responseData.content.map(item => LotoDto.fromJson(item))
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
//     this.lotoService.searchLotos(criteria, this.pageSize).pipe(
//       map((response: SpringPaginatedResponse<LotoDto[]>) => 
//         response.responseData.content.map(item => LotoDto.fromJson(item))
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

//   onFormSubmit(formData: Partial<LotoDto>) {
//     if (!this.selectedItem) {
//       console.error('No item selected for update');
//       return;
//     }

//     console.log('Form submitted with data:', formData);

//     const updatedItem = new LotoDto({ ...this.selectedItem, ...formData });

//     this.lotoService.updateLoto(updatedItem.toIdModel()).subscribe(
//       (response) => {
//         console.log('LOTO updated successfully', response);
//         const updatedItems = this.initialItemsSubject.value.map(item => 
//           item.id === this.selectedItem?.id ? updatedItem : item
//         );

//         this.initialItemsSubject.next(updatedItems);
        
//         this.isPopupOpen = false;
//         this.selectedItem = null;
//       },
//       error => {
//         console.error('Error updating LOTO:', error);
//       }
//     );
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

//   onItemClick = (item: LotoDto) => {
//     // First, set the selectedItem to the simplified version from the table
//     this.selectedItem = item;
    
//     // Open the popup immediately to show a loading state
//     this.isPopupOpen = true;
  
//     // Fetch the full DTO
//     this.lotoService.getLotoById(item.id.toString()).pipe(
//       tap((response: SpringApiResponse<LotoDto>) => {
//         if (response.responseData) {
//           // Update the selectedItem with the full DTO
//           this.selectedItem = LotoDto.fromJson(response.responseData);
//         } else {
//           console.error('No data received for LOTO:', item.id);
//         }
//       }),
//       // After getting the full DTO, fetch related images
//       switchMap(() => this.lotoService.getRelatedImages(item.id))
//     ).subscribe(
//       (imageResponse: SpringApiResponse<string[]>) => {
//         if (imageResponse.responseData) {
//           const fullUrls = imageResponse.responseData.map(url => `http://localhost:8082/${url}`);
//           this.relatedImagesSubject.next(fullUrls);
//           console.log('Related images fetched successfully:', fullUrls);
//         } else {
//           this.relatedImagesSubject.next([]);
//         }
//       },
//       error => {
//         console.error('Error fetching LOTO details or related images:', error);
//         this.relatedImagesSubject.next([]);
//       }
//     );
//   }

//   onItemDoubleClick = (item: any) => {
//     console.log('Double clicked item:', item);
//     // Implement your double-click logic here
//   }
  
//   onItemRightClick = (item: any, event: MouseEvent) => {
//     console.log('Right clicked item:', item, 'at position:', event.clientX, event.clientY);
//     // Implement your right-click logic here, e.g., opening a context menu
//   }
  
//   onItemMiddleClick = (item: any, event: MouseEvent) => {
//     console.log('Middle clicked item:', item);
//     // Implement your middle-click logic here
//   }

//   // onItemClick = (item: LotoDto) => {
//   //   this.selectedItem = item;
//   //   this.isPopupOpen = true;
//   //   this.lotoService.getRelatedImages(this.selectedItem.id).subscribe(
//   //     (response: SpringApiResponse<string[]>) => {
//   //       if (response.responseData) {
//   //         const fullUrls = response.responseData.map(url => `http://localhost:8082/${url}`);
//   //         this.relatedImagesSubject.next(fullUrls);
//   //         console.log('Related images fetched successfully:', fullUrls);
//   //       } else {
//   //         this.relatedImagesSubject.next([]);
//   //       }
//   //     },
//   //     error => {
//   //       console.error('Error fetching related images:', error);
//   //       this.relatedImagesSubject.next([]);
//   //     }
//   //   );
//   // }

//   closePopup() {
//     this.isPopupOpen = false;
//     this.selectedItem = null;
//   }

//   onFormDelete() {
//     if (this.selectedItem) {
//       this.lotoService.deleteLoto(this.selectedItem.id.toString()).subscribe(
//         () => {
//           console.log('LOTO deleted successfully');
//           const updatedItems = this.initialItemsSubject.value.filter(item => item.id !== this.selectedItem?.id);
//           this.initialItemsSubject.next(updatedItems);
//           this.selectedItem = null;
//         },
//         error => console.error('Error deleting LOTO:', error)
//       );
//     }
//   }
  
//   // onOpenImage() {
//   //   if (this.selectedItem && this.selectedItem.imagePath) {
//   //     this.selectedImagePath = this.selectedItem.imagePath;
//   //     this.isImagePopupOpen = true;
//   //   } else {
//   //     console.log('No image available for this LOTO');
//   //   }
//   // }

//   closeImagePopup() {
//     this.isImagePopupOpen = false;
//     this.selectedImagePath = null;
//   }

//   createNewLoto() {
//     this.selectedItem = new LotoDto(); // Create a new empty LotoDto
//     this.isPopupOpen = true; // Open the popup
//   }
// }