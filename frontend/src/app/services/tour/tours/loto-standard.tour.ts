import { Tour } from '../tour.model';

export const LOTO_STANDARD_TOUR: Tour = {
  id: 'loto-standard',
  name: 'LOTO Standards Module',
  description: 'Learn how to create and manage LOTO standard procedures',
  route: '/loto-standard',
  steps: [
    {
      popover: {
        title: 'LOTO Standards Module',
        description:
          'This module allows you to create, view, and manage standard LOTO procedures that can be reused across the plant.',
        side: 'over',
        align: 'center',
      },
    },
    {
      element: 'app-router-menu',
      popover: {
        title: 'Navigation',
        description:
          'Use the navigation menu to switch between Table view, Builder view, and other LOTO standard options.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#leftMenu, app-rf-loto-standard-left-menu',
      popover: {
        title: 'Standards Browser',
        description:
          'Browse existing LOTO standards. You can organize them by groups, alphabetically by name, or view as a flat list.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '.grouping-selector, select',
      popover: {
        title: 'Grouping Options',
        description:
          'Change how standards are organized: by groups, alphabetically by name, or as a flat list.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '.main-content',
      popover: {
        title: 'Standards Table',
        description:
          'View all LOTO standards in a table format. Search, filter, and sort to find specific procedures.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: 'app-table .global-search, .search-bar input',
      popover: {
        title: 'Search Standards',
        description:
          'Use global search to find LOTO standards by name, equipment, or any other field.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: 'app-table tbody tr:first-child, .table-body tr:first-child',
      popover: {
        title: 'Standard Details',
        description:
          'Double-click a row to view or edit the LOTO standard details. Right-click for context menu with additional options.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '.table-controls, app-buttons',
      popover: {
        title: 'Actions',
        description:
          'Access common actions: create new standards, open the LOTO Builder, export data, or perform bulk operations.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      popover: {
        title: 'LOTO Standard Form',
        description:
          'When editing a standard, a form popup appears with fields for: Name, Description, Equipment, LOTO Points, Files, and Groups.',
        side: 'over',
        align: 'center',
      },
    },
    {
      popover: {
        title: 'LOTO Builder',
        description:
          'The LOTO Builder is a powerful tool for creating and editing LOTO procedures. Click the "Open Builder" button to access it.',
        side: 'over',
        align: 'center',
      },
    },
  ],
};

export const LOTO_BUILDER_TOUR: Tour = {
  id: 'loto-builder',
  name: 'LOTO Builder',
  description: 'Learn how to use the LOTO Builder to create procedures',
  route: '/loto-standard',
  steps: [
    {
      element: '.loto-builder-container',
      popover: {
        title: 'LOTO Builder',
        description:
          'The LOTO Builder is a split-panel interface for creating and editing LOTO procedures efficiently.',
        side: 'over',
        align: 'center',
      },
    },
    {
      element: '.left-panel, app-loto-builder-left-panel',
      popover: {
        title: 'Left Panel - Resources',
        description:
          'Browse available LOTO points and files. You can drag items from here to add them to your procedure.',
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '.divider',
      popover: {
        title: 'Resizable Divider',
        description:
          'Drag the divider to resize the panels according to your preference.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '.right-panel, app-loto-builder-right-panel',
      popover: {
        title: 'Right Panel - Procedure',
        description:
          'This panel shows the current LOTO procedure being edited. Add points, files, and configure the procedure here.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: 'app-loto-builder-left-panel .loto-points-section',
      popover: {
        title: 'LOTO Points Table',
        description:
          'Search and filter LOTO points. Select points to add them to your procedure.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: 'app-loto-builder-left-panel .files-section',
      popover: {
        title: 'Files Section',
        description:
          'Browse and select files (P&IDs, drawings) to associate with your LOTO procedure.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: 'app-loto-builder-right-panel .procedure-header',
      popover: {
        title: 'Procedure Details',
        description:
          'View and edit the procedure name, description, and other metadata.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: 'app-loto-builder-right-panel .points-list',
      popover: {
        title: 'Selected Points',
        description:
          'View all LOTO points included in this procedure. Drag to reorder, or click to remove.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: 'app-loto-form-carousel',
      popover: {
        title: 'LOTO Carousel',
        description:
          'When building multiple procedures, the carousel lets you switch between them easily.',
        side: 'left',
        align: 'center',
      },
    },
    {
      popover: {
        title: 'Builder Tips',
        description:
          'Use keyboard shortcuts: Ctrl+S to save, Escape to close popups. The builder warns you before closing if you have unsaved changes.',
        side: 'over',
        align: 'center',
      },
    },
  ],
};
