import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  PLATFORM_ID,
  TemplateRef,
  viewChild,
} from '@angular/core';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Column } from '../../../models/column.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
import { TableDragService } from './services/table-drag.service';
import { TableClickService } from './services/table-click.service';
import { TableSyncService } from './services/table-sync.service';
import { TableSearchService } from './services/table-search.service';
import { TableSortService } from './services/table-sort.service';
import { TableSelectionService } from './services/table-selection.service';
import { TableResizeService } from './services/table-resize.service';
import { ColumnFilterInputComponent } from './column-filter-input/column-filter-input.component';
import {
  ButtonConfig,
  ButtonsComponent,
} from '../../menu/buttons/buttons.component';
import { TableControlsService } from './services/table-controls.service';
import { TableDataService } from './services/table-data.service';
import { TableUtilService } from './services/table-util.service';

export interface ClickSetup {
  applyTo: 'row' | 'cell';
  actions: ('leftClick' | 'rightClick' | 'middleClick' | 'doubleClick')[];
}

export interface FilterOutRules {
  action: 'highlight' | 'exclude';
  items: any[];
  style: { [key: string]: string };
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    ColumnFilterInputComponent,
    ButtonsComponent,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
})
export class TableComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  protected dragService = inject(TableDragService);
  public clickService = inject(TableClickService);
  protected syncService = inject(TableSyncService);
  protected searchService = inject(TableSearchService);
  protected sortService = inject(TableSortService);
  protected selectionService = inject(TableSelectionService);
  protected resizeService = inject(TableResizeService);
  protected controlsService = inject(TableControlsService);
  protected dataService = inject(TableDataService);
  protected utilService = inject(TableUtilService);

  // Inputs
  items = input.required<any[]>();
  columns = input<Column[]>([]);
  columnUniqueOptions = input<string[]>([]);
  isLoadingMore = input<boolean>(false);
  deleteItem = input<string | undefined>();
  hoverDebounceTime = input<number>(0);
  isDragAndDropEnabled = input<boolean>(false);
  filterOutItems = input<FilterOutRules | undefined>();
  clickSetupInput = input<ClickSetup>({
    applyTo: 'row',
    actions: ['leftClick', 'rightClick', 'middleClick', 'doubleClick'],
  });

  // Outputs
  loadMoreItems = output<SearchCriteria>();
  search = output<SearchCriteria>();
  rowHoveredEvent = output<any>();
  selectedItemsEvent = output<any[]>();
  itemsReordered = output<any[]>();
  sortChanged = output<{ column: Column; isAscending: boolean }>();
  loadMoreOptions = output<{ column: string; filter: string }>();
  loadInitialOptions = output<{ column: string; filter: string }>();

  headerContainer = viewChild<ElementRef<HTMLDivElement>>('headerContainer');
  headerTable = viewChild<ElementRef<HTMLTableElement>>('headerTable');
  bodyTable = viewChild<ElementRef<HTMLTableElement>>('bodyTable');
  tableBody = viewChild<ElementRef<HTMLDivElement>>('tableBody');
  viewport = viewChild(CdkVirtualScrollViewport);
  selectionActionsTemplate = viewChild(TemplateRef);


  // Signals from services
  lastClickedItem = this.selectionService.lastClickedItem$;


  private columnsEffect = effect(() => {
    const columns = this.columns();
    this.dataService.columns.set(columns);
  });
  
  private itemsEffect = effect(() => {
    const items = this.items();
    this.dataService.items.set(items);
    this.clickService.allItems.set(items);
    this.searchService.updateFilteredItems();
    this.cdr.detectChanges();
  });

  private flagEffects = effect(() => {
    this.dataService.isDragAndDropEnabled.set(this.isDragAndDropEnabled());
  });

  private filterOutEffect = effect(() => {
    const rules = this.filterOutItems();
    this.dataService.excludedItemIds.clear();
    this.dataService.highlightedItemIds.clear();
    this.dataService.highlightStyle = {};

    if (rules && rules.items.length > 0) {
      const itemIds = new Set(rules.items.map((item) => item.id));
      if (rules.action === 'exclude') {
        this.dataService.excludedItemIds = itemIds;
      } else if (rules.action === 'highlight') {
        this.dataService.highlightedItemIds = itemIds;
        this.dataService.highlightStyle = rules.style;
      }
    }
    this.searchService.updateFilteredItems();
  });

  // columnUniqueValuesMap = computed(() => {
  //   const currentItems = this.items();
  //   const currentColumns = this.columns();

  //   if (!currentItems || !currentColumns) return;

  //   const uniqueValuesMap: { [columnId: string]: string[] } = {};

  //   currentColumns.forEach((column) => {
  //     if (!column.filterable) return;

  //     const uniqueValues = new Set<string>();

  //     currentItems.forEach((item) => {
  //       const value = this.utilService.getCellValue(item, column);
  //       if (value !== null && value !== undefined && value !== '') {
  //         uniqueValues.add(String(value).toLowerCase());
  //       }
  //     });

  //     uniqueValuesMap[column.id] = Array.from(uniqueValues).sort();
  //   });

  //   return uniqueValuesMap;
  // });

  private syncDataTableServiceEffect = effect(() => {
    this.dataService.headerContainer.set(this.headerContainer());
    this.dataService.headerTable.set(this.headerTable());
    this.dataService.bodyTable.set(this.bodyTable());
    this.dataService.tableBody.set(this.tableBody());
    this.dataService.viewport.set(this.viewport());
    this.dataService.selectionActionsTemplate.set(
      this.selectionActionsTemplate()
    );
  });

 

  constructor() {
    effect(() => {
      this.loadMoreItems.emit(this.dataService.loadMoreItems());
    });
    effect(() => {
      this.selectedItemsEvent.emit(this.dataService.selectedItems());
    });
    effect(() => {
      const value = this.dataService.search();
      const notEmpty = value && (value.filters || value.query);
      if(notEmpty)this.search.emit(value);
    });
    effect(() => {
      const value = this.dataService.sortChanged();
      if(value)this.sortChanged.emit(value);
    });
    effect(() => {
      const value = this.dataService.itemsReordered();
      const notEmpty = value && value.length > 0;
      if (notEmpty) this.itemsReordered.emit(value);
    });
    effect(() => {
      this.rowHoveredEvent.emit(this.dataService.hoveredRow());
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.syncService.initializeTable();
    this.syncService.setupResizeObserver();
    this.syncService.setupHorizontalScrollSync();
    this.resizeService.setupResizeListeners();
  }

  ngOnDestroy(): void {
    this.clickService.onDestroy();
  }
}
