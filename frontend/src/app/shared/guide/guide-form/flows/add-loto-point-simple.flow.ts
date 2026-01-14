import { WizardFlow } from '../wizard-stack.types';

/**
 * Simplified LOTO Point creation flow.
 *
 * Used when:
 * - Drawing new equipment on P&ID for zero energy
 * - Quick LOTO point creation without all optional fields
 *
 * Contains only essential fields:
 * - Tag Number
 * - Description
 * - Equipment Type
 * - Location (optional)
 * - Normal Position
 * - Isolated Position
 *
 * Does NOT include:
 * - Zero Energy (to avoid recursion)
 * - P&ID Connection (already handled by drawn shape)
 */
export const ADD_LOTO_POINT_SIMPLE_FLOW: WizardFlow = {
  type: 'add-loto-point-simple',
  name: 'Quick LOTO Point',
  description: 'Create a LOTO point with essential details only',
  icon: 'flash_on',
  canBranch: true,

  steps: [
    // Step 1: Tag Number
    {
      id: 'tag-number',
      type: 'tag-number',
      title: 'Tag Number',
      description: 'Enter or generate a unique tag number.',
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
      ],
    },

    // Step 2: Description
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
          message: 'Include the equipment name and function.',
          icon: 'lightbulb',
          type: 'tip',
        },
      ],
    },

    // Step 3: Equipment Type
    {
      id: 'equipment-type',
      type: 'value-select',
      title: 'Equipment Type',
      description: 'Select the type of equipment.',
      valueSelectConfig: {
        fieldName: 'eqType',
        categoryAlias: 'eqType',
        label: 'Equipment Type',
        required: true,
        canManageValues: true,
      },
      hints: [
        {
          message: 'Examples: MV (Motor Valve), CB (Circuit Breaker), HV (Hand Valve)',
          icon: 'text_snippet',
          type: 'example',
        },
      ],
    },

    // Step 4: Location (Optional)
    {
      id: 'location',
      type: 'value-select',
      title: 'Location',
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
          message: 'Examples: Turbine Hall, Boiler Area, Switchyard',
          icon: 'text_snippet',
          type: 'example',
        },
      ],
    },

    // Step 5: Normal Position
    {
      id: 'normal-position',
      type: 'value-select',
      title: 'Normal Position',
      description: 'What is the normal operating position?',
      valueSelectConfig: {
        fieldName: 'normPos',
        categoryAlias: 'normPos',
        label: 'Normal Position',
        required: true,
        canManageValues: true,
      },
      hints: [
        {
          message: 'Examples: OPEN, CLOSED, ON, OFF, AUTO',
          icon: 'text_snippet',
          type: 'example',
        },
      ],
    },

    // Step 6: Isolated Position
    {
      id: 'isolated-position',
      type: 'value-select',
      title: 'Isolated Position',
      description: 'What position should this be in when isolated?',
      valueSelectConfig: {
        fieldName: 'isoPos',
        categoryAlias: 'isoPos',
        label: 'Isolated Position',
        required: true,
        canManageValues: true,
      },
      hints: [
        {
          message: 'This is typically the safe state for maintenance.',
          icon: 'lock',
          type: 'info',
        },
      ],
    },

    // Step 7: Review
    {
      id: 'review',
      type: 'review',
      title: 'Review LOTO Point',
      description: 'Review the details before saving.',
      hints: [
        {
          message: 'You can add more details later by editing.',
          icon: 'lightbulb',
          type: 'tip',
        },
      ],
    },

    // Step 8: Complete
    {
      id: 'complete',
      type: 'complete',
      title: 'LOTO Point Created',
      description: 'The LOTO point has been saved.',
      hints: [
        {
          message: 'Click Finish to continue.',
          icon: 'check_circle',
          type: 'info',
        },
      ],
    },
  ],
};
