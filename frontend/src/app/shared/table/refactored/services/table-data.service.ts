import { computed, ElementRef, Injectable, signal, TemplateRef } from "@angular/core";
import { Column } from "../../../../models/column.model";
import { ButtonConfig } from "../../../menu/buttons/buttons.component";
import { ClickSetup, FilterOutRules } from "../table.component";
import { CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { SearchCriteria } from "../../../../models/api/search-criteria.model";

@Injectable()
export class TableDataService {
  //Input Signals
  items = signal<any[]>([]);
  columns = signal<Column[]>([]);
  columnUniqueOptions = signal<string[]>([]);
  isLoadingMore = signal<boolean>(false);
  deleteItem = signal<string | undefined>(undefined);
  hoverDebounceTime = signal<number>(0);
  isDragAndDropEnabled = signal<boolean>(false);
  filterOutItems = signal<FilterOutRules | undefined>(undefined);
  clickSetupInput = signal<ClickSetup>({
    applyTo: 'row',
    actions: ['leftClick', 'rightClick', 'middleClick', 'doubleClick'],
  });
  tableControlButtonsInput = signal<ButtonConfig[] | undefined>(undefined);
  defaultTableControlsEnabled = signal<boolean>(true);

  //Calculated Values
  filteredItems: any[] = [];
  globalSearchQuery: string = '';
  columnFilters = signal<{ [key: string]: string }>({});

  excludedItemIds = new Set<any>();
  highlightedItemIds = new Set<any>();
  highlightStyle: { [key: string]: string } = {};

  currentSortColumn: string | null = null;
  isAscending: boolean = true;

  selectedItems = signal<any[]>([]);
  hoveredRow = signal<any | undefined>(undefined);

  rowHeight = 50;
  totalTableWidth = computed(() => this.columns().reduce((sum, col) => sum + (col.width || 120), 0))

  // ViewChild signals - set from component
  headerContainer = signal<ElementRef<HTMLDivElement> | undefined>(undefined);
  headerTable = signal<ElementRef<HTMLTableElement> | undefined>(undefined);
  bodyTable = signal<ElementRef<HTMLTableElement> | undefined>(undefined);
  tableBody = signal<ElementRef<HTMLDivElement> | undefined>(undefined);
  viewport = signal<CdkVirtualScrollViewport | undefined>(undefined);
  selectionActionsTemplate = signal<TemplateRef<any> | undefined>(undefined);

  //Output Signals
  loadMoreItems = signal<SearchCriteria>({});
  search = signal<SearchCriteria>({});
  sortChanged = signal<{ column: Column; isAscending: boolean } | null>(null);
  itemsReordered = signal<any[]>([]);
}