import { ChangeDetectorRef, Component, Input, inject, OnInit, DestroyRef, signal } from '@angular/core';
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
import { ExcelService } from '../../../services/excel.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PopupProjectionComponent } from "../../../shared/popup-projection/popup-projection.component";

@Component({
  selector: 'app-loto-point-table',
  standalone: true,
  imports: [CommonModule, TableComponent, LotoPointDetailFormComponent, PopupComponent, PopupProjectionComponent],
  templateUrl: './loto-point-table.component.html',
})
export class LotoPointTableComponent implements OnInit {
  // @Input() clientSideData: LotoPointDto[] | null = null;
  @Input() submitCallback?: (data: any) => void;
  @Input() deleteCallback?: (id: number) => void;
  @Input() clickCallback?: (item: any) => void;
  @Input() doubleClickCallback?: (item: any) => void;
  @Input() rightClickCallback?: (item: any) => void;
  @Input() middleClickCallback?: (item: any) => void;
  @Input() cellDoubleClickCallback?: (item: any, column: Column) => void;

  @Input() clientSideData$: Observable<LotoPointDto[]> | null = null;
  

  columns: Column[] = [
    { id: 'unit', header: 'Unit', accessorKey: 'unit' },
    { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
    { id: 'description', header: 'Description', accessorKey: 'description' },
    { id: 'specificLocation', header: 'Specific Location', accessorKey: 'specificLocation' },
    { id: 'tagged', header: 'Tagging Status', accessorKey: 'tagged' },
    { 
      id: 'lotos', 
      header: 'LOTOs', 
      accessorFn: (item: any) => {
        if (Array.isArray(item.lotos)) {
          return item.lotos.map((loto: any) => {
            return loto.workScope;
          }).join(', ');
        }
        return '';
      }
    },
    { id: 'isoPos', header: 'ISO Pos', accessorKey: 'isoPos.name' },
    { id: 'normPos', header: 'Norm Pos', accessorKey: 'normPos.name' },
    { id: 'zeroEnergyMethod', header: 'Zero Energy Method', accessorKey: 'zeroEnergyMethod' },
  ];

  selectedItem: LotoPointDto | null = null;
  isPopupOpen: boolean = false;
  LotoPointDetailFormComponent = LotoPointDetailFormComponent;

  isImagePopupOpen: boolean = false;
  selectedImagePath: string | null = null;

  private currentPage = 1;
  private pageSize = 50;
  private isLoading = false;



  private lotoPointService = inject(LotoPointService);
  private excelService = inject(ExcelService);
  private destroyRef = inject(DestroyRef)

  private initialItemsSubject = new BehaviorSubject<LotoPointDto[]>([]);
  initialItems$ = this.initialItemsSubject.asObservable();

  private relatedImagesSubject = new BehaviorSubject<string[]>([]);
  relatedImages$ = this.relatedImagesSubject.asObservable();

  exportMessage = signal<string | null>(null);
  isExporting = signal<boolean>(false);

  ngOnInit() {
    if (this.clientSideData$) {
      this.clientSideData$.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(data => {
        if (data) {
          this.initialItemsSubject.next(data);
        }
      });
    } else {
      this.loadItems();
    }


  }

  exportToExcel(): void {
    this.isExporting.set(true);
    this.excelService.exportAll().pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (response) => {
          // Handle successful export (e.g., show a success message)
          this.isExporting.set(false);
        },
        error: (error) => {
          console.error('Export failed:', error);
          this.exportMessage.set(error.message);
        }
      })
  }

  cancelExport(): void {
    this.isExporting.set(false);
  }

  resetAndLoadItems(): void {
    this.currentPage = 1;
    if (this.clientSideData$) {
      this.clientSideData$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
        this.initialItemsSubject.next(data);
      });
    } else {
      this.initialItemsSubject.next([]);
      this.loadItems();
    }
  }
  
  onSearch(criteria: SearchCriteria) {
    if(!criteria) return;
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
      if (criteria) {
        criteria.page = this.currentPage+1;
        this.performSearch(criteria);
      } else {
        this.loadItems();
      }
    }
  }


  loadItems(): void {
    if (this.clientSideData$) {
      this.updateClientSideData();
    } else {
      if (this.isLoading) return;
      this.isLoading = true;
  
      this.lotoPointService.getLotoPoints(this.currentPage, this.pageSize).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringPaginatedResponse<LotoPointDto>) => 
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
        map((response: SpringPaginatedResponse<LotoPointDto>) => 
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
      map(data => {
        return criteria ? this.applySearchCriteria(data, criteria) : data;
      })
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
      return Object.entries(criteria).some(([key, value]) => {
        if (key === 'page' || !value) return true;
        if (typeof value !== 'string') return true;
  
        const searchValue = value.toLowerCase();
        
        return Object.entries(item).some(([itemKey, itemValue]) => {
          if (itemValue == null) return false;
          const stringValue = String(itemValue).toLowerCase();
          return stringValue.includes(searchValue);
        });
      });
    });
  }

  onFormSubmit(formData: Partial<LotoPointDto>) {
    if (!this.selectedItem) {
      console.error('No item selected for update');
      return;
    }
  
    if (this.submitCallback) {
      const itemToAdd = new LotoPointDto({ ...this.selectedItem, ...formData });
      // Use the provided callback
      this.submitCallback(itemToAdd);
      this.closePopup();
    } else {
      // Default behavior
      const updatedItem = new LotoPointDto({ ...this.selectedItem, ...formData });
      this.lotoPointService.updateLotoPoint(updatedItem).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (response) => {
          // Update the local data
          this.updateLocalData(response.responseData);
          // Show success message
          this.showSuccessMessage('LOTO point created successfully');
        },
        error: (error) => {
          console.error('Error creating LOTO point:', error);
          // Show error message
          this.showErrorMessage('Failed to create LOTO point');
        },
        complete: () => {
          this.closePopup();
        }
      });
    }

  }
  
  private updateLocalData(updatedItem: LotoPointDto) {
    const currentItems = this.initialItemsSubject.value;
    const itemIndex = currentItems.findIndex(item => item.id === updatedItem.id);
  
    if (itemIndex !== -1) {
      // Update existing item
      const updatedItems = [...currentItems];
      updatedItems[itemIndex] = updatedItem;
      this.initialItemsSubject.next(updatedItems);
    } else {
      // Add new item
      const updatedItems = [updatedItem, ...currentItems];
      this.initialItemsSubject.next(updatedItems);
    }
  }
  
  private showSuccessMessage(message: string) {
    // Implement your success message display logic here
    // For example, you could use a snackbar or toast notification
  }
  
  private showErrorMessage(message: string) {
    // Implement your error message display logic here
    // For example, you could use a snackbar or toast notification
    console.error(message);
  }

  onItemClick = (item: LotoPointDto) => {
    this.selectedItem = item;
    this.isPopupOpen = true;
    this.lotoPointService.getRelatedImages(this.selectedItem.id).subscribe(
      (response: SpringApiResponse<string[]>) => {
        if (response.responseData) {
          const fullUrls = response.responseData.map(url => `http://localhost:8082/${url}`);
          this.relatedImagesSubject.next(fullUrls);
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

  onMiddleClick(item: any) {
    if (typeof this.middleClickCallback === 'function') {
      this.middleClickCallback(item);
    }
  }
  
  onLeftClick(item: any) {
    if (typeof this.clickCallback === 'function') {
      this.clickCallback(item);
    } else {
      this.onItemClick(item);
    }
  }
  
  onDoubleClick(item: any) {
    if (typeof this.doubleClickCallback === 'function') {
      this.doubleClickCallback(item);
    } else if (typeof this.cellDoubleClickCallback === 'function') {
      // Note: cellDoubleClickCallback typically requires a column parameter
      // You might need to adjust this if you want to use it here
      console.log('cellDoubleClickCallback is provided but not used in onDoubleClick');
    } else {
      this.onItemClick(item);
    }
  }
  
  onRightClick(item: any) {
    if (typeof this.rightClickCallback === 'function') {
      this.rightClickCallback(item);
    } else {
      this.onItemClick(item);
    }
  }
  
  onColumnDoubleClick(item: any, column: Column) {
    if (typeof this.cellDoubleClickCallback === 'function') {
      this.cellDoubleClickCallback(item, column);
    } else {
      console.log('cellDoubleClickCallback is not defined or is not a function');
    }
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
        this.closePopup();
      } else {
        // Default behavior
        this.lotoPointService.deleteLotoPoint(this.selectedItem.id.toString()).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: (response) => {
            this.removeDeletedItemFromLocalData(this.selectedItem!.id);
            this.showSuccessMessage('LOTO point deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting LOTO point:', error);
            this.showErrorMessage('Failed to delete LOTO point');
          },
          complete: () => {
            this.closePopup();
          }
        });
      }
    }
  }
  
  private removeDeletedItemFromLocalData(deletedItemId: number) {
    const currentItems = this.initialItemsSubject.value;
    const updatedItems = currentItems.filter(item => item.id !== deletedItemId);
    this.initialItemsSubject.next(updatedItems);
  }
  
  onOpenImage() {
    // Implement open image logic here
  }

  closeImagePopup() {
    this.isImagePopupOpen = false;
    this.selectedImagePath = null;
  }
}
