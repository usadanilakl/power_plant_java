import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  PageGuide,
  GuideSection,
  GuideSubsection,
  AppContext,
} from '../contextual-guide.model';
import { LotoBuilderStateService } from '../../../features/loto-standard/refactored/loto-builder/services/loto-builder-state.service';

/**
 * Context-aware guide for the LOTO Builder page
 * Uses new hierarchical section structure with collapsible sections
 */
export function createLotoBuilderPageGuide(): PageGuide {
  const router = inject(Router);
  const builderState = inject(LotoBuilderStateService);

  // ========== Section 1: File Management ==========
  const fileManagementSection: GuideSection = {
    id: 'file-management',
    title: 'File Management',
    icon: 'folder',
    defaultExpanded: false,
    isRelevant: () => true, // Always show
    subsections: [
      {
        id: 'file-browse',
        title: 'Browse & Select',
        icon: 'search',
        isRelevant: () => true,
        actions: [
          {
            id: 'file-toggle-menu-view',
            label: 'Toggle Menu View',
            description: 'View files grouped by type in tabs',
            icon: 'view_list',
            priority: 100,
            isAvailable: () => builderState.displayMode() === 'table',
            highlightTargets: ['contextual:toggle-view-button'],
            hint: 'Click to switch to toggle-menu view with type tabs',
          },
          {
            id: 'file-table-view',
            label: 'Table View',
            description: 'View all files in a searchable table',
            icon: 'table_view',
            priority: 90,
            isAvailable: () => builderState.displayMode() === 'toggle-menu',
            highlightTargets: ['contextual:toggle-view-button'],
            hint: 'Click to switch to table view for searching',
          },
          {
            id: 'file-select',
            label: 'Select a File',
            description: 'Click on a file to view it in the image area',
            icon: 'touch_app',
            priority: 80,
            isAvailable: () => builderState.currentFile() === null,
            highlightTargets: ['contextual:file-tree'],
            hint: 'Click on any file in the left panel to select it',
          },
          {
            id: 'file-type-tabs',
            label: 'Filter by Type',
            description: 'Use tabs to show only specific file types',
            icon: 'filter_list',
            priority: 70,
            isAvailable: () => builderState.displayMode() === 'toggle-menu',
            highlightTargets: ['contextual:file-type-tabs'],
            hint: 'Click on type tabs (P&ID, One-Line, etc.) to filter',
          },
        ],
      },
      {
        id: 'file-upload',
        title: 'Upload New',
        icon: 'upload_file',
        isRelevant: () => true,
        actions: [
          {
            id: 'upload-file',
            label: 'Upload P&ID File',
            description: 'Add a new P&ID image to the system',
            icon: 'add_photo_alternate',
            priority: 100,
            isAvailable: () => true,
            highlightTargets: ['contextual:upload-button'],
            hint: 'Click the + button to upload a new file',
          },
        ],
      },
      {
        id: 'file-edit',
        title: 'Edit File Info',
        icon: 'edit',
        isRelevant: () => builderState.currentFile() !== null,
        actions: [
          {
            id: 'edit-file-context-menu',
            label: 'Right-Click to Edit',
            description: 'Use context menu to edit file name, description, type',
            icon: 'menu',
            priority: 100,
            isAvailable: () => true,
            highlightTargets: ['contextual:file-item'],
            hint: 'Right-click on a file to access edit options',
          },
          {
            id: 'edit-file-name',
            label: 'Edit Name & Description',
            description: 'Change the file name or description',
            icon: 'drive_file_rename_outline',
            priority: 90,
            isAvailable: () => true,
            highlightTargets: ['contextual:edit-file-dialog'],
            hint: 'Select "Edit" from the context menu',
          },
          {
            id: 'change-file-type',
            label: 'Change File Type',
            description: 'Recategorize the file (P&ID, One-Line, etc.)',
            icon: 'category',
            priority: 80,
            isAvailable: () => true,
            highlightTargets: ['contextual:file-type-select'],
            hint: 'Change the file type dropdown in the edit dialog',
          },
        ],
      },
    ],
  };

  // ========== Section 2: LOTO Standard Management ==========
  const lotoStandardSection: GuideSection = {
    id: 'loto-standard-management',
    title: 'LOTO Standard Management',
    icon: 'checklist',
    defaultExpanded: false,
    isRelevant: () => true,
    subsections: [
      {
        id: 'standard-create',
        title: 'Create New',
        icon: 'add_box',
        isRelevant: () => true,
        actions: [
          {
            id: 'open-standards-popup',
            label: 'Open Standards Selector',
            description: 'Open the popup to create or select standards',
            icon: 'open_in_new',
            priority: 100,
            isAvailable: () => !builderState.isLotoStandardsPopupOpen(),
            highlightTargets: ['contextual:select-standards-button'],
            hint: 'Click "Select Standards" button in the toolbar',
          },
          {
            id: 'create-new-standard',
            label: 'Create New Standard',
            description: 'Fill in name and description to create',
            icon: 'note_add',
            priority: 90,
            isAvailable: () => builderState.isLotoStandardsPopupOpen(),
            highlightTargets: ['contextual:create-standard-form'],
            hint: 'Enter name and description, then click "Create & Add"',
          },
        ],
      },
      {
        id: 'standard-select',
        title: 'Select Existing',
        icon: 'playlist_add_check',
        isRelevant: () => true,
        actions: [
          {
            id: 'select-existing-standard',
            label: 'Select from List',
            description: 'Choose existing standards to work with',
            icon: 'check_circle',
            priority: 100,
            isAvailable: () => builderState.isLotoStandardsPopupOpen(),
            highlightTargets: ['contextual:standards-list'],
            hint: 'Click on standards in the list to select them',
          },
          {
            id: 'search-standards',
            label: 'Search Standards',
            description: 'Use search to find specific standards',
            icon: 'search',
            priority: 90,
            isAvailable: () => builderState.isLotoStandardsPopupOpen(),
            highlightTargets: ['contextual:standards-search'],
            hint: 'Type in the search box to filter standards',
          },
        ],
      },
      {
        id: 'standard-carousel',
        title: 'Manage Carousel',
        icon: 'view_carousel',
        isRelevant: () => builderState.isCarouselVisible(),
        actions: [
          {
            id: 'switch-active-standard',
            label: 'Switch Active Standard',
            description: 'Change which standard receives new points',
            icon: 'swap_horiz',
            priority: 100,
            isAvailable: () => builderState.selectedLotoStandards().length > 1,
            highlightTargets: ['contextual:carousel-arrows'],
            hint: 'Use arrows to switch between selected standards',
          },
          {
            id: 'view-standard-points',
            label: 'View Points in Standard',
            description: 'Expand to see all LOTO points in this standard',
            icon: 'expand_more',
            priority: 90,
            isAvailable: () => {
              const standard = builderState.activeLotoStandard();
              return standard !== null && !!standard.lotoPoints && standard.lotoPoints.length > 0;
            },
            highlightTargets: ['contextual:standard-points-expand'],
            hint: 'Click to expand and view all points',
          },
          {
            id: 'remove-standard',
            label: 'Remove from Selection',
            description: 'Remove a standard from the carousel',
            icon: 'remove_circle',
            priority: 70,
            isAvailable: () => builderState.selectedLotoStandards().length > 0,
            highlightTargets: ['contextual:remove-standard-button'],
            hint: 'Click X on a standard to remove it',
          },
        ],
      },
    ],
  };

  // ========== Section 3: LOTO Point Management ==========
  const lotoPointSection: GuideSection = {
    id: 'loto-point-management',
    title: 'LOTO Point Management',
    icon: 'location_on',
    defaultExpanded: true, // Main workflow, expand by default
    isRelevant: () => true,
    subsections: [
      {
        id: 'point-create',
        title: 'Create New Point',
        icon: 'add_circle',
        isRelevant: () => true,
        actions: [
          {
            id: 'draw-on-image',
            label: 'Draw on Image',
            description: 'Right-click + drag to draw a rectangle around equipment',
            icon: 'crop',
            priority: 100,
            isAvailable: () => builderState.currentFile() !== null && !builderState.isLotoPointFormOpen(),
            highlightTargets: ['contextual:image-viewer'],
            hint: 'Hold right-click, drag to create a rectangle, release to create',
          },
          {
            id: 'use-form-new-tab',
            label: 'Use Form (New Tab)',
            description: 'Switch to form view to manually enter LOTO point details',
            icon: 'edit_note',
            priority: 90,
            isAvailable: () => builderState.isLotoPointFormOpen() && builderState.lotoPointPopupView() === 'table',
            highlightTargets: ['contextual:form-view-tab'],
            hint: 'Click the "New" tab to switch to the creation form',
          },
          {
            id: 'fill-form-fields',
            label: 'Fill Form Fields',
            description: 'Enter tag number, description, type, positions',
            icon: 'text_fields',
            priority: 80,
            isAvailable: () => builderState.isLotoPointFormOpen() && builderState.lotoPointPopupView() === 'form',
            highlightTargets: ['contextual:loto-point-form'],
            hint: 'Fill in all required fields and click Save',
          },
        ],
      },
      {
        id: 'point-select-existing',
        title: 'Select Existing Point',
        icon: 'search',
        isRelevant: () => builderState.isLotoPointFormOpen(),
        actions: [
          {
            id: 'switch-to-table-view',
            label: 'Switch to Table View',
            description: 'Use "Select Existing" tab to search',
            icon: 'table_view',
            priority: 100,
            isAvailable: () => builderState.lotoPointPopupView() === 'form',
            highlightTargets: ['contextual:table-view-tab'],
            hint: 'Click "Select Existing" tab to search the database',
          },
          {
            id: 'search-by-column',
            label: 'Search by Column',
            description: 'Type in column headers to filter',
            icon: 'filter_list',
            priority: 90,
            isAvailable: () => builderState.lotoPointPopupView() === 'table',
            highlightTargets: ['contextual:table-column-headers'],
            hint: 'Click on column header inputs to filter by that field',
          },
          {
            id: 'double-click-select',
            label: 'Double-Click to Select',
            description: 'Double-click a row to immediately associate',
            icon: 'mouse',
            priority: 85,
            isAvailable: () => builderState.lotoPointPopupView() === 'table',
            highlightTargets: ['contextual:table-rows'],
            hint: 'Double-click any row to quickly select that LOTO point',
          },
          {
            id: 'click-then-associate',
            label: 'Click Row Then Associate',
            description: 'Single-click to select, then click "Associate Selected"',
            icon: 'touch_app',
            priority: 80,
            isAvailable: () => builderState.lotoPointPopupView() === 'table',
            highlightTargets: ['contextual:associate-selected-button'],
            hint: 'Click a row, then click "Associate Selected" button',
          },
          {
            id: 'not-found-create-new',
            label: 'Not Found? Create New',
            description: 'If LOTO point does not exist, create a new one',
            icon: 'add_box',
            priority: 70,
            isAvailable: () => builderState.lotoPointPopupView() === 'table',
            highlightTargets: ['contextual:create-new-instead-button'],
            hint: 'Click "Create New Instead" to switch to form view',
          },
        ],
      },
      {
        id: 'point-edit',
        title: 'Edit Existing Point',
        icon: 'edit',
        isRelevant: () => builderState.currentFile() !== null,
        actions: [
          {
            id: 'click-shape-to-edit',
            label: 'Click Shape on Image',
            description: 'Click an equipment shape to see info window',
            icon: 'touch_app',
            priority: 100,
            isAvailable: () => builderState.currentEquipment().length > 0,
            highlightTargets: ['contextual:equipment-shapes'],
            hint: 'Click on any shape on the image to see LOTO point info',
          },
          {
            id: 'edit-from-info-window',
            label: 'Edit from Info Window',
            description: 'Click edit in the info window to modify',
            icon: 'edit_note',
            priority: 90,
            isAvailable: () => builderState.showLotoPointInfo(),
            highlightTargets: ['contextual:info-window-edit'],
            hint: 'Click the edit button in the info popup',
          },
          {
            id: 'open-loto-points-table',
            label: 'Open LOTO Points Table',
            description: 'View all LOTO points in a table',
            icon: 'table_chart',
            priority: 80,
            isAvailable: () => true,
            highlightTargets: ['contextual:loto-points-button'],
            hint: 'Click "LOTO Points" button to see all points',
          },
        ],
      },
      {
        id: 'point-counterpart',
        title: 'Counterpart (01/02)',
        icon: 'compare_arrows',
        isRelevant: () => {
          return builderState.isLotoPointFormOpen() &&
                 builderState.lotoPointPopupView() === 'form' &&
                 builderState.isUnitSpecificLotoPoint();
        },
        actions: [
          {
            id: 'understand-dual-form',
            label: 'Dual Form Mode',
            description: 'Tag starts with 01/02, both units shown side-by-side',
            icon: 'view_column',
            priority: 100,
            isAvailable: () => true,
            highlightTargets: ['contextual:dual-form-layout'],
            hint: 'Left = primary unit, Right = counterpart unit',
          },
          {
            id: 'set-counterpart',
            label: 'Set Counterpart',
            description: 'Link or create the matching LOTO point for other unit',
            icon: 'link',
            priority: 95,
            isAvailable: () => !builderState.hasCounterpartLotoPoint(),
            highlightTargets: ['contextual:set-counterpart-button'],
            hint: 'Click "Set Counterpart" to search or create',
          },
          {
            id: 'sync-fields',
            label: 'Sync Field Values',
            description: 'Copy values between primary and counterpart forms',
            icon: 'sync',
            priority: 90,
            isAvailable: () => builderState.hasCounterpartLotoPoint(),
            highlightTargets: ['contextual:sync-controls'],
            hint: 'Use "Sync All" or individual field arrows to copy values',
          },
          {
            id: 'save-both-units',
            label: 'Save Both Units',
            description: 'Save both primary and counterpart together',
            icon: 'save',
            priority: 85,
            isAvailable: () => builderState.hasCounterpartLotoPoint(),
            highlightTargets: ['contextual:save-both-button'],
            hint: 'Best option - saves both and links them as counterparts',
          },
          {
            id: 'change-counterpart',
            label: 'Change Counterpart',
            description: 'Select a different counterpart LOTO point',
            icon: 'swap_horiz',
            priority: 80,
            isAvailable: () => builderState.hasCounterpartLotoPoint(),
            highlightTargets: ['contextual:change-counterpart-button'],
            hint: 'Click "Change" to select a different counterpart',
          },
        ],
      },
    ],
  };

  // ========== Section 4: Page Controls ==========
  const pageControlsSection: GuideSection = {
    id: 'page-controls',
    title: 'Page Controls',
    icon: 'settings',
    defaultExpanded: false,
    isRelevant: () => true,
    actions: [
      {
        id: 'toggle-ocr',
        label: 'Toggle OCR (Text Recognition)',
        description: 'Enable/disable automatic text recognition when drawing',
        icon: 'document_scanner',
        priority: 100,
        isAvailable: () => true,
        highlightTargets: ['contextual:ocr-toggle-button'],
        hint: 'When ON, drawn shapes will attempt to read text from the image',
      },
      {
        id: 'zoom-pan-controls',
        label: 'Zoom & Pan',
        description: 'Use mouse wheel to zoom, drag to pan the image',
        icon: 'zoom_in',
        priority: 90,
        isAvailable: () => builderState.currentFile() !== null,
        highlightTargets: ['contextual:image-viewer'],
        hint: 'Mouse wheel = zoom, Click + drag = pan, Double-click = reset',
      },
      {
        id: 'save-changes',
        label: 'Save All Changes',
        description: 'Save any unsaved modifications',
        icon: 'save',
        priority: 80,
        isAvailable: () => builderState.hasUnsavedChanges(),
        highlightTargets: ['contextual:save-button'],
        hint: 'Click Save to persist all changes',
      },
      {
        id: 'close-builder',
        label: 'Close Builder',
        description: 'Exit the LOTO Builder',
        icon: 'close',
        priority: 50,
        isAvailable: () => true,
        highlightTargets: ['contextual:close-button'],
        hint: 'You will be prompted to save if there are unsaved changes',
      },
    ],
  };

  return {
    routePattern: '/loto-builder',
    pageName: 'LOTO Builder',
    icon: 'build',
    sections: [
      fileManagementSection,
      lotoStandardSection,
      lotoPointSection,
      pageControlsSection,
    ],
  };
}
