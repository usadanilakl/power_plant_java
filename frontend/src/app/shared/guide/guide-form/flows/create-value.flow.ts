import { WizardFlow } from '../wizard-stack.types';

export const CREATE_VALUE_FLOW: WizardFlow = {
  type: 'create-value',
  name: 'Create Value',
  description: 'Create a new value option (equipment type, position, location, etc.)',
  icon: 'add_circle',
  canBranch: true, // Always used as a branch

  steps: [
    // Step 1: Name
    {
      id: 'value-name',
      type: 'text-input',
      title: 'Value Name',
      description: 'Enter a name for this new value.',
      inputConfig: {
        fieldName: 'name',
        placeholder: 'e.g., MV, OPEN, Turbine Hall',
        required: true,
        maxLength: 100,
      },
      hints: [
        {
          message: 'Keep names short and consistent with existing values.',
          icon: 'text_fields',
          type: 'tip',
        },
        {
          message: 'Use standard abbreviations where applicable.',
          icon: 'lightbulb',
          type: 'tip',
        },
      ],
    },

    // Step 2: Phrase Builder (for zeroEnergyTemplate category only)
    {
      id: 'phrase-builder',
      type: 'phrase-builder',
      title: 'Build Verification Phrase',
      description: 'Type the verification phrase and insert placeholders for equipment tags.',
      phraseBuilderConfig: {
        fieldName: 'alias',
        placeholder: 'e.g., Verify that [tag1] is open and [tag2] shows zero pressure',
        maxLength: 500,
        required: true,
      },
      // Only show for zero energy phrases
      skipCondition: (frame) => frame.entityData.value?.categoryName !== 'zeroEnergyTemplate',
      hints: [
        {
          message: 'Use "Add Tag Placeholder" to insert [tag1], [tag2], etc. for equipment references.',
          icon: 'info',
          type: 'info',
        },
        {
          message: 'Example: "Verify that [tag1] is closed and [tag2] reads zero PSI"',
          icon: 'text_snippet',
          type: 'example',
        },
        {
          message: 'Placeholders will be replaced with actual equipment tag numbers when the phrase is used.',
          icon: 'lightbulb',
          type: 'tip',
        },
      ],
    },

    // Step 3: Confirm
    {
      id: 'confirm',
      type: 'review',
      title: 'Confirm New Value',
      description: 'Review the new value before creating.',
      hints: [
        {
          message: 'This value will be available for selection immediately.',
          icon: 'check',
          type: 'info',
        },
      ],
    },
  ],
};
