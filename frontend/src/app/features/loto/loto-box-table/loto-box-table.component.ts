import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { Column } from '../../../models/column.model';
import { PopupComponent } from "../../../shared/popup/popup.component";
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
import { LotoBoxService } from '../../../services/loto/loto-box.service';
import { LotoBoxDto } from '../../../models/loto/loto-box.model';
import { LotoBoxDetailFormComponent } from '../loto-box-detail-form/loto-box-detail-form.component';

@Component({
  selector: 'app-loto-lotoBox-table',
  standalone: true,
  imports: [CommonModule, TableComponent, LotoBoxDetailFormComponent, PopupComponent],
  templateUrl: './loto-box-table.component.html',
})
export class LotoBoxTableComponent implements OnInit {
  columns: Column[] = [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    { id: 'number', header: 'Box Number', accessorKey: 'number' },
    { id: 'lotoAccessoryStatus', header: 'LOTO Accessory Status', accessorKey: 'lotoAccessoryStatus.name' }
  ];

  selectedItem: LotoBoxDto | null = null;
  isPopupOpen: boolean = false;
  LotoBoxDetailFormComponent = LotoBoxDetailFormComponent;

  isImagePopupOpen: boolean = false;
  selectedImagePath: string | null = null;

  private currentPage = 1;
  private pageSize = 100;
  private isLoading = false;

  constructor() {}

  private lotoBoxService = inject(LotoBoxService);

  private initialItemsSubject = new BehaviorSubject<LotoBoxDto[]>([]);
  initialItems$ = this.initialItemsSubject.asObservable();

  private relatedImagesSubject = new BehaviorSubject<string[]>([]);
  relatedImages$ = this.relatedImagesSubject.asObservable();

  ngOnInit() {
    this.loadItems();
  }

  loadItems(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.lotoBoxService.getLotoBoxes(this.currentPage, this.pageSize).pipe(
      map((response: SpringPaginatedResponse<LotoBoxDto[]>) =>
        response.responseData.content.map(item => LotoBoxDto.fromJson(item))
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
    this.lotoBoxService.searchLotoBoxes(criteria, this.pageSize).pipe(
      map((response: SpringPaginatedResponse<LotoBoxDto[]>) =>
        response.responseData.content.map(item => LotoBoxDto.fromJson(item))
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

  onFormSubmit(formData: Partial<LotoBoxDto>) {
    if (!this.selectedItem) {
      console.error('No item selected for update');
      return;
    }


    const updatedItem = new LotoBoxDto({ ...this.selectedItem, ...formData });

    this.lotoBoxService.updateLotoBox(this.selectedItem.id.toString(), updatedItem).subscribe(
      (response) => {
        const updatedItems = this.initialItemsSubject.value.map(item =>
          item.id === this.selectedItem?.id ? updatedItem : item
        );
        this.initialItemsSubject.next(updatedItems);
        this.selectedItem = null;
      },
      error => {
        console.error('Error updating LOTO lotoBox:', error);
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

  onItemClick = (item: LotoBoxDto) => {
    this.selectedItem = item;
    this.isPopupOpen = true;
  }

  closePopup() {
    this.isPopupOpen = false;
    this.selectedItem = null;
  }

  onFormDelete() {
    if (this.selectedItem) {
      this.lotoBoxService.deleteLotoBox(this.selectedItem.id.toString()).subscribe(
        () => {
          // console.log('LOTO lotoBox deleted successfully');
          const updatedItems = this.initialItemsSubject.value.filter(item => item.id !== this.selectedItem?.id);
          this.initialItemsSubject.next(updatedItems);
          this.selectedItem = null;
        },
        error => console.error('Error deleting LOTO lotoBox:', error)
      );
    }
  }

  closeImagePopup() {
    this.isImagePopupOpen = false;
    this.selectedImagePath = null;
  }
}
