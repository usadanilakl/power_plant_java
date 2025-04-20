import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { Column } from '../../../models/column.model';
import { LotoDetailFormComponent } from "../loto-detail-form/loto-detail-form.component";
import { PopupComponent } from "../../../shared/popup/popup.component";
import { LotoService } from '../../../services/loto/loto.service';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
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

  selectedItem: LotoDto | null = null;
  isPopupOpen: boolean = false;
  LotoDetailFormComponent = LotoDetailFormComponent;

  isImagePopupOpen: boolean = false;
  selectedImagePath: string | null = null;

  private currentPage = 1;
  private pageSize = 50;
  private isLoading = false;

  constructor() {}

  private lotoService = inject(LotoService);

  private initialItemsSubject = new BehaviorSubject<LotoDto[]>([]);
  initialItems$ = this.initialItemsSubject.asObservable();

  private relatedImagesSubject = new BehaviorSubject<string[]>([]);
  relatedImages$ = this.relatedImagesSubject.asObservable();

  ngOnInit() {
    this.loadItems();
  }

  loadItems(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.lotoService.getLotos(this.currentPage, this.pageSize).pipe(
      map((response: SpringPaginatedResponse<LotoDto[]>) => 
        response.responseData.content.map(item => LotoDto.fromJson(item))
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

  private performSearch(criteria: SearchCriteria) {
    this.lotoService.searchLotos(criteria, this.pageSize).pipe(
      map((response: SpringPaginatedResponse<LotoDto[]>) => 
        response.responseData.content.map(item => LotoDto.fromJson(item))
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

  onFormSubmit(formData: Partial<LotoDto>) {
    if (!this.selectedItem) {
      console.error('No item selected for update');
      return;
    }

    console.log('Form submitted with data:', formData);

    const updatedItem = new LotoDto({ ...this.selectedItem, ...formData });

    this.lotoService.updateLoto(this.selectedItem.id.toString(), updatedItem).subscribe(
      (response) => {
        console.log('LOTO updated successfully', response);
        const updatedItems = this.initialItemsSubject.value.map(item => 
          item.id === this.selectedItem?.id ? updatedItem : item
        );
        this.initialItemsSubject.next(updatedItems);
        this.selectedItem = null;
      },
      error => {
        console.error('Error updating LOTO:', error);
      }
    );
  }

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

  onItemClick = (item: LotoDto) => {
    this.selectedItem = item;
    this.isPopupOpen = true;
    this.lotoService.getRelatedImages(this.selectedItem.id).subscribe(
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
      this.lotoService.deleteLoto(this.selectedItem.id.toString()).subscribe(
        () => {
          console.log('LOTO deleted successfully');
          const updatedItems = this.initialItemsSubject.value.filter(item => item.id !== this.selectedItem?.id);
          this.initialItemsSubject.next(updatedItems);
          this.selectedItem = null;
        },
        error => console.error('Error deleting LOTO:', error)
      );
    }
  }
  
  // onOpenImage() {
  //   if (this.selectedItem && this.selectedItem.imagePath) {
  //     this.selectedImagePath = this.selectedItem.imagePath;
  //     this.isImagePopupOpen = true;
  //   } else {
  //     console.log('No image available for this LOTO');
  //   }
  // }

  closeImagePopup() {
    this.isImagePopupOpen = false;
    this.selectedImagePath = null;
  }
}