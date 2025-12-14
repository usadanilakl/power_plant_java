import {
  AfterViewInit,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  effect,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfLotoPointApiService } from '../services/rf-loto-point-api.service';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { FilterOutRules, TableComponent } from '../../../../shared/table/refactored/table.component';
import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { Column } from '../../../../models/column.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { ButtonColor, ButtonConfig, ButtonsComponent } from '../../../../shared/menu/buttons/buttons.component';

@Component({
  selector: 'app-rf-loto-point-table',
  standalone: true,
  imports: [CommonModule, TableComponent, ButtonsComponent],
  templateUrl: './rf-loto-point-table.component.html',
  styleUrl: './rf-loto-point-table.component.css'
})
export class RfLotoPointTableComponent implements OnInit, AfterViewInit {
  private apiService = inject(RfLotoPointApiService);
  private stateService = inject(RfLotoPointStateService);
  private mapperService = inject(LotoPointMapperService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  inputItems = input<LotoPointDto[] | null>(null);
  loadMoreEnabled = input<boolean>(true);
  enableDragDrop = input<boolean>(false);
  isIsolated = input<boolean>(false);
  filterOutItems = input<FilterOutRules | undefined>();
  hoverDebounceTime = input<number>(0);
  selectionControlButtonsInput = input<ButtonConfig[] | undefined>();
  fieldsToDisplay = input<(keyof LotoPointDto)[]>([
    'isVerified',
    'tagNumber',
    'description',
    'specificLocation',
    'isoPos',
    'normPos',
    'zeroEnergyMethod'
  ]);

  // Outputs
  rowLeftClickEvent = output<LotoPointDto>();
  rowDoubleClickEvent = output<LotoPointDto>();
  rowRightClickEvent = output<LotoPointDto>();
  rowMiddleClickEvent = output<LotoPointDto>();
  cellDoubleClickEvent = output<{ item: LotoPointDto; column: Column }>();
  selectedItemsEvent = output<LotoPointDto[]>();
  itemsReorderedEvent = output<LotoPointDto[]>();

  // State
  items$ = toSignal(this.stateService.allLoadedLotoPoints$, { initialValue: [] });
  columns = signal<Column[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  items = computed(() => {
    return this.inputItems() ?? this.items$();
  });
  selectionControlButtons = computed(() => {
    return this.selectionControlButtonsInput()?? [
      {
        name: 'Select',
        action: () => {
          // Implement selection logic
          console.log('Select is not implemented yet.');
        },
        color: 'primary' as ButtonColor
      },
      {
        name: 'Delete',
        action: () => {
          // Implement delete logic
          console.log('Delete is not implemented yet.');
        },
        color: 'warn' as ButtonColor
      }
    ];
  });

  constructor() {
    // Initialize columns whenever fieldsToDisplay changes
    effect(() => {
      const fields = this.fieldsToDisplay();
      this.columns.set(this.mapperService.toTableColumns(fields));
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngAfterViewInit(): void {
    // Any additional initialization after view is ready
  }

  
    /**
     * Load initial batch of LOTO points
     */
    private loadInitialData(): void {

      if(this.inputItems()) return; // If items are provided, no need to load initial data.

      this.isLoading.set(true);
      this.errorMessage.set(null);
  
      this.apiService
        .getLotoPoints(this.stateService.getCurrentPage(), 50)
        .pipe(
          tap(response => {
            if (response.responseData?.content && response.responseData.content.length > 0) {
              this.stateService.addLotoPoints(response.responseData.content);
              this.stateService.incrementPage();
            }
            this.isLoading.set(false);
          }),
          catchError(error => {
            console.error('Error loading LOTO points:', error);
            this.errorMessage.set('Failed to load LOTO points');
            this.isLoading.set(false);
            return of(null);
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe();
    }

    /**
     * Handle search/filter from table component
     */
    onSearch(criteria: SearchCriteria): void {
      const isUsingInputItems = this.inputItems();
    
      if (isUsingInputItems) {
        // Search within provided items only
        this.searchWithinInputItems(criteria);
      } else {
        // Search in database
        this.searchInDatabase(criteria);
      }
    }
    
    /**
     * Search within the provided input items
     */
    private searchWithinInputItems(criteria: SearchCriteria): void {
      const inputItems = this.inputItems();
      if(!inputItems || inputItems.length === 0) return;
      
      let filtered = inputItems;
    
      if (criteria.type === 'global' && criteria.query) {
        // Global search across all properties
        filtered = inputItems.filter(item =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(criteria.query!.toLowerCase())
          )
        );
      } else if (criteria.type === 'column' && criteria.filters) {
        // Column-specific search
        filtered = inputItems.filter(item =>
          Object.entries(criteria.filters!).every(([key, value]) => {
            if (!value) return true;
            const itemValue = (item as any)[key];
            return String(itemValue).toLowerCase().includes(value.toLowerCase());
          })
        );
      }
    }
    
    /**
     * Search in database
     */
    
    private searchInDatabase(criteria: SearchCriteria): void {
      this.isLoading.set(true);
      this.errorMessage.set(null);
    
      // Get existing criteria and merge with new search
      const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};
      
      const mergedCriteria: SearchCriteria = {
        ...existingCriteria,
        ...criteria,
        page: 1,
        pageSize: 50
      };
    
      // Save the merged search criteria to state for later use (e.g., when sorting)
      this.stateService.setSearchCriteria(mergedCriteria);
      this.stateService.resetPage();
      this.stateService.clearLotoPoints();
    
      this.apiService
        .searchLotoPoints(mergedCriteria, 50)
        .pipe(
          tap(response => {
            if (response.responseData?.content) {
              // Replace current items with search results
              this.stateService.addLotoPoints(response.responseData.content);
              this.stateService.incrementPage();
            }
            this.isLoading.set(false);
          }),
          catchError(error => {
            console.error('Error searching LOTO points:', error);
            this.errorMessage.set('Search failed');
            this.isLoading.set(false);
            return of(null);
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe();
    }

    
    onTableSortChanged(event: { column: Column; isAscending: boolean }): void {
      const isUsingInputItems = this.inputItems();
      
      if (isUsingInputItems) {
        return;
      }
      
      // Get the existing search criteria and merge with new sort
      const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};
      
      const searchCriteria: SearchCriteria = {
        ...existingCriteria,
        sortColumn: event.column.id,
        sortDirection: event.isAscending ? 'ASC' : 'DESC',
        page: 1,
        pageSize: 50,
        type: existingCriteria.type ?? 'sort'
      };
      
      this.stateService.clearLotoPoints();
      this.stateService.resetPage();
      this.stateService.setSearchCriteria(searchCriteria);
      
      this.isLoading.set(true);
      this.errorMessage.set(null);
    
      this.apiService
        .searchLotoPoints(searchCriteria, 50)
        .pipe(
          tap(response => {
            if (response.responseData?.content && response.responseData.content.length > 0) {
              this.stateService.addLotoPoints(response.responseData.content);
              this.stateService.incrementPage();
            }
            this.isLoading.set(false);
          }),
          catchError(error => {
            console.error('Error loading sorted LOTO points:', error);
            this.errorMessage.set('Failed to load sorted data');
            this.isLoading.set(false);
            return of(null);
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe();
    }
    
    
    onLoadMore(criteria: SearchCriteria | void): void {
      if (!this.loadMoreEnabled()) return;
      if (this.isLoading()) return;
    
      this.isLoading.set(true);

      // Combine incoming criteria with existing state, preserving sort
      const existingCriteria = this.stateService.getCurrentSearchCriteria();
      const incomingCriteria = criteria || {};
      
      const loadMoreCriteria: SearchCriteria = {
        ...(existingCriteria || { type: 'column', filters: {} }),
        ...incomingCriteria,
        // Explicitly preserve sort state - don't let incoming criteria override it
        sortColumn: incomingCriteria.sortColumn || existingCriteria?.sortColumn,
        sortDirection: incomingCriteria.sortDirection || existingCriteria?.sortDirection,
        page: this.stateService.getCurrentPage()
      };
      
      this.apiService
        .searchLotoPoints(loadMoreCriteria, 50)
        .pipe(
          tap(response => {
            if (response.responseData?.content && response.responseData.content.length > 0) {
              this.stateService.addLotoPoints(response.responseData.content);
              this.stateService.incrementPage();
            }
            this.isLoading.set(false);
          }),
          catchError(error => {
            console.error('Error loading more LOTO points:', error);
            this.isLoading.set(false);
            return of(null);
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe();
    }
  
    // /**
    //  * Handle load more when user scrolls to bottom
    //  */
    // onLoadMore(criteria: SearchCriteria): void {
    //   if (!this.loadMoreEnabled()) return;
    //   if (this.isLoading()) return;
  
    //   this.isLoading.set(true);
  
    //   criteria.page = this.stateService.getCurrentPage();
    //   this.apiService
    //     .searchLotoPoints(criteria, 50)
    //     .pipe(
    //       tap(response => {
    //         if (response.responseData?.content && response.responseData.content.length > 0) {
    //           this.stateService.addLotoPoints(response.responseData.content);
    //           this.stateService.incrementPage();
    //         }
    //         this.isLoading.set(false);
    //       }),
    //       catchError(error => {
    //         console.error('Error loading more LOTO points:', error);
    //         this.isLoading.set(false);
    //         return of(null);
    //       }),
    //       takeUntilDestroyed(this.destroyRef)
    //     )
    //     .subscribe();
    // }
    
    
    // onTableSortChanged(event: { column: Column; isAscending: boolean }): void {
    //   const isUsingInputItems = this.inputItems();
      
    //   if (isUsingInputItems) {
    //     // For input items, sort locally - table will handle it
    //     // Just emit the sort event and let table component sort
    //     return;
    //   }
      
    //   // For paginated data from server, reset and fetch sorted results
    //   this.stateService.clearLotoPoints();
    //   this.stateService.resetPage();
      
    //   const searchCriteria: SearchCriteria = {
    //     type: 'sort',
    //     sortColumn: event.column.id,
    //     sortDirection: event.isAscending ? 'ASC' : 'DESC',
    //     page: 1,
    //     pageSize: 50
    //   };
      
    //   this.isLoading.set(true);
    //   this.errorMessage.set(null);
    
    //   this.apiService
    //     .searchLotoPoints(searchCriteria, 50)
    //     .pipe(
    //       tap(response => {
    //         if (response.responseData?.content && response.responseData.content.length > 0) {
    //           this.stateService.addLotoPoints(response.responseData.content);
    //           this.stateService.incrementPage();
    //         }
    //         this.isLoading.set(false);
    //       }),
    //       catchError(error => {
    //         console.error('Error loading sorted LOTO points:', error);
    //         this.errorMessage.set('Failed to load sorted data');
    //         this.isLoading.set(false);
    //         return of(null);
    //       }),
    //       takeUntilDestroyed(this.destroyRef)
    //     )
    //     .subscribe();
    // }

  /**
   * Handle row left click
   */
  onRowLeftClick(event: { item: LotoPointDto; event: MouseEvent }): void {
    this.rowLeftClickEvent.emit(event.item);
  }

  /**
   * Handle row double click
   */
  onRowDoubleClick(item: LotoPointDto): void {
    this.rowDoubleClickEvent.emit(item);
  }

  /**
   * Handle row right click
   */
  onRowRightClick(item: LotoPointDto): void {
    this.rowRightClickEvent.emit(item);
  }

  /**
   * Handle row middle click
   */
  onRowMiddleClick(item: LotoPointDto): void {
    this.rowMiddleClickEvent.emit(item);
  }

  /**
   * Handle cell double click
   */
  onCellDoubleClick(event: { item: LotoPointDto; column: Column }): void {
    this.cellDoubleClickEvent.emit(event);
  }

  /**
   * Handle selected items change
   */
  onSelectedItems(items: LotoPointDto[]): void {
    this.stateService.setSelectedLotoPoints(items);
    this.selectedItemsEvent.emit(items);
  }

  /**
   * Handle items reordered
   */
  onItemsReordered(items: LotoPointDto[]): void {
    this.itemsReorderedEvent.emit(items);
  }
}