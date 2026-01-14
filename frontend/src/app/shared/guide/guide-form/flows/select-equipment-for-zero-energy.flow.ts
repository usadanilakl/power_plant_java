import { WizardFlow } from '../wizard-stack.types';

/**
 * Flow for selecting or drawing equipment for zero energy placeholders.
 *
 * This flow allows users to:
 * 1. Browse P&ID files and select existing equipment
 * 2. Draw new equipment shapes on P&ID
 * 3. When drawing, fill out a simplified LOTO point form
 *
 * Returns the selected/created equipment back to the zero energy step.
 */
export const SELECT_EQUIPMENT_FOR_ZERO_ENERGY_FLOW: WizardFlow = {
  type: 'select-equipment-for-zero-energy',
  name: 'Select Equipment',
  description: 'Select existing equipment or draw new on P&ID',
  icon: 'touch_app',
  canBranch: true,

  steps: [
    // Step 1: Equipment Picker - browse and select or draw
    {
      id: 'equipment-picker',
      type: 'equipment-picker',
      title: 'Select Equipment for Zero Energy',
      description: 'Browse P&ID files to select existing equipment, or draw a new equipment shape.',
      equipmentPickerConfig: {
        fieldName: 'selectedEquipment',
        allowBrowse: true,
        allowDraw: true,
        fileFieldName: 'fileId',
        multiSelect: false,
      },
      hints: [
        {
          message: 'Left-click on equipment to select it.',
          icon: 'touch_app',
          type: 'tip',
        },
        {
          message: 'Right-click + drag to draw new equipment.',
          icon: 'draw',
          type: 'tip',
        },
        {
          message: 'When you draw new equipment, you\'ll fill out a quick form.',
          icon: 'info',
          type: 'info',
        },
      ],
    },

    // Step 2: Simplified LOTO Point Form (only shown when drawing new)
    {
      id: 'simplified-loto-form',
      type: 'form-section',
      title: 'New LOTO Point Details',
      description: 'Enter the basic details for this new LOTO point.',
      skipCondition: (frame) => {
        // Skip if user selected existing equipment (not drawn)
        // Check if 'drawnShape' exists in collected data
        const hasDrawnShape = frame.entityData.collected && frame.entityData.collected['drawnShape'];
        return !hasDrawnShape;
      },
      formConfig: {
        entityType: 'loto-point',
        fields: ['tagNumber', 'description', 'eqType', 'location', 'normPos', 'isoPos'],
        layout: 'vertical',
      },
      hints: [
        {
          message: 'These are the essential fields for the LOTO point.',
          icon: 'info',
          type: 'info',
        },
        {
          message: 'You can add more details later by editing the LOTO point.',
          icon: 'lightbulb',
          type: 'tip',
        },
      ],
    },

    // Step 3: Confirmation
    {
      id: 'complete',
      type: 'complete',
      title: 'Equipment Selected',
      description: 'The equipment has been assigned to the zero energy placeholder.',
      hints: [
        {
          message: 'Click Finish to return to the zero energy step.',
          icon: 'check_circle',
          type: 'info',
        },
      ],
    },
  ],
};
