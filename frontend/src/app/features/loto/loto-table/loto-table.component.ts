import { Component, DestroyRef, inject, OnInit, output, ViewChild } from '@angular/core';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private destroyRef = inject(DestroyRef);

  onTableRowLeftClickEvent = output<LotoDto>();
  createNewLotoEvent = output<void>();


  selectedItem: LotoDto | null = null;
  isPopupOpen: boolean = false;
  LotoDetailFormComponent = LotoDetailFormComponent;

  isImagePopupOpen: boolean = false;
  selectedImagePath: string | null = null;

  private currentPage = 1;
  private pageSize = 50;

  items$: Observable<LotoDto[]> = of([]);

  private relatedImagesSubject = new BehaviorSubject<string[]>([]);
  relatedImages$ = this.relatedImagesSubject.asObservable();

  constructor() {}

  private lotoService = inject(LotoService);

  ngOnInit() {
    this.items$ = this.loadItems()
  }

  loadItems(): Observable<LotoDto[]> {
    console.log('Loading items',this.currentPage);
    return this.lotoService.getLotos(1, this.pageSize).pipe(
      takeUntilDestroyed(this.destroyRef),
      map((response: SpringPaginatedResponse<LotoDto>) => 
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

  createNewLotoFromStandard() {
    this.selectedItem = new LotoDto();
    this.isPopupOpen = true;
  }

  createNewLoto() {
    this.createNewLotoEvent.emit();
  }
}