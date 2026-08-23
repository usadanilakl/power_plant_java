
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


/**
 * Page size used when loading a column filter's option list.
 * <p>
 * Deliberately large enough to bring back the column's WHOLE distinct value set in one
 * request, for both dropdown sections. The list used to arrive 50 at a time and grow only
 * as the dropdown was scrolled, so what you could see and pick depended on how far you had
 * scrolled — a filter's option list should be the complete set of values, not a window
 * onto it. The typed term is still sent to the server, so a column with more distinct
 * values than this ceiling stays reachable by typing.
 */
export const COLUMN_OPTION_FETCH_SIZE = 5000;
