import { Tour } from '../tour.model';

export const LOTO_POINTS_TOUR: Tour = {
  id: 'loto-points',
  name: 'LOTO Points Module',
  description: 'Learn how to manage LOTO isolation points',
  route: '/loto-points',
  steps: [
    {
      popover: {
        title: 'LOTO Points Module',
        description:
          'This module allows you to view, create, and manage all LOTO isolation points throughout the plant.',
        side: 'over',
        align: 'center',
      },
    },
    {
      element: 'app-router-menu',
      popover: {
        title: 'Navigation',
        description:
          'Use the navigation menu to switch between different views and access other modules.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#leftMenu, app-rf-loto-point-left-menu',
      popover: {
        title: 'Points Browser',
        description:
          'Browse LOTO points organized by equipment, system, or location. Use the filters to narrow down the list.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '.main-content',
      popover: {
        title: 'Points Table',
        description:
          'The main table shows all LOTO points with their details. You can search, filter, and sort the data.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: 'app-table .global-search, .search-bar input',
      popover: {
        title: 'Search Points',
        description:
          'Use the global search to quickly find LOTO points by tag number, description, or any other field.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: 'app-table .header-container, .table-header',
      popover: {
        title: 'Column Sorting & Filtering',
        description:
          'Click column headers to sort. Use column filters to narrow down results by specific field values.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: 'app-table tbody tr:first-child, .table-body tr:first-child',
      popover: {
        title: 'Point Details',
        description:
          'Double-click a row to edit the LOTO point details. Right-click for context menu with additional options.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '.table-controls, app-buttons',
      popover: {
        title: 'Table Actions',
        description:
          'Access common actions: add new points, refresh the list, export data, or perform bulk operations.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      popover: {
        title: 'LOTO Point Form',
        description:
          'When creating or editing a point, a form popup appears with fields for: Tag Number, Description, Isolation Position, Normal Position, Equipment, and more.',
        side: 'over',
        align: 'center',
      },
    },
    {
      element: '.selection-info',
      popover: {
        title: 'Bulk Operations',
        description:
          'Select multiple points using Ctrl+Click or Shift+Click. When selected, bulk action buttons appear to edit or delete multiple items at once.',
        side: 'top',
        align: 'center',
      },
    },
    {
      popover: {
        title: 'LOTO Points Tips',
        description:
          'LOTO points are linked to equipment and files. When creating LOTO standards, you can select points from this module to build isolation procedures.',
        side: 'over',
        align: 'center',
      },
    },
  ],
};
