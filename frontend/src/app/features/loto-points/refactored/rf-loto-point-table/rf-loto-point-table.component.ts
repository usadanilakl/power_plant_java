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
  computed,
  ViewChild,
  Injector,
  EffectRef,
  runInInjectionContext,
  OnDestroy,
  InjectFlags
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfLotoPointApiService } from '../services/rf-loto-point-api.service';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { FilterOutRules, TableComponent } from '../../../../shared/table/refactored/table.component';
import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
import { LotoPointDto, LotoPointFieldName, LotoPointModel } from '../../../../models/loto/loto-point.model';
import { Column } from '../../../../models/column.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { ButtonColor, ButtonConfig, ButtonsComponent } from '../../../../shared/menu/buttons/buttons.component';
import { LotoPointContextMenuService } from '../loto-point-context-menu/loto-point-context-menu.service';
import { RfLotoPointFormComponent } from "../rf-loto-point-form/rf-loto-point-form.component";
import { PopupProjectionComponent } from "../../../../shared/popup-projection/popup-projection.component";
import { ContextMenuComponent } from "../../../../shared/menu/context-menu/context-menu.component";
import { TableMode } from '../../../../shared/table/refactored/services/table-state.service';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { RfLotoPointClickService } from '../services/rf-loto-point-click.service';
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';

@Component({
  selector: 'app-rf-loto-point-table',
  standalone: true,
  imports: [
    CommonModule,
    TableComponent,
    ButtonsComponent,
    RfLotoPointFormComponent,
    PopupProjectionComponent,
    ContextMenuComponent
],
  providers: [
    ContextMenuComponent,
  ],
  templateUrl: './rf-loto-point-table.component.html',
  styleUrl: './rf-loto-point-table.component.css',
})
export class RfLotoPointTableComponent implements OnInit, AfterViewInit, OnDestroy {
  
  // @ViewChild(TableComponent) tableComponent!: TableComponent;
  
  private apiService = inject(RfLotoPointApiService);
  protected stateService = inject(RfLotoPointStateService);
  private mapperService = inject(LotoPointMapperService);
  protected contextMenuService = inject(LotoPointContextMenuService);
  // clickService = inject(RfLotoPointClickService);
  private destroyRef = inject(DestroyRef);

  // tableClickService!: TableClickService;

  // Inputs
  inputItems = input<LotoPointDto[] | null>(null);
  loadMoreEnabled = input<boolean>(true);
  enableDragDrop = input<boolean>(false);
  filterOutItems = input<FilterOutRules | undefined>();
  hoverDebounceTime = input<number>(0);
  tableControlButtonsInput = input<ButtonConfig[] | undefined>();
  defaultTableControlsEnabled = input<boolean>(true);
  selectionControlButtonsInput = input<ButtonConfig[] | undefined>();
  fieldsToDisplay = input<(keyof LotoPointDto)[]>([
    'isVerified',
    'tagNumber',
    'description',
    'specificLocation',
    'isoPos',
    'normPos',
    'zeroEnergyMethod',
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
  items$ = toSignal(this.stateService.allLoadedLotoPoints$, {
    initialValue: [],
  });
  tableMode = signal<TableMode>('row');
  columns = signal<Column[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  items = computed(() => {
    return this.inputItems() ?? this.items$();
  });

  selectionControlButtons = computed(() => {
    return (
      this.selectionControlButtonsInput() ?? [
        {
          name: 'Select',
          action: () => {
            // Implement selection logic
            console.log('Select is not implemented yet.');
          },
          color: 'primary' as ButtonColor,
        },
        {
          name: 'Delete',
          action: () => {
            // Implement delete logic
            console.log('Delete is not implemented yet.');
          },
          color: 'warn' as ButtonColor,
        },
      ]
    );
  });

  tableControlButtons = computed(() => {
    const inputButtons = this.tableControlButtonsInput();
    const defaultEnabled = this.defaultTableControlsEnabled();

    // Only input provided and default disabled
    if (inputButtons && !defaultEnabled) {
      return inputButtons;
    }

    // Only default enabled (no input or input is empty)
    if (!inputButtons && defaultEnabled) {
      return this.getDefaultTableControlButtons();
    }

    // Both input and default enabled - combine them
    if (inputButtons && defaultEnabled) {
      return [...this.getDefaultTableControlButtons(), ...inputButtons];
    }

    // Neither enabled
    return [];
  });


  private getDefaultTableControlButtons(): ButtonConfig[] {
    return [
      {
        name: 'LP-Table default1',
        action: () => {
          // Implement selection logic
          console.log('Select is not implemented yet.');
        },
        color: 'primary' as ButtonColor,
      },
      {
        name: 'LP-Table default2',
        action: () => {
          // Implement delete logic
          console.log('Delete is not implemented yet.');
        },
        color: 'warn' as ButtonColor,
      },
    ];
  }



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

  private injector = inject(Injector);
  private effectRefs: EffectRef[] = [];

  ngAfterViewInit() {
    // this.tableClickService = this.tableComponent.clickService;
    // this.setupClickHandlers();
  }

  ngOnDestroy() {
    // this.effectRef?.destroy();
    this.effectRefs.forEach(ref => ref.destroy());
  }

  onTableModeChange(mode: TableMode) {
    this.tableMode.set(mode);
  }

  /**
   * Load initial batch of LOTO points
   */
  private loadInitialData(): void {
    if (this.inputItems()) return; // If items are provided, no need to load initial data.

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .getLotoPoints(this.stateService.getCurrentPage(), 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
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
   * Load unique items for a column (delegates to state service)
   */
  loadUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof LotoPointDto;
    this.stateService.loadUniqueItems(key, searchString);
  }

  /**
   * Load more unique items for a column (delegates to state service)
   */
  loadMoreUniqueItems(columnKey: string, searchString: string): void {
    const key = columnKey as keyof LotoPointDto;
    this.stateService.loadMoreUniqueItems(key, searchString);
    // this.onLoadMore()
  }

  /**
   * Clear unique values cache (delegates to state service)
   */
  clearUniqueValuesCache(): void {
    this.stateService.clearUniqueValuesCache();
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
    if (!inputItems || inputItems.length === 0) return;

    let filtered = inputItems;

    if (criteria.type === 'global' && criteria.query) {
      // Global search across all properties
      filtered = inputItems.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(criteria.query!.toLowerCase())
        )
      );
    } else if (criteria.type === 'column' && criteria.filters) {
      // Column-specific search
      filtered = inputItems.filter((item) =>
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
      pageSize: 50,
    };

    // Save the merged search criteria to state for later use (e.g., when sorting)
    this.stateService.setSearchCriteria(mergedCriteria);
    this.stateService.resetPage();
    this.stateService.clearLotoPoints();

    this.apiService
      .searchLotoPoints(mergedCriteria, 50)
      .pipe(
        tap((response) => {
          if (response.responseData?.content) {
            // Replace current items with search results
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
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
      type: existingCriteria.type ?? 'sort',
    };

    this.stateService.clearLotoPoints();
    this.stateService.resetPage();
    this.stateService.setSearchCriteria(searchCriteria);

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .searchLotoPoints(searchCriteria, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
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
      sortDirection:
        incomingCriteria.sortDirection || existingCriteria?.sortDirection,
      page: this.stateService.getCurrentPage(),
    };

    this.apiService
      .searchLotoPoints(loadMoreCriteria, 50)
      .pipe(
        tap((response) => {
          if (
            response.responseData?.content &&
            response.responseData.content.length > 0
          ) {
            this.stateService.addLotoPoints(response.responseData.content);
            this.stateService.incrementPage();
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading more LOTO points:', error);
          this.isLoading.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }


//   //============================Click Events============================



// private setupClickHandlers(): void {
//   // Handle row left click
//   this.effectRefs.push(
//     runInInjectionContext(this.injector, () => {
//       return effect(() => {
//         console.log('Row left clicked');
//         const clickEvent = this.tableClickService.rowLeftClicked();
//         if (clickEvent) {
//           this.handleRowLeftClick(clickEvent.item);
//         }
//         console.log('Signal changed:', clickEvent);
//       });
//     })
//   );

//   // Handle row double click
//   this.effectRefs.push(
//     runInInjectionContext(this.injector, () => {
//       return effect(() => {
//         const item = this.tableClickService.rowDoubleClicked();
//         if (item) {
//           this.handleRowDoubleClick(item.item as LotoPointDto);
//         }
//       });
//     })
//   );

//   // Handle row right click
//   this.effectRefs.push(
//     runInInjectionContext(this.injector, () => {
//       return effect(() => {
//         const clickEvent = this.tableClickService.rowRightClicked();
//         if (clickEvent) {
//           this.handleRowRightClick(clickEvent.item, clickEvent.event);
//         }
//       });
//     })
//   );

//   // Handle row middle click
//   this.effectRefs.push(
//     runInInjectionContext(this.injector, () => {
//       return effect(() => {
//         const clickEvent = this.tableClickService.rowMiddleClicked();
//         if (clickEvent) {
//           this.handleRowMiddleClick(clickEvent.item);
//         }
//       });
//     })
//   );

//   // Handle cell click
//   this.effectRefs.push(
//     runInInjectionContext(this.injector, () => {
//       return effect(() => {
//         const cellEvent = this.tableClickService.cellClicked();
//         if (cellEvent) {
//           this.handleCellClick(cellEvent.item, cellEvent.column);
//         }
//       });
//     })
//   );

//   // Handle cell double click
//   this.effectRefs.push(
//     runInInjectionContext(this.injector, () => {
//       return effect(() => {
//         const cellEvent = this.tableClickService.cellDoubleClicked();
//         if (cellEvent) {
//           this.handleCellDoubleClick(cellEvent.item, cellEvent.column);
//         }
//       });
//     })
//   );

//   // Handle cell right click
//   this.effectRefs.push(
//     runInInjectionContext(this.injector, () => {
//       return effect(() => {
//         const cellEvent = this.tableClickService.cellRightClicked();
//         if (cellEvent) {
//           this.handleCellRightClick(cellEvent.item, cellEvent.column);
//         }
//       });
//     })
//   );

//   // Handle cell middle click
//   this.effectRefs.push(
//     runInInjectionContext(this.injector, () => {
//       return effect(() => {
//         const cellEvent = this.tableClickService.cellMiddleClicked();
//         if (cellEvent) {
//           this.handleCellMiddleClick(cellEvent.item, cellEvent.column);
//         }
//       });
//     })
//   );
// }
//   /**
//    * Handle row left click
//    */
//   private handleRowLeftClick(item: LotoPointDto): void {
//     console.log('Row left clicked item:', item);
//     this.stateService.setSelectedItem(item);
//     this.openForm();
//   }

//   /**
//    * Handle row double click
//    */
//   private handleRowDoubleClick(item: LotoPointDto): void {
//     console.log('Row double clicked item:', item);
//   }

//   /**
//    * Handle row right click
//    */
//   private handleRowRightClick(item: LotoPointDto, event: MouseEvent): void {
//     this.contextMenuService.showContextMenu(item, event);
//     this.contextMenuService.positionContextMenu(event, 220, 320);
//   }

//   /**
//    * Handle row middle click
//    */
//   private handleRowMiddleClick(item: LotoPointDto): void {
//     console.log('Row middle clicked item:', item);
//   }

//   /**
//    * Handle cell click
//    */
//   private handleCellClick(item: LotoPointDto, column: Column): void {
//     console.log('Cell clicked item:', item);
//     console.log('Cell clicked column:', column);
//     const field = column.accessorKey as keyof LotoPointModel;
//     this.stateService.setSelectedItem(item);
//     this.openForm([field]);
//   }

//   /**
//    * Handle cell double click
//    */
//   private handleCellDoubleClick(item: LotoPointDto, column: Column): void {
//     console.log('Cell double clicked item:', item);
//     console.log('Cell double clicked column:', column);
//   }

//   /**
//    * Handle cell right click
//    */
//   private handleCellRightClick(item: LotoPointDto, column: Column): void {
//     console.log('Cell right clicked item:', item);
//     console.log('Cell right clicked column:', column);
//   }

//   /**
//    * Handle cell middle click
//    */
//   private handleCellMiddleClick(item: LotoPointDto, column: Column): void {
//     console.log('Cell middle clicked item:', item);
//     console.log('Cell middle clicked column:', column);
//   }



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



// import {
//   AfterViewInit,
//   Component,
//   DestroyRef,
//   inject,
//   input,
//   OnInit,
//   output,
//   signal,
//   effect,
//   computed
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RfLotoPointApiService } from '../services/rf-loto-point-api.service';
// import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
// import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
// import { tap, catchError } from 'rxjs/operators';
// import { of } from 'rxjs';
// import { FilterOutRules, TableComponent } from '../../../../shared/table/refactored/table.component';
// import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
// import { LotoPointDto, LotoPointFieldName, LotoPointModel } from '../../../../models/loto/loto-point.model';
// import { Column } from '../../../../models/column.model';
// import { SearchCriteria } from '../../../../models/api/search-criteria.model';
// import { ButtonColor, ButtonConfig, ButtonsComponent } from '../../../../shared/menu/buttons/buttons.component';
// import { LotoPointContextMenuService } from '../loto-point-context-menu/loto-point-context-menu.service';
// import { RfLotoPointFormComponent } from "../rf-loto-point-form/rf-loto-point-form.component";
// import { PopupProjectionComponent } from "../../../../shared/popup-projection/popup-projection.component";
// import { ContextMenuComponent } from "../../../../shared/menu/context-menu/context-menu.component";
// import { TableMode } from '../../../../shared/table/refactored/services/table-state.service';

// @Component({
//   selector: 'app-rf-loto-point-table',
//   standalone: true,
//   imports: [
//     CommonModule,
//     TableComponent,
//     ButtonsComponent,
//     RfLotoPointFormComponent,
//     PopupProjectionComponent,
//     ContextMenuComponent
// ],
//   providers: [ContextMenuComponent],
//   templateUrl: './rf-loto-point-table.component.html',
//   styleUrl: './rf-loto-point-table.component.css',
// })
// export class RfLotoPointTableComponent implements OnInit, AfterViewInit {
//   private apiService = inject(RfLotoPointApiService);
//   protected stateService = inject(RfLotoPointStateService);
//   private mapperService = inject(LotoPointMapperService);
//   protected contextMenuService = inject(LotoPointContextMenuService);
//   private destroyRef = inject(DestroyRef);

//   // Inputs
//   inputItems = input<LotoPointDto[] | null>(null);
//   loadMoreEnabled = input<boolean>(true);
//   enableDragDrop = input<boolean>(false);
//   filterOutItems = input<FilterOutRules | undefined>();
//   hoverDebounceTime = input<number>(0);
//   tableControlButtonsInput = input<ButtonConfig[] | undefined>();
//   defaultTableControlsEnabled = input<boolean>(true);
//   selectionControlButtonsInput = input<ButtonConfig[] | undefined>();
//   fieldsToDisplay = input<(keyof LotoPointDto)[]>([
//     'isVerified',
//     'tagNumber',
//     'description',
//     'specificLocation',
//     'isoPos',
//     'normPos',
//     'zeroEnergyMethod',
//   ]);

//   // Outputs
//   rowLeftClickEvent = output<LotoPointDto>();
//   rowDoubleClickEvent = output<LotoPointDto>();
//   rowRightClickEvent = output<LotoPointDto>();
//   rowMiddleClickEvent = output<LotoPointDto>();
//   cellDoubleClickEvent = output<{ item: LotoPointDto; column: Column }>();
//   selectedItemsEvent = output<LotoPointDto[]>();
//   itemsReorderedEvent = output<LotoPointDto[]>();

//   // State
//   items$ = toSignal(this.stateService.allLoadedLotoPoints$, {
//     initialValue: [],
//   });
//   tableMode = signal<TableMode>('row');
//   columns = signal<Column[]>([]);
//   formFields = signal<LotoPointFieldName[]>([]);
//   isLoading = signal<boolean>(false);
//   errorMessage = signal<string | null>(null);

//   items = computed(() => {
//     return this.inputItems() ?? this.items$();
//   });

//   selectionControlButtons = computed(() => {
//     return (
//       this.selectionControlButtonsInput() ?? [
//         {
//           name: 'Select',
//           action: () => {
//             // Implement selection logic
//             console.log('Select is not implemented yet.');
//           },
//           color: 'primary' as ButtonColor,
//         },
//         {
//           name: 'Delete',
//           action: () => {
//             // Implement delete logic
//             console.log('Delete is not implemented yet.');
//           },
//           color: 'warn' as ButtonColor,
//         },
//       ]
//     );
//   });

//   tableControlButtons = computed(() => {
//     const inputButtons = this.tableControlButtonsInput();
//     const defaultEnabled = this.defaultTableControlsEnabled();

//     // Only input provided and default disabled
//     if (inputButtons && !defaultEnabled) {
//       return inputButtons;
//     }

//     // Only default enabled (no input or input is empty)
//     if (!inputButtons && defaultEnabled) {
//       return this.getDefaultTableControlButtons();
//     }

//     // Both input and default enabled - combine them
//     if (inputButtons && defaultEnabled) {
//       return [...this.getDefaultTableControlButtons(), ...inputButtons];
//     }

//     // Neither enabled
//     return [];
//   });

//   isLotoPointFormOpen = signal<boolean>(false);

//   private getDefaultTableControlButtons(): ButtonConfig[] {
//     return [
//       {
//         name: 'LP-Table default1',
//         action: () => {
//           // Implement selection logic
//           console.log('Select is not implemented yet.');
//         },
//         color: 'primary' as ButtonColor,
//       },
//       {
//         name: 'LP-Table default2',
//         action: () => {
//           // Implement delete logic
//           console.log('Delete is not implemented yet.');
//         },
//         color: 'warn' as ButtonColor,
//       },
//     ];
//   }

//   constructor() {
//     // Initialize columns whenever fieldsToDisplay changes
//     effect(() => {
//       const fields = this.fieldsToDisplay();
//       this.columns.set(this.mapperService.toTableColumns(fields));
//     });
//   }

//   ngOnInit(): void {
//     this.loadInitialData();
//   }

//   ngAfterViewInit(): void {
//     // Any additional initialization after view is ready
//   }

//   onTableModeChange(mode: TableMode) {
//     this.tableMode.set(mode);
//   }

//   /**
//    * Load initial batch of LOTO points
//    */
//   private loadInitialData(): void {
//     if (this.inputItems()) return; // If items are provided, no need to load initial data.

//     this.isLoading.set(true);
//     this.errorMessage.set(null);

//     this.apiService
//       .getLotoPoints(this.stateService.getCurrentPage(), 50)
//       .pipe(
//         tap((response) => {
//           if (
//             response.responseData?.content &&
//             response.responseData.content.length > 0
//           ) {
//             this.stateService.addLotoPoints(response.responseData.content);
//             this.stateService.incrementPage();
//           }
//           this.isLoading.set(false);
//         }),
//         catchError((error) => {
//           console.error('Error loading LOTO points:', error);
//           this.errorMessage.set('Failed to load LOTO points');
//           this.isLoading.set(false);
//           return of(null);
//         }),
//         takeUntilDestroyed(this.destroyRef)
//       )
//       .subscribe();
//   }
//   /**
//    * Load unique items for a column (delegates to state service)
//    */
//   loadUniqueItems(columnKey: string, searchString: string): void {
//     const key = columnKey as keyof LotoPointDto;
//     this.stateService.loadUniqueItems(key, searchString);
//   }

//   /**
//    * Load more unique items for a column (delegates to state service)
//    */
//   loadMoreUniqueItems(columnKey: string, searchString: string): void {
//     const key = columnKey as keyof LotoPointDto;
//     this.stateService.loadMoreUniqueItems(key, searchString);
//     // this.onLoadMore()
//   }

//   /**
//    * Clear unique values cache (delegates to state service)
//    */
//   clearUniqueValuesCache(): void {
//     this.stateService.clearUniqueValuesCache();
//   }

//   /**
//    * Handle search/filter from table component
//    */
//   onSearch(criteria: SearchCriteria): void {
//     const isUsingInputItems = this.inputItems();

//     if (isUsingInputItems) {
//       // Search within provided items only
//       this.searchWithinInputItems(criteria);
//     } else {
//       // Search in database
//       this.searchInDatabase(criteria);
//     }
//   }

//   /**
//    * Search within the provided input items
//    */
//   private searchWithinInputItems(criteria: SearchCriteria): void {
//     const inputItems = this.inputItems();
//     if (!inputItems || inputItems.length === 0) return;

//     let filtered = inputItems;

//     if (criteria.type === 'global' && criteria.query) {
//       // Global search across all properties
//       filtered = inputItems.filter((item) =>
//         Object.values(item).some((value) =>
//           String(value).toLowerCase().includes(criteria.query!.toLowerCase())
//         )
//       );
//     } else if (criteria.type === 'column' && criteria.filters) {
//       // Column-specific search
//       filtered = inputItems.filter((item) =>
//         Object.entries(criteria.filters!).every(([key, value]) => {
//           if (!value) return true;
//           const itemValue = (item as any)[key];
//           return String(itemValue).toLowerCase().includes(value.toLowerCase());
//         })
//       );
//     }
//   }

//   /**
//    * Search in database
//    */

//   private searchInDatabase(criteria: SearchCriteria): void {
//     this.isLoading.set(true);
//     this.errorMessage.set(null);

//     // Get existing criteria and merge with new search
//     const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};

//     const mergedCriteria: SearchCriteria = {
//       ...existingCriteria,
//       ...criteria,
//       page: 1,
//       pageSize: 50,
//     };

//     // Save the merged search criteria to state for later use (e.g., when sorting)
//     this.stateService.setSearchCriteria(mergedCriteria);
//     this.stateService.resetPage();
//     this.stateService.clearLotoPoints();

//     this.apiService
//       .searchLotoPoints(mergedCriteria, 50)
//       .pipe(
//         tap((response) => {
//           if (response.responseData?.content) {
//             // Replace current items with search results
//             this.stateService.addLotoPoints(response.responseData.content);
//             this.stateService.incrementPage();
//           }
//           this.isLoading.set(false);
//         }),
//         catchError((error) => {
//           console.error('Error searching LOTO points:', error);
//           this.errorMessage.set('Search failed');
//           this.isLoading.set(false);
//           return of(null);
//         }),
//         takeUntilDestroyed(this.destroyRef)
//       )
//       .subscribe();
//   }

//   onTableSortChanged(event: { column: Column; isAscending: boolean }): void {
//     const isUsingInputItems = this.inputItems();

//     if (isUsingInputItems) {
//       return;
//     }

//     // Get the existing search criteria and merge with new sort
//     const existingCriteria = this.stateService.getCurrentSearchCriteria() || {};

//     const searchCriteria: SearchCriteria = {
//       ...existingCriteria,
//       sortColumn: event.column.id,
//       sortDirection: event.isAscending ? 'ASC' : 'DESC',
//       page: 1,
//       pageSize: 50,
//       type: existingCriteria.type ?? 'sort',
//     };

//     this.stateService.clearLotoPoints();
//     this.stateService.resetPage();
//     this.stateService.setSearchCriteria(searchCriteria);

//     this.isLoading.set(true);
//     this.errorMessage.set(null);

//     this.apiService
//       .searchLotoPoints(searchCriteria, 50)
//       .pipe(
//         tap((response) => {
//           if (
//             response.responseData?.content &&
//             response.responseData.content.length > 0
//           ) {
//             this.stateService.addLotoPoints(response.responseData.content);
//             this.stateService.incrementPage();
//           }
//           this.isLoading.set(false);
//         }),
//         catchError((error) => {
//           console.error('Error loading sorted LOTO points:', error);
//           this.errorMessage.set('Failed to load sorted data');
//           this.isLoading.set(false);
//           return of(null);
//         }),
//         takeUntilDestroyed(this.destroyRef)
//       )
//       .subscribe();
//   }

//   onLoadMore(criteria: SearchCriteria | void): void {
//     if (!this.loadMoreEnabled()) return;
//     if (this.isLoading()) return;

//     this.isLoading.set(true);

//     // Combine incoming criteria with existing state, preserving sort
//     const existingCriteria = this.stateService.getCurrentSearchCriteria();
//     const incomingCriteria = criteria || {};

//     const loadMoreCriteria: SearchCriteria = {
//       ...(existingCriteria || { type: 'column', filters: {} }),
//       ...incomingCriteria,
//       // Explicitly preserve sort state - don't let incoming criteria override it
//       sortColumn: incomingCriteria.sortColumn || existingCriteria?.sortColumn,
//       sortDirection:
//         incomingCriteria.sortDirection || existingCriteria?.sortDirection,
//       page: this.stateService.getCurrentPage(),
//     };

//     this.apiService
//       .searchLotoPoints(loadMoreCriteria, 50)
//       .pipe(
//         tap((response) => {
//           if (
//             response.responseData?.content &&
//             response.responseData.content.length > 0
//           ) {
//             this.stateService.addLotoPoints(response.responseData.content);
//             this.stateService.incrementPage();
//           }
//           this.isLoading.set(false);
//         }),
//         catchError((error) => {
//           console.error('Error loading more LOTO points:', error);
//           this.isLoading.set(false);
//           return of(null);
//         }),
//         takeUntilDestroyed(this.destroyRef)
//       )
//       .subscribe();
//   }

//   /**
//    * Handle row left click
//    */
//   onRowLeftClick(event: { item: LotoPointDto; event: MouseEvent }): void {
//     this.rowLeftClickEvent.emit(event.item);
//     console.log('Row left clicked item:', event.item);
//     this.stateService.setSelectedItem(event.item);
//     this.openForm();
//   }

//   /**
//    * Handle row double click
//    */
//   onRowDoubleClick(item: LotoPointDto): void {
//     this.rowDoubleClickEvent.emit(item);
//     console.log('Row double clicked item:', item);
//   }

//   onRowRightClick(event: { item: LotoPointDto; event: MouseEvent }): void {
//     this.rowRightClickEvent.emit(event.item);
//     this.contextMenuService.showContextMenu(event.item, event.event);
//     // Position with estimated menu dimensions
//     this.contextMenuService.positionContextMenu(event.event, 220, 320);
//   }

//   /**
//    * Handle row middle click
//    */
//   onRowMiddleClick(item: LotoPointDto): void {
//     this.rowMiddleClickEvent.emit(item);
//     console.log('Row middle clicked item:', item);
//   }

//   /**
//    * Handle cell double click
//    */
//   onCellDoubleClick(event: { item: LotoPointDto; column: Column }): void {
//     this.cellDoubleClickEvent.emit(event);
//     console.log('Cell double clicked item:', event.item);
//     console.log('Cell double clicked column:', event.column);
//   }

//   onCellClick = (event: { item: LotoPointDto; column: Column }) => {
//     console.log('Cell clicked item:', event.item);
//     console.log('Cell clicked column:', event.column);
//     const field = event.column.accessorKey as keyof LotoPointModel;
//     this.stateService.setSelectedItem(event.item);
//     this.openForm([field]);
//     // Implement your cell click logic here
//   };

//   onCellRightClick = (event: { item: LotoPointDto; column: Column }) => {
//     console.log('Cell right clicked item:', event.item);
//     console.log('Cell right clicked column:', event.column);
//     // Implement your cell right-click logic here
//   };

//   onCellMiddleClick = (event: { item: LotoPointDto; column: Column }) => {
//     console.log('Cell middle clicked item:', event.item);
//     console.log('Cell middle clicked column:', event.column);
//     // Implement your cell middle-click logic here
//   };

//   /**
//    * Handle selected items change
//    */
//   onSelectedItems(items: LotoPointDto[]): void {
//     this.stateService.setSelectedLotoPoints(items);
//     this.selectedItemsEvent.emit(items);
//   }

//   /**
//    * Handle items reordered
//    */
//   onItemsReordered(items: LotoPointDto[]): void {
//     this.itemsReorderedEvent.emit(items);
//   }

//   /**
//    * Handle form
//    */
//   openForm(fields: LotoPointFieldName[] = []): void {
//     this.formFields.set(fields);
//     this.isLotoPointFormOpen.set(true);
//   }

//   closeForm(): void {
//     this.isLotoPointFormOpen.set(false);
//     this.stateService.selectedItem.set(null);
//   }
// }