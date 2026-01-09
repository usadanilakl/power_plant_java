import { Tour } from '../tour.model';

export const TABLE_TOUR: Tour = {
  id: 'table',
  name: 'Table Interactions',
  description: 'Learn how to use the data tables effectively',
  steps: [
    {
      element: '.table-wrapper',
      popover: {
        title: 'Data Table',
        description:
          'This is the main data table. It supports searching, filtering, sorting, and multi-selection.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '.global-search',
      popover: {
        title: 'Global Search',
        description:
          'Type here to search across all columns. The search updates as you type.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '.global-logic-toggle',
      popover: {
        title: 'Search Logic Toggle',
        description:
          'Toggle between AND/OR logic. OR finds rows matching any word, AND requires all words to match.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '.table-controls',
      popover: {
        title: 'Table Controls',
        description:
          'Access table actions like adding new items, refreshing data, or exporting.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.header-container',
      popover: {
        title: 'Column Headers',
        description:
          'Click on a column header to sort by that column. Click again to toggle ascending/descending order.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.filter-wrapper',
      popover: {
        title: 'Column Filters',
        description:
          'Each filterable column has its own filter input. Type to filter by specific column values.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '.resize-handle',
      popover: {
        title: 'Resize Columns',
        description:
          'Drag the edge of column headers to resize columns to your preferred width.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '.table-container',
      popover: {
        title: 'Table Rows',
        description:
          'Click a row to select it. Use Ctrl+Click to select multiple rows, or Shift+Click to select a range.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '.table-body tbody tr:first-child',
      popover: {
        title: 'Row Actions',
        description:
          'Right-click on a row to access context menu with additional actions like edit, delete, or copy.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '.selection-info',
      popover: {
        title: 'Selection Actions',
        description:
          'When rows are selected, bulk actions appear here. You can perform operations on all selected items at once.',
        side: 'top',
        align: 'center',
      },
    },
    {
      popover: {
        title: 'Table Tips',
        description:
          'Double-click a cell to edit it directly. The table supports drag-and-drop reordering when enabled. Tables remember your column widths and filter settings.',
        side: 'over',
        align: 'center',
      },
    },
  ],
};
