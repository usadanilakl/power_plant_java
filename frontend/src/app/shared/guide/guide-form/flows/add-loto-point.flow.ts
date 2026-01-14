import { WizardFlow } from '../wizard-stack.types';

export const ADD_LOTO_POINT_FLOW: WizardFlow = {
  type: 'add-loto-point',
  name: 'Create LOTO Point',
  description: 'Create a new LOTO point with all required details',
  icon: 'add_location',
  canBranch: true, // Can be used as a branch from build-standard

  steps: [
    // Step 1: Welcome (only shown when not a branch)
    {
      id: 'welcome',
      type: 'welcome',
      title: 'Create a LOTO Point',
      description: 'This guide will help you create a new LOTO point with all the necessary details.',
      hints: [
        {
          message: 'A LOTO point represents a single isolation point on equipment.',
          icon: 'info',
          type: 'info',
        },
        {
          message: 'Each step focuses on one piece of information at a time.',
          icon: 'lightbulb',
          type: 'tip',
        },
      ],
    },

    // Step 2: Tag Number - using specialized tag number step with generator
    {
      id: 'tag-number',
      type: 'tag-number',
      title: 'Tag Number',
      description: 'Enter or generate a unique tag number for this LOTO point.',
      tagNumberConfig: {
        fieldName: 'tagNumber',
        showGenerator: true,
        showManualInput: true,
        required: true,
      },
      hints: [
        {
          message: 'Tag numbers typically follow format: XX-YYY-### (Unit-Type-Number)',
          icon: 'format_list_numbered',
          type: 'info',
        },
        {
          message: 'Use the "Generate" tab for automatic tag number generation.',
          icon: 'auto_awesome',
          type: 'tip',
        },
        {
          message: 'Example: 01-MV-001 (Unit 01, Motor Operated Valve, Number 001)',
          icon: 'text_snippet',
          type: 'example',
        },
      ],
    },

    // Step 3: Description - using specialized description step with naming convention
    {
      id: 'description',
      type: 'description-builder',
      title: 'Description',
      description: 'Enter a clear description for this LOTO point.',
      descriptionConfig: {
        fieldName: 'description',
        showNamingConvention: true,
        maxLength: 500,
        required: true,
      },
      hints: [
        {
          message: 'Include the equipment name and function in the description.',
          icon: 'lightbulb',
          type: 'tip',
        },
        {
          message: 'Use Quick Keywords to quickly add common terms.',
          icon: 'flash_on',
          type: 'tip',
        },
        {
          message: 'Example: "FW PUMP 1A SUCTION ISO"',
          icon: 'text_snippet',
          type: 'example',
        },
      ],
    },

    // Step 4: Specific Location
    {
      id: 'specific-location',
      type: 'text-input',
      title: 'Specific Location',
      description: 'Where exactly is this LOTO point located?',
      inputConfig: {
        fieldName: 'specificLocation',
        placeholder: 'e.g., Turbine Building, Floor 2, Column A-5',
        required: false,
      },
      isOptional: true,
      hints: [
        {
          message: 'Include building, floor, and any reference points.',
          icon: 'place',
          type: 'tip',
        },
        {
          message: 'This helps field workers locate the equipment quickly.',
          icon: 'info',
          type: 'info',
        },
      ],
    },

    // Step 5: Equipment Type - using RfValueSelectComponent
    {
      id: 'equipment-type',
      type: 'value-select',
      title: 'Equipment Type',
      description: 'Select the type of equipment for this LOTO point.',
      valueSelectConfig: {
        fieldName: 'eqType',
        categoryAlias: 'eqType',
        label: 'Equipment Type',
        required: true,
        canManageValues: true,
      },
      hints: [
        {
          message: 'Equipment type helps categorize and filter LOTO points.',
          icon: 'category',
          type: 'info',
        },
        {
          message: 'Use the + button to create a new type if needed.',
          icon: 'add',
          type: 'tip',
        },
        {
          message: 'Examples: MV (Motor Valve), CB (Circuit Breaker), HV (Hand Valve)',
          icon: 'text_snippet',
          type: 'example',
        },
      ],
    },

    // Step 6: Location (General) - using RfValueSelectComponent
    {
      id: 'location',
      type: 'value-select',
      title: 'General Location',
      description: 'Select the general area/system location.',
      valueSelectConfig: {
        fieldName: 'location',
        categoryAlias: 'location',
        label: 'Location',
        required: false,
        canManageValues: true,
      },
      isOptional: true,
      hints: [
        {
          message: 'General location helps group related LOTO points.',
          icon: 'location_on',
          type: 'info',
        },
        {
          message: 'Examples: Turbine Hall, Boiler Area, Switchyard',
          icon: 'text_snippet',
          type: 'example',
        },
      ],
    },

    // Step 7: Normal Position - using RfValueSelectComponent
    {
      id: 'normal-position',
      type: 'value-select',
      title: 'Normal Position',
      description: 'What is the normal operating position of this equipment?',
      valueSelectConfig: {
        fieldName: 'normPos',
        categoryAlias: 'normPos',
        label: 'Normal Position',
        required: true,
        canManageValues: true,
      },
      hints: [
        {
          message: 'Normal position is how the equipment operates during normal plant operation.',
          icon: 'play_arrow',
          type: 'info',
        },
        {
          message: 'Examples: OPEN, CLOSED, ON, OFF, AUTO',
          icon: 'text_snippet',
          type: 'example',
        },
      ],
    },

    // Step 8: Isolated Position - using RfValueSelectComponent
    {
      id: 'isolated-position',
      type: 'value-select',
      title: 'Isolated Position',
      description: 'What position should this equipment be in when isolated?',
      valueSelectConfig: {
        fieldName: 'isoPos',
        categoryAlias: 'isoPos',
        label: 'Isolated Position',
        required: true,
        canManageValues: true,
      },
      hints: [
        {
          message: 'Isolated position is the safe state for maintenance work.',
          icon: 'lock',
          type: 'info',
        },
        {
          message: 'This is typically the opposite of normal position for valves.',
          icon: 'lightbulb',
          type: 'tip',
        },
        {
          message: 'Examples: CLOSED, OPEN, OFF, RACKED OUT',
          icon: 'text_snippet',
          type: 'example',
        },
      ],
    },

    // Step 9: Zero Energy - using specialized zero energy step
    {
      id: 'zero-energy',
      type: 'zero-energy',
      title: 'Zero Energy Verification',
      description: 'Configure how zero energy state should be verified. (Optional)',
      zeroEnergyConfig: {
        showPhraseBuilder: true,
        showEquipmentMapping: true,
        allowCreateLotoPoint: true,
      },
      isOptional: true,
      hints: [
        {
          message: 'Zero energy verification ensures equipment is truly de-energized.',
          icon: 'verified_user',
          type: 'info',
        },
        {
          message: 'Select a phrase template, then assign equipment to placeholders.',
          icon: 'lightbulb',
          type: 'tip',
        },
        {
          message: 'Example: "Verify [tag1] is closed and no pressure on [tag2]"',
          icon: 'text_snippet',
          type: 'example',
        },
      ],
    },

    // Step 10: File/Equipment Connection - using specialized equipment picker
    {
      id: 'file-connection',
      type: 'equipment-picker',
      title: 'P&ID Connection',
      description: 'Link this LOTO point to a location on a P&ID drawing. (Optional)',
      equipmentPickerConfig: {
        fieldName: 'equipmentList',
        allowBrowse: true,
        allowDraw: true,
        fileFieldName: 'mainFileId',
        multiSelect: false,
      },
      isOptional: true,
      hints: [
        {
          message: 'Connecting to a P&ID helps visualize the LOTO point location.',
          icon: 'insert_drive_file',
          type: 'info',
        },
        {
          message: 'Left-click to select existing equipment, or right-click + drag to draw new.',
          icon: 'draw',
          type: 'tip',
        },
        {
          message: 'This step is optional but recommended for clarity.',
          icon: 'lightbulb',
          type: 'tip',
        },
      ],
    },

    // Step 11: Review
    {
      id: 'review',
      type: 'review',
      title: 'Review LOTO Point',
      description: 'Review all details before saving.',
      hints: [
        {
          message: 'Verify all information is correct before creating.',
          icon: 'checklist',
          type: 'info',
        },
        {
          message: 'Click Back to make any changes.',
          icon: 'arrow_back',
          type: 'tip',
        },
      ],
    },

    // Step 12: Complete
    {
      id: 'complete',
      type: 'complete',
      title: 'LOTO Point Created!',
      description: 'Your LOTO point has been saved successfully.',
      hints: [
        {
          message: 'The LOTO point is now available for use in standards.',
          icon: 'check_circle',
          type: 'info',
        },
      ],
    },
  ],
};
