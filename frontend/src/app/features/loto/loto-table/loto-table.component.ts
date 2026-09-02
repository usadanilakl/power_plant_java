import { Component, DestroyRef, effect, inject, input, OnInit, output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { Column } from '../../../models/column.model';
import { PopupComponent } from "../../../shared/popup/popup.component";
import { LotoService } from '../../../services/loto/loto.service';
import { BehaviorSubject, catchError, map, of } from 'rxjs';
import { LotoDto } from '../../../models/loto/loto.model';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoDetailFormComponent } from '../loto-detail-form/loto-detail-form.component';

@Component({
  selector: 'app-loto-table',
  standalone: true,
  imports: [CommonModule, TableComponent, PopupComponent],
  templateUrl: './loto-table.component.html',
  styleUrls: ['./loto-table.component.css']
})
export class LotoTableComponent implements OnInit {
  columns: Column[] = [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    { id: 'docNum', header: 'LOTO Number', accessorKey: 'docNum' },
    { id: 'redTagNum', header: 'Red Tag #', accessorKey: 'redTagNum' },
    { id: 'boxNumber', header: 'Box #', accessorKey: 'boxNumber' },
    { id: 'workScope', header: 'Description', accessorKey: 'workScope' },
    { id: 'status.name', header: 'Status', accessorKey: 'status.name' },
    { id: 'startDate', header: 'Start Date', accessorKey: 'startDate' },
    { id: 'endDate', header: 'End Date', accessorKey: 'endDate' }
  ];

  @ViewChild(TableComponent) tableComponent!: TableComponent;
  private destroyRef = inject(DestroyRef);
  

  itemsInput = input<LotoDto[]>([]);

  onTableRowLeftClickEvent = output<LotoDto>();
  createNewLotoEvent = output<void>();


  selectedItem: LotoDto | null = null;
  isPopupOpen: boolean = false;
  LotoDetailFormComponent = LotoDetailFormComponent;

  isImagePopupOpen: boolean = false;
  selectedImagePath: string | null = null;

  private currentPage = 1;
  private pageSize = 5000;

  private itemsSubject = new BehaviorSubject<LotoDto[]>([]);
  items$ = this.itemsSubject.asObservable();

  private relatedImagesSubject = new BehaviorSubject<string[]>([]);
  relatedImages$ = this.relatedImagesSubject.asObservable();

  constructor() {
    // effect is a better choice for reacting to input changes than ngOnInit
    effect(() => {
      const inputItems = this.itemsInput();
      if (inputItems && inputItems.length > 0) {
        this.itemsSubject.next(inputItems);
      } else {
        this.loadAndSetItems();
      }
    });
  }

  private lotoService = inject(LotoService);

  ngOnInit() {
    // if(this.itemsInput().length!=0) this.itemsSubject.next(this.itemsInput() as LotoDto[]);
    // else this.items$ = this.loadItems();
  }



  private loadAndSetItems(): void {
    this.lotoService.getLotos(1, this.pageSize).pipe(
      takeUntilDestroyed(this.destroyRef),
      map((response: SpringPaginatedResponse<LotoDto>) => 
        response.responseData.content.map(item => LotoDto.fromJson(item))
      ),
      catchError(error => {
        console.error('Error loading items:', error);
        return of([]);
      })
    ).subscribe(items => {
      this.itemsSubject.next(items);
    });
  }

  private performSearch(criteria: SearchCriteria): void {
    this.lotoService.searchLotos(criteria, this.pageSize).pipe(
      takeUntilDestroyed(this.destroyRef),
      map((response: SpringPaginatedResponse<LotoDto[]>) => 
        response.responseData.content.map(item => LotoDto.fromJson(item))
      ),
      catchError(error => {
        console.error('Error performing search:', error);
        return of([]);
      })
    ).subscribe(items => {
      this.itemsSubject.next(items);
    });
  }

  onFormSubmit(formData: Partial<LotoDto>) {
    if (!this.selectedItem) {
      console.error('No item selected for update');
      return;
    }

    const updatedItem = new LotoDto({ ...this.selectedItem, ...formData });

    this.lotoService.updateLoto(updatedItem.toIdModel()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        const currentItems = this.itemsSubject.getValue();
        const updatedItems = currentItems.map(item => item.id === updatedItem.id ? updatedItem : item);
        this.itemsSubject.next(updatedItems);
        this.isPopupOpen = false;
        this.selectedItem = null;
      },
      error: (error) => {
        console.error('Error updating LOTO:', error);
      }
    });
  }

  onSearch(criteria: SearchCriteria) {
    this.currentPage = 1;
    this.performSearch(criteria);
  }

  loadMoreItems(criteria: SearchCriteria | void) {
    if (criteria && 'page' in criteria) {
      this.lotoService.searchLotos(criteria, this.pageSize).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringPaginatedResponse<LotoDto[]>) => 
          response.responseData.content.map(item => LotoDto.fromJson(item))
        ),
        catchError(error => {
          console.error('Error loading more items with search:', error);
          return of([]);
        })
      ).subscribe(newItems => {
        const currentItems = this.itemsSubject.getValue();
        this.itemsSubject.next([...currentItems, ...newItems]);
      });
    } else {
      this.currentPage++;
      this.lotoService.getLotos(this.currentPage, this.pageSize).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringPaginatedResponse<LotoDto>) => 
          response.responseData.content.map(item => LotoDto.fromJson(item))
        ),
        catchError(error => {
          console.error('Error loading more items:', error);
          return of([]);
        })
      ).subscribe(newItems => {
        const currentItems = this.itemsSubject.getValue();
        this.itemsSubject.next([...currentItems, ...newItems]);
      });
    }
  }

  onItemClick = (item: LotoDto) => {
    this.onTableRowLeftClickEvent.emit(item);
  }

  // onItemClick = (item: LotoDto) => {
  //   this.selectedItem = item;
  //   this.isPopupOpen = true;
  
  //   this.lotoService.getLotoById(item.id.toString()).pipe(
  //     tap((response: SpringApiResponse<LotoDto>) => {
  //       if (response.responseData) {
  //         this.selectedItem = LotoDto.fromJson(response.responseData);
  //       } else {
  //         console.error('No data received for LOTO:', item.id);
  //       }
  //     }),
  //     switchMap(() => this.lotoService.getRelatedImages(item.id))
  //   ).subscribe(
  //     (imageResponse: SpringApiResponse<string[]>) => {
  //       if (imageResponse.responseData) {
  //         const fullUrls = imageResponse.responseData.map(url => `http://localhost:8082/${url}`);
  //         this.relatedImagesSubject.next(fullUrls);
  //       } else {
  //         this.relatedImagesSubject.next([]);
  //       }
  //     },
  //     error => {
  //       console.error('Error fetching LOTO details or related images:', error);
  //       this.relatedImagesSubject.next([]);
  //     }
  //   );
  // }

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
      const deletedItemId = this.selectedItem.id;
      this.lotoService.deleteLoto(deletedItemId.toString()).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          const currentItems = this.itemsSubject.getValue();
          const updatedItems = currentItems.filter(item => item.id !== deletedItemId);
          this.itemsSubject.next(updatedItems);
          
          this.selectedItem = null;
          this.isPopupOpen = false;
        },
        error: (error) => {
          console.error('Error deleting LOTO:', error);
        }
      });
    }
  }

  closeImagePopup() {
    this.isImagePopupOpen = false;
    this.selectedImagePath = null;
  }

  createNewLotoFromStandard() {
    this.selectedItem = new LotoDto();
    this.isPopupOpen = true;
  }

  createNewLoto() {
    this.createNewLotoEvent.emit();
  }
}