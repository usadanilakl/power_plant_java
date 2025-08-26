import { Component, computed, inject, input, output, OnInit, DestroyRef, effect } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { TableComponent } from "../../../shared/table/table.component";
import { LotoPointService } from '../../../services/loto/loto-point.service';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
import { BehaviorSubject, Observable, catchError, isObservable, map, of, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Column } from '../../../models/column.model';
import { SpringPaginatedResponse } from '../../../models/api/spring-pagenated.response.model';

@Component({
  selector: 'app-loto-point-simple-table',
  standalone: true,
  imports: [TableComponent],
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

    // onSearch(searchCriteria: SearchCriteria) {
    //   if (!this.enableSearch()) return;

    //   if(!searchCriteria) return;
    //   searchCriteria.page = 1;
      
    //   this.performSearch(searchCriteria);
    // }

    // loadItems(): void {
    //   if (this.isLoading) return;
    //   this.isLoading = true;
  
    //   this.lotoPointService.getLotoPoints(this.pageNumber, this.pageSize).pipe(
    //     takeUntilDestroyed(this.destroyRef),
    //     map((response: SpringPaginatedResponse<LotoPointDto>) => response.responseData.content),
    //     tap(newItems => {
    //       const currentItems = this.itemsSubject.value;
    //       const updatedItems = this.pageNumber === 1 ? newItems : [...currentItems, ...newItems];
    //       this.itemsSubject.next(updatedItems);
    //       this.pageNumber++;
    //       this.isLoading = false;
    //     }),
    //     catchError(error => {
    //       console.error('Error loading items:', error);
    //       this.isLoading = false;
    //       return of([]);
    //     })
    //   ).subscribe();
    // }

    // private performSearch(criteria: SearchCriteria) {
    //   this.lotoPointService.searchLotoPoints(criteria, 500).pipe(
    //     takeUntilDestroyed(this.destroyRef),
    //     tap(results => {
    //       if (criteria.page === 1) {
    //         this.itemsSubject.next(results.responseData.content);
    //       } else {
    //         const currentItems = this.itemsSubject.value;
    //         const newItems = [...currentItems, ...results.responseData.content];
    //         this.itemsSubject.next(newItems);
    //         this.itemsUpdated.emit(newItems);
    //       }
    //     }),
    //     catchError(error => {
    //       console.error('Error performing search:', error);
    //       return of(null);
    //     })
    //   ).subscribe();
    // }

    // loadMoreItems(criteria: SearchCriteria | void) {
    //   // console.log('Load more items', criteria);
    //   if(criteria){
    //     criteria.page = this.pageNumber+1;
    //     this.performSearch(criteria);
    //   } else {
    //     this.loadItems();
    //   }
    // }

    // resetAndLoadItems(): void {
    //   this.pageNumber = 1;
    //   this.itemsSubject.next([]);
    //   this.loadItems();
    // }

  onRowDoubleClick(item: LotoPointDto) {
    this.doubleClickEvent.emit(item);
  }

  onCellDbouleClick(item: LotoPointDto,column: Column) {
    this.cellDboubleClickEvent.emit({item, column});
  }

  onRowRightClick(item: LotoPointDto) {
    this.rightClickEvent.emit(item);
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
}