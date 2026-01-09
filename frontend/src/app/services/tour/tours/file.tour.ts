import { Tour } from '../tour.model';

export const FILE_TOUR: Tour = {
  id: 'file',
  name: 'Files Module',
  description: 'Learn how to navigate and manage equipment files',
  route: '/file',
  steps: [
    {
      popover: {
        title: 'Files Module',
        description:
          'This module allows you to view and manage equipment files, P&IDs, and technical documentation.',
        side: 'over',
        align: 'center',
      },
    },
    {
      element: 'app-router-menu',
      popover: {
        title: 'Navigation Menu',
        description:
          'Use the top navigation to switch between different views: Table view, Editor view, and other file management options.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#leftMenu',
      popover: {
        title: 'File Browser',
        description:
          'Browse files organized by type (P&ID, drawings, etc.) and vendor. Click on a category to expand it and see available files.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: 'app-toggle-menu, app-rf-file-left-menu',
      popover: {
        title: 'File Categories',
        description:
          'Files are grouped by vendor or type. Click on a group to expand and see individual files. Color indicators show file status: green (verified), yellow (unverified), red (missing name).',
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '.main-content',
      popover: {
        title: 'Content Area',
        description:
          'The main content area displays the selected file or table view. Switch between views using the navigation menu.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: 'app-table, app-rf-file-table',
      popover: {
        title: 'Files Table',
        description:
          'View all files in a table format. Search, filter, sort, and select multiple files for bulk operations.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '.table-controls, app-buttons',
      popover: {
        title: 'Table Actions',
        description:
          'Use these controls to add new files, refresh the list, export data, or perform bulk operations on selected files.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      popover: {
        title: 'File Operations',
        description:
          'Double-click a file to edit its details. Right-click for context menu options. Select multiple files with Ctrl+Click for bulk editing.',
        side: 'over',
        align: 'center',
      },
    },
    {
      element: 'app-rf-popup-projection, .popup-projection',
      popover: {
        title: 'File Editor',
        description:
          'When editing a file, a popup form appears with all file properties. Make changes and save, or close to cancel.',
        side: 'left',
        align: 'center',
      },
    },
    {
      popover: {
        title: 'Files Tips',
        description:
          'Use the search bar to quickly find files. The left menu can be resized by dragging its edge. Your filter settings are remembered between sessions.',
        side: 'over',
        align: 'center',
      },
    },
  ],
};
