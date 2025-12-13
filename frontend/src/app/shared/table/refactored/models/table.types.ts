
export interface DragState {
  isDragging: boolean;
  draggedItem: any | null;
  startPosition: { x: number; y: number };
  ghostRowIndex: number | null;
}

export interface TableState {
  globalSearchQuery: string;
  columnFilters: { [key: string]: string };
  currentSortColumn: string | null;
  isAscending: boolean;
  selectedItems: any[];
  lastClickedItem: any | null;
}

export interface ClickState {
  lastClickTime: number;
  isDoubleClickHandled: boolean;
}

export interface SynchronizationState {
  headerTable: HTMLTableElement | null;
  bodyTable: HTMLTableElement | null;
  headerContainer: HTMLDivElement | null;
}
