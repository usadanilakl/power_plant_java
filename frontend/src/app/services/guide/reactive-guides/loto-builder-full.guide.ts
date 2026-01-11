import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  ReactiveGuide,
  ReactiveGuideStep,
  createStepsMap,
} from '../reactive-guide.model';
import { LotoBuilderStateService } from '../../../features/loto-standard/refactored/loto-builder/services/loto-builder-state.service';

/**
 * Factory function to create the LOTO Builder Full Guide
 * Must be called within an injection context
 */
export function createLotoBuilderFullGuide(): ReactiveGuide {
  const router = inject(Router);
  const builderState = inject(LotoBuilderStateService);

  const steps: ReactiveGuideStep[] = [
    // ========== STEP 1: Navigate to LOTO Builder ==========
    {
      id: 'navigate-to-builder',
      order: 1,
      type: 'action',
      title: 'Navigate to LOTO Builder',
      message: 'Click on the LOTO Builder card or menu item to open the builder.',
      icon: 'directions',
      routes: ['/home', '/'],
      highlightTargets: [
        'loto-builder-full:nav-card',
        'loto-builder-full:nav-menu',
      ],
      isComplete: () => router.url.startsWith('/loto-builder'),
      nextStepId: 'choose-action',
    },

    // ========== STEP 2: Choose Action (Branching) ==========
    {
      id: 'choose-action',
      order: 2,
      type: 'choice',
      title: 'What would you like to do?',
      message: 'Select an option to get started with the LOTO Builder.',
      icon: 'help_outline',
      routes: ['/loto-builder'],
      isVisible: () => router.url.startsWith('/loto-builder'),
      branches: [
        {
          id: 'add-to-new-loto',
          label: 'Create New LOTO Standard',
          description: 'Create a new LOTO standard and add points to it',
          icon: 'add_circle',
          nextStepId: 'click-build-loto',
        },
        {
          id: 'add-to-existing-loto',
          label: 'Add to Existing LOTO',
          description: 'Add LOTO points to an existing standard',
          icon: 'playlist_add',
          nextStepId: 'select-existing-loto',
        },
        {
          id: 'draw-loto-points',
          label: 'Draw LOTO Points on File',
          description: 'Select a file and draw equipment shapes',
          icon: 'draw',
          nextStepId: 'select-file',
        },
        {
          id: 'upload-file',
          label: 'Upload New File',
          description: 'Upload a new P&ID file to work with',
          icon: 'upload_file',
          nextStepId: 'click-upload',
        },
      ],
    },

    // ========== BRANCH: Create New LOTO Standard ==========
    {
      id: 'click-build-loto',
      order: 10,
      type: 'action',
      title: 'Click Build LOTO',
      message: 'Click the "Build LOTO" button in the toolbar to start building mode.',
      icon: 'construction',
      routes: ['/loto-builder'],
      highlightTargets: ['loto-builder-full:build-loto-button'],
      isComplete: () => builderState.isLotoBuildingMode() || builderState.isLotoStandardsPopupOpen(),
      nextStepId: 'create-new-standard',
      hints: [
        {
          message: 'Build LOTO mode allows you to add multiple LOTO points to standards',
          icon: 'info',
          showWhen: 'during',
        },
      ],
    },
    {
      id: 'create-new-standard',
      order: 11,
      type: 'action',
      title: 'Create New Standard',
      message: 'Click "Create New Standard" to create a new LOTO standard, or select existing ones.',
      icon: 'add_box',
      routes: ['/loto-builder'],
      highlightTargets: ['loto-builder-full:create-standard-button'],
      isVisible: () => builderState.isLotoStandardsPopupOpen(),
      isComplete: () => builderState.selectedLotoStandards().length > 0,
      nextStepId: 'fill-standard-form',
      hints: [
        {
          message: 'You can also select multiple existing standards to add points to',
          icon: 'lightbulb',
          showWhen: 'during',
        },
      ],
    },
    {
      id: 'fill-standard-form',
      order: 12,
      type: 'action',
      title: 'Fill Standard Details',
      message: 'Enter the name and description for your new LOTO standard, then click "Create & Add".',
      icon: 'edit',
      routes: ['/loto-builder'],
      highlightTargets: [
        'loto-builder-full:standard-name-input',
        'loto-builder-full:standard-description-input',
        'loto-builder-full:create-add-button',
      ],
      isVisible: () => builderState.isLotoStandardsPopupOpen(),
      isComplete: () => builderState.selectedLotoStandards().length > 0 && !builderState.isLotoStandardsPopupOpen(),
      nextStepId: 'carousel-ready',
      hints: [
        {
          message: 'You can drag and resize the LOTO Standards Editor dialog',
          icon: 'drag_indicator',
          showWhen: 'during',
        },
        {
          message: 'Use the "Add New" button to work with multiple standards at once',
          icon: 'add',
          showWhen: 'after',
        },
      ],
    },
    {
      id: 'carousel-ready',
      order: 13,
      type: 'info',
      title: 'LOTO Standard Ready!',
      message: 'Your LOTO standard is now in the carousel. You can now select a file and start adding LOTO points.',
      icon: 'check_circle',
      routes: ['/loto-builder'],
      isVisible: () => builderState.isCarouselVisible(),
      nextStepId: 'select-file',
      autoAdvanceDelay: 2000,
      hints: [
        {
          message: 'Use the arrows in the carousel to switch between multiple LOTO standards',
          icon: 'swap_horiz',
          showWhen: 'during',
        },
      ],
    },

    // ========== BRANCH: Add to Existing LOTO ==========
    {
      id: 'select-existing-loto',
      order: 20,
      type: 'action',
      title: 'Select Existing Standards',
      message: 'Click the "Select Standards" button to choose which LOTO standards to add points to.',
      icon: 'checklist',
      routes: ['/loto-builder'],
      highlightTargets: ['loto-builder-full:select-standards-button'],
      isComplete: () => builderState.isLotoStandardsPopupOpen(),
      nextStepId: 'pick-standards',
    },
    {
      id: 'pick-standards',
      order: 21,
      type: 'action',
      title: 'Pick LOTO Standards',
      message: 'Select one or more existing LOTO standards from the list, then close the popup.',
      icon: 'playlist_add_check',
      routes: ['/loto-builder'],
      isVisible: () => builderState.isLotoStandardsPopupOpen(),
      isComplete: () => builderState.selectedLotoStandards().length > 0 && !builderState.isLotoStandardsPopupOpen(),
      nextStepId: 'carousel-ready',
    },

    // ========== COMMON: Select File ==========
    {
      id: 'select-file',
      order: 30,
      type: 'action',
      title: 'Select a File',
      message: 'In the left panel, make sure the Files tab is selected. Expand folders and click on a P&ID file to load it.',
      icon: 'folder_open',
      routes: ['/loto-builder'],
      highlightTargets: [
        'loto-builder-full:files-tab',
        'loto-builder-full:file-tree',
      ],
      isComplete: () => builderState.currentFile() !== null,
      nextStepId: 'draw-shape',
      hints: [
        {
          message: 'You can switch between Files and LOTO Points tabs in the left panel',
          icon: 'tab',
          showWhen: 'during',
        },
        {
          message: 'Use the table/menu toggle to change the view mode',
          icon: 'view_module',
          showWhen: 'during',
        },
      ],
    },

    // ========== COMMON: Draw Shape ==========
    {
      id: 'draw-shape',
      order: 31,
      type: 'action',
      title: 'Draw Equipment Shape',
      message: 'Right-click and drag on the P&ID image to draw a rectangle around equipment. This will create a new LOTO point.',
      icon: 'crop',
      routes: ['/loto-builder'],
      highlightTargets: ['loto-builder-full:image-viewer'],
      isVisible: () => builderState.currentFile() !== null,
      isComplete: () => builderState.isLotoPointFormOpen() || builderState.pendingEquipment() !== null,
      nextStepId: 'fill-loto-point',
      hints: [
        {
          message: 'Hold right-click and drag to draw a selection box',
          icon: 'mouse',
          showWhen: 'during',
        },
        {
          message: 'If OCR is enabled, the system will try to recognize text automatically',
          icon: 'text_fields',
          showWhen: 'during',
        },
      ],
    },

    // ========== COMMON: Fill LOTO Point Form ==========
    {
      id: 'fill-loto-point',
      order: 32,
      type: 'action',
      title: 'Fill LOTO Point Details',
      message: 'Fill in the LOTO point form with tag number, description, and other details. Click Save when done.',
      icon: 'edit_note',
      routes: ['/loto-builder'],
      highlightTargets: ['loto-builder-full:loto-point-form'],
      isVisible: () => builderState.isLotoPointFormOpen(),
      isComplete: () => !builderState.isLotoPointFormOpen() && builderState.currentEquipment().some(eq => eq.lotoPoints && eq.lotoPoints.length > 0),
      nextStepId: 'add-to-loto-standard',
      hints: [
        {
          message: 'You can select an existing LOTO point from the table view',
          icon: 'table_chart',
          showWhen: 'during',
        },
      ],
    },

    // ========== COMMON: Add to LOTO Standard ==========
    {
      id: 'add-to-loto-standard',
      order: 33,
      type: 'action',
      title: 'Add Point to LOTO Standard',
      message: 'Right-click on the shape you just created and select "Add to LOTO" to add it to your active standard.',
      icon: 'playlist_add',
      routes: ['/loto-builder'],
      highlightTargets: ['loto-builder-full:shape-context-menu'],
      isVisible: () => {
        const hasEquipmentWithLotoPoint = builderState.currentEquipment().some(
          eq => eq.lotoPoints && eq.lotoPoints.length > 0
        );
        return hasEquipmentWithLotoPoint && builderState.isCarouselVisible();
      },
      isComplete: () => {
        const standard = builderState.activeLotoStandard();
        return standard !== null && !!standard.lotoPoints && standard.lotoPoints.length > 0;
      },
      nextStepId: 'continue-or-finish',
      hints: [
        {
          message: 'The "Add to LOTO" option adds the point to the currently active standard in the carousel',
          icon: 'info',
          showWhen: 'during',
        },
      ],
    },

    // ========== COMMON: Continue or Finish ==========
    {
      id: 'continue-or-finish',
      order: 40,
      type: 'choice',
      title: 'Continue or Finish?',
      message: 'You\'ve successfully added a LOTO point! What would you like to do next?',
      icon: 'help',
      routes: ['/loto-builder'],
      branches: [
        {
          id: 'add-more',
          label: 'Add More LOTO Points',
          description: 'Continue drawing and adding points',
          icon: 'add',
          nextStepId: 'draw-shape',
        },
        {
          id: 'select-different-file',
          label: 'Select Different File',
          description: 'Work with a different P&ID file',
          icon: 'folder_open',
          nextStepId: 'select-file',
        },
        {
          id: 'finish',
          label: 'Finish Guide',
          description: 'I\'m done with the guide',
          icon: 'done_all',
          nextStepId: 'guide-complete',
        },
      ],
    },

    // ========== BRANCH: Upload File ==========
    {
      id: 'click-upload',
      order: 50,
      type: 'action',
      title: 'Open Upload Dialog',
      message: 'Click the upload button in the Files panel to upload a new P&ID file.',
      icon: 'upload',
      routes: ['/loto-builder'],
      highlightTargets: ['loto-builder-full:upload-button'],
      // Note: This would need file state service integration for proper completion detection
      nextStepId: 'select-file',
    },

    // ========== FINAL: Guide Complete ==========
    {
      id: 'guide-complete',
      order: 100,
      type: 'info',
      title: 'Guide Complete!',
      message: 'Congratulations! You\'ve learned how to use the LOTO Builder to create and manage LOTO standards and points.',
      icon: 'celebration',
      routes: ['/loto-builder'],
      isFinal: true,
      hints: [
        {
          message: 'Remember: You can always restart this guide from the help menu',
          icon: 'replay',
          showWhen: 'during',
        },
      ],
    },
  ];

  return {
    id: 'loto-builder-full',
    name: 'Full LOTO Builder Guide',
    description: 'Complete walkthrough of the LOTO Builder including creating standards, drawing points, and building LOTO procedures',
    icon: 'school',
    category: 'loto',
    initialStepId: 'navigate-to-builder',
    steps: createStepsMap(steps),
  };
}
