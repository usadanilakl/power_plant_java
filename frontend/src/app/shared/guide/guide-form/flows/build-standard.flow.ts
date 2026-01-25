import { WizardFlow, WizardContextFrame } from '../wizard-stack.types';

export const BUILD_STANDARD_FLOW: WizardFlow = {
  type: 'build-standard',
  name: 'Build LOTO Standard',
  description: 'Create a new LOTO Standard with guided step-by-step assistance',
  icon: 'playlist_add',
  canBranch: false,

  steps: [
    // Step 1: Welcome
    {
      id: 'welcome',
      type: 'welcome',
      title: 'Build a LOTO Standard',
      description: 'This guide will walk you through creating a LOTO Standard step by step. Each step focuses on one thing at a time, with helpful tips along the way.',
      hints: [
        {
          message: 'A LOTO Standard is a collection of LOTO points that together define the isolation requirements for a specific work scope.',
          icon: 'info',
          type: 'info',
        },
        {
          message: 'You can create new LOTO points or select existing ones as you build your standard.',
          icon: 'lightbulb',
          type: 'tip',
        },
      ],
    },

    // Step 2: Standard Name
    {
      id: 'standard-name',
      type: 'text-input',
      title: 'Name Your LOTO Standard',
      description: 'Choose a clear, descriptive name that identifies the work scope or equipment being isolated.',
      inputConfig: {
        fieldName: 'name',
        placeholder: 'e.g., Condenser A Tube Cleaning',
        required: true,
        maxLength: 200,
      },
      hints: [
        {
          message: 'Example: "Condenser A Tube Cleaning", "FW Pump 1A Maintenance"',
          icon: 'text_snippet',
          type: 'example',
        },
        {
          message: 'Include the major equipment or system being isolated in the name.',
          icon: 'lightbulb',
          type: 'tip',
        },
        {
          message: 'Keep names consistent with your plant\'s naming conventions.',
          icon: 'rule',
          type: 'info',
        },
      ],
    },

    // Step 3: Standard Description
    {
      id: 'standard-description',
      type: 'textarea-input',
      title: 'Add a Description',
      description: 'Provide additional details about the purpose and scope of this LOTO Standard.',
      inputConfig: {
        fieldName: 'description',
        placeholder: 'Describe the work this LOTO standard enables...',
        required: false,
        maxLength: 1000,
      },
      isOptional: true,
      hints: [
        {
          message: 'Include what work this LOTO enables and any special considerations.',
          icon: 'lightbulb',
          type: 'tip',
        },
        {
          message: 'This field is optional but helps others understand the standard\'s purpose.',
          icon: 'info',
          type: 'info',
        },
      ],
    },

    // Step 4: Counterpart Question
    {
      id: 'counterpart-question',
      type: 'confirm',
      title: 'Build for Both Units?',
      description: 'Would you like to create a matching LOTO Standard for the other unit at the same time?',
      confirmConfig: {
        yesLabel: 'Yes, build for both units',
        noLabel: 'No, just this unit',
        yesDescription: 'Creates Unit 1 and Unit 2 standards simultaneously with matching LOTO points.',
        noDescription: 'Creates a single standard. You can always create the counterpart later.',
        resultField: 'buildCounterpart',
        yesNextStep: 'counterpart-name',
        noNextStep: 'add-loto-points',
      },
      hints: [
        {
          message: 'Building both unit standards together ensures consistency and saves time.',
          icon: 'sync',
          type: 'tip',
        },
        {
          message: 'Counterpart standards mirror each other with unit-specific LOTO points (01 ↔ 02).',
          icon: 'info',
          type: 'info',
        },
      ],
    },

    // Step 4a: Counterpart Name (conditional)
    {
      id: 'counterpart-name',
      type: 'text-input',
      title: 'Counterpart Standard Name',
      description: 'Confirm or modify the name for the counterpart standard.',
      inputConfig: {
        fieldName: 'counterpartName',
        placeholder: 'Auto-generated from primary name',
        required: true,
      },
      skipCondition: (frame: WizardContextFrame) => {
        return frame.entityData.lotoStandard?.buildCounterpart !== true;
      },
      hints: [
        {
          message: 'The system auto-generates a suggested name by swapping unit references (01 ↔ 02).',
          icon: 'auto_fix_high',
          type: 'info',
        },
      ],
    },

    // Step 5: Add LOTO Points
    {
      id: 'add-loto-points',
      type: 'loto-point-selector',
      title: 'Add LOTO Points',
      description: 'Select existing LOTO points or create new ones to add to this standard.',
      tableConfig: {
        fieldName: 'lotoPoints',
        entityType: 'loto-point',
        columns: ['tagNumber', 'description', 'unit', 'eqType', 'location'],
        allowCreate: true,
        createFlowType: 'add-loto-point',
        minSelection: 1,
      },
      hints: [
        {
          message: 'Choose how you want to search: by file, table, menu, or use guided filters.',
          icon: 'search',
          type: 'tip',
        },
        {
          message: 'If you can\'t find the LOTO point, use "Create New" to add it.',
          icon: 'add',
          type: 'tip',
        },
        {
          message: 'You can select multiple LOTO points. Selected items appear at the top.',
          icon: 'checklist',
          type: 'info',
        },
      ],
    },

    // Step 6: Review
    {
      id: 'review',
      type: 'review',
      title: 'Review Your LOTO Standard',
      description: 'Review all details before saving. Click Back to make any changes.',
      hints: [
        {
          message: 'Verify the name, description, and all LOTO points before saving.',
          icon: 'checklist',
          type: 'info',
        },
        {
          message: 'You can edit this standard later if needed.',
          icon: 'edit',
          type: 'tip',
        },
      ],
    },

    // Step 7: Create Counterpart Standard (conditional)
    {
      id: 'counterpart-creation',
      type: 'counterpart-creation',
      title: 'Create Counterpart Standard',
      description: 'Creating the matching LOTO standard for the other unit.',
      skipCondition: (frame: WizardContextFrame) => {
        return frame.entityData.lotoStandard?.buildCounterpart !== true;
      },
      hints: [
        {
          message: 'LOTO points without counterparts will need to be created.',
          icon: 'sync',
          type: 'info',
        },
        {
          message: 'Counterpart names and descriptions are auto-transformed (01 ↔ 02).',
          icon: 'auto_fix_high',
          type: 'tip',
        },
      ],
    },

    // Step 8: Complete
    {
      id: 'complete',
      type: 'complete',
      title: 'LOTO Standard Created!',
      description: 'Your LOTO Standard has been saved successfully.',
      hints: [
        {
          message: 'You can now use this standard when creating LOTO procedures.',
          icon: 'check_circle',
          type: 'info',
        },
      ],
    },
  ],
};
