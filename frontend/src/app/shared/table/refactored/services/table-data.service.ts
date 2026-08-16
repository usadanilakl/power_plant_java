import { computed, ElementRef, Injectable, signal, TemplateRef } from "@angular/core";
import { Column } from "../../../../models/column.model";
import { ButtonConfig } from "../../../menu/buttons/buttons.component";
import { ClickSetup, FilterOutRules } from "../table.component";
import { CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { SearchCriteria } from "../../../../models/api/search-criteria.model";
import { filterLogic } from "./table-search.service";

@Injectable()
export class TableDataService {
  //Input Signals
  tableId: string = '';
  items = signal<any[]>([]);
  columns = signal<Column[]>([]);
  columnUniqueOptions = signal<string[]>([]);
  isLoadingMore = signal<boolean>(false);
  deleteItem = signal<string | undefined>(undefined);
  hoverDebounceTime = signal<number>(0);
  isDragAndDropEnabled = signal<boolean>(false);
  /**
   * Whether the user may actually change the order. Separate from
   * {@link isDragAndDropEnabled}, which declares the table an ORDERED list
   * (and therefore suppresses column sorting). A read-only viewer of an
   * ordered list keeps drag-drop "enabled" — so the rows stay in their
   * authoritative order — but cannot drag.
   */
  isReorderAllowed = signal<boolean>(true);
  filterOutItems = signal<FilterOutRules | undefined>(undefined);
  clickSetupInput = signal<ClickSetup>({
    applyTo: 'row',
    actions: ['leftClick', 'rightClick', 'middleClick', 'doubleClick'],
  });

  //Calculated Values
  filteredItems = signal<any[]>([]);
  globalSearchQuery: string = '';
  columnFilters = signal<{ [key: string]: string }>({});
  columnFilterLogic: { [key: string]: filterLogic } = {};
  globalFilterLogic: filterLogic = 'AND';
  isTableIsolated = signal<boolean>(false);
  currentSearchCriteria: SearchCriteria = { type: 'column', query: '', filters: {}, columnFilterLogic: {}, globalFilterLogic: 'AND' };

  /**
   * Row count at which the last "load more" was requested, or -1 for "none
   * pending". The viewport re-emits scrolledIndexChange for reasons other than
   * user scrolling (re-render, resize, width sync), and the near-the-end test
   * is permanently true for any list shorter than the viewport — so without
   * this the table re-requests the same page forever. Reset whenever the list
   * is emptied (a fresh search) so pagination can start over.
   */
  lastLoadMoreLength = -1;

  excludedItemIds = new Set<any>();
  highlightedItemIds = new Set<any>();
  highlightStyle: { [key: string]: string } = {};

  currentSortColumn: string | null = null;
  isAscending: boolean = true;

  selectedItems = signal<any[]>([]);
  hoveredRow = signal<any | undefined>(undefined);

  rowHeight = 48;
  totalTableWidth = computed(() =>
    this.columns().reduce((sum, col) => sum + (col.width || 120), 0)
  );

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
  loadMoreOptions = signal<{ column: string; filter: string, logic: filterLogic } | null>(null);
  loadInitialOptions = signal<{ column: string; filter: string, logic: filterLogic } | null>(null);
  rowDoubleClicked = signal<any | null>(null);

}
