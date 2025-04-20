import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { Column } from '../../../models/column.model';
import { PopupComponent } from "../../../shared/popup/popup.component";
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
import { LockService } from '../../../services/loto/lock.service';
import { LockDto } from '../../../models/loto/lock.model';
import { LockDetailFormComponent } from '../lock-detail-form/lock-detail-form.component';

@Component({
  selector: 'app-lock-table',
  standalone: true,
  imports: [CommonModule, TableComponent, LockDetailFormComponent, PopupComponent],
  templateUrl: './lock-table.component.html',
})
export class LockTableComponent implements OnInit {
  columns: Column[] = [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    { id: 'number', header: 'Lock Number', accessorKey: 'number' },
    { id: 'status', header: 'Lock Status', accessorKey: 'status.name' }
  ];

  selectedItem: LockDto | null = null;
  isPopupOpen: boolean = false;
  LockDetailFormComponent = LockDetailFormComponent;

  private currentPage = 1;
  private pageSize = 100;
  private isLoading = false;

  constructor() {}

  private lockService = inject(LockService);

  private initialItemsSubject = new BehaviorSubject<LockDto[]>([]);
  initialItems$ = this.initialItemsSubject.asObservable();


  ngOnInit() {
    this.loadItems();
  }

  loadItems(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.lockService.getLocks(this.currentPage, this.pageSize).pipe(
      map((response: SpringPaginatedResponse<LockDto[]>) =>
        response.responseData.content.map(item => LockDto.fromJson(item))
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
    this.lockService.searchLocks(criteria, this.pageSize).pipe(
      map((response: SpringPaginatedResponse<LockDto[]>) =>
        response.responseData.content.map(item => LockDto.fromJson(item))
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

  onFormSubmit(formData: Partial<LockDto>) {
    if (!this.selectedItem) {
      console.error('No item selected for update');
      return;
    }

    console.log('Form submitted with data:', formData);

    const updatedItem = new LockDto({ ...this.selectedItem, ...formData });

    this.lockService.updateLock(this.selectedItem.id.toString(), updatedItem).subscribe(
      (response) => {
        console.log('Lock updated successfully', response);
        const updatedItems = this.initialItemsSubject.value.map(item =>
          item.id === this.selectedItem?.id ? updatedItem : item
        );
        this.initialItemsSubject.next(updatedItems);
        this.selectedItem = null;
      },
      error => {
        console.error('Error updating Lock:', error);
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

  onItemClick = (item: LockDto) => {
    this.selectedItem = item;
    this.isPopupOpen = true;
  }

  closePopup() {
    this.isPopupOpen = false;
    this.selectedItem = null;
  }

  onFormDelete() {
    if (this.selectedItem) {
      this.lockService.deleteLock(this.selectedItem.id.toString()).subscribe(
        () => {
          console.log('Lock deleted successfully');
          const updatedItems = this.initialItemsSubject.value.filter(item => item.id !== this.selectedItem?.id);
          this.initialItemsSubject.next(updatedItems);
          this.selectedItem = null;
        },
        error => console.error('Error deleting Lock:', error)
      );
    }
  }
}