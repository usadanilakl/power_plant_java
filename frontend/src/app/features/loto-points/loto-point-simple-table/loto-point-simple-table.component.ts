import { Component, computed, inject, input, output, OnInit, DestroyRef, effect, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { TableComponent } from "../../../shared/table/table.component";
import { LotoPointService } from '../../../services/loto/loto-point.service';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
import { BehaviorSubject, Observable, catchError, isObservable, map, of, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Column } from '../../../models/column.model';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';
import { PopupProjectionComponent } from "../../../shared/popup-projection/popup-projection.component";
import { LotoPointDetailFormComponent } from "../loto-point-detail-form/loto-point-detail-form.component";

@Component({
  selector: 'app-loto-point-simple-table',
  standalone: true,
  imports: [TableComponent, PopupProjectionComponent, LotoPointDetailFormComponent],
  templateUrl: './loto-point-simple-table.component.html',
  styleUrl: './loto-point-simple-table.component.css'
})
export class LotoPointSimpleTableComponent implements OnInit {
  private lotoPointService = inject(LotoPointService);
  private destroyRef = inject(DestroyRef);

  initialItems = input<Observable<LotoPointDto[]> | LotoPointDto[]>();
  enableSearch = input<boolean>();
  initialSearchQuery = input<SearchCriteria>();
  isReorderEnabled = input<boolean>(false);
  isEditEnabled = input<boolean>(false);

  private itemsSubject = new BehaviorSubject<LotoPointDto[]>([]);
  items$ = this.itemsSubject.asObservable();
  private pageNumber = 1;
  private isLoading = false;
  private pageSize = 50;

  columns = computed(() => LotoPointDto.toTableColumns([ 'isVerified', 'tagNumber', 'description', 'specificLocation', 'isoPos', 'normPos','zeroEnergyMethod']));

  itemsUpdated = output<LotoPointDto[]>();
  doubleClickEvent = output<LotoPointDto>();
  cellDboubleClickEvent = output<{item: LotoPointDto,column: Column}>();
  rightClickEvent = output<LotoPointDto>();
  leftClickEvent = output<LotoPointDto>();
  selectedItemsEvent = output<LotoPointDto[]>();
  itemReordered = output<LotoPointDto[]>();

  selectedItem = signal<LotoPointDto | null>(null);
  isPopupOpen = false;

    constructor() {
    effect(() => {
      const searchCriteria = this.initialSearchQuery();
      if (searchCriteria) {
        this.onSearch(searchCriteria);
      }
    });
  }

  ngOnInit() {
    const initialItems = this.initialItems();
    if (isObservable(initialItems)) {
      initialItems.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(items => {
        this.itemsSubject.next(items);
      });
    } else if (Array.isArray(initialItems)) {
      this.itemsSubject.next(initialItems);
    }
  }

  onSearch(searchCriteria: SearchCriteria) {
    if (!this.enableSearch()) return;

    if(!searchCriteria) return;
    searchCriteria.page = 1;
    
    this.lotoPointService.searchLotoPoints(searchCriteria, 500).subscribe({
      next: (response) => {
        if (response && response.responseData && Array.isArray(response.responseData.content)) {
          const newItems = response.responseData.content.map(item => LotoPointDto.fromJson(item));
          this.itemsSubject.next(newItems);
          this.itemsUpdated.emit(newItems);
          this.pageNumber++;
        } else {
          console.error('Unexpected response format:', response);
        }
      },
      error: (error) => {
        console.error('Error searching LOTO points:', error);
        // Handle error (e.g., show an error message to the user)
      }
    });
  }
  onRowDoubleClick(item: LotoPointDto) {
    this.doubleClickEvent.emit(item);
  }

  onCellDbouleClick(item: LotoPointDto,column: Column) {
    this.cellDboubleClickEvent.emit({item, column});
  }

  onRowRightClick(item: LotoPointDto) {
    this.rightClickEvent.emit(item);
    if(this.isEditEnabled()) {
      this.selectedItem.set(item);
      this.isPopupOpen = true;
    }
  }

  onRowClick = (item: LotoPointDto) => {
    this.leftClickEvent.emit(item);
  }
  
  onSelectedItems = (items: LotoPointDto[]) => {
    this.selectedItemsEvent.emit(items);
  }

  updateItems(items: LotoPointDto[]) {
    this.itemsSubject.next(items);
    this.itemsUpdated.emit(items);
  }

  onItemReordered(items: LotoPointDto[]) {
    // console.log('Item reordered:', items);
    this.itemsSubject.next([...items]);
    this.itemReordered.emit(items);
  }

  onFormSubmit(formData: Partial<LotoPointDto>) {
    if (!this.selectedItem) {
      console.error('No item selected for update');
      return;
    }
  
      // Default behavior
      const updatedItem = new LotoPointDto({ ...this.selectedItem, ...formData });
      this.lotoPointService.updateLotoPoint(updatedItem).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (response) => {
          // Update the local data
          this.updateLocalData(response.responseData);
          // Show success message
        },
        error: (error) => {
          console.error('Error creating LOTO point:', error);
          // Show error message
        },
        complete: () => {
          this.closePopup();
        }
      });
    

  }
  
  private updateLocalData(updatedItem: LotoPointDto) {
    const currentItems = this.itemsSubject.value;
    const itemIndex = currentItems.findIndex(item => item.id === updatedItem.id);
  
    if (itemIndex !== -1) {
      // Update existing item
      const updatedItems = [...currentItems];
      updatedItems[itemIndex] = updatedItem;
      this.itemsSubject.next(updatedItems);
    } else {
      // Add new item
      const updatedItems = [updatedItem, ...currentItems];
      this.itemsSubject.next(updatedItems);
    }
  }

  closePopup() {
    this.isPopupOpen = false;
    this.selectedItem.set(null);
  }
}