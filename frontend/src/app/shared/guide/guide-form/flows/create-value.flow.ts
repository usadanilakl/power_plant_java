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

    // Step 2: Alias (Optional)
    {
      id: 'value-alias',
      type: 'text-input',
      title: 'Alias (Optional)',
      description: 'Enter an optional alias or full name.',
      inputConfig: {
        fieldName: 'alias',
        placeholder: 'e.g., Motor Operated Valve',
        required: false,
        maxLength: 200,
      },
      isOptional: true,
      hints: [
        {
          message: 'Alias provides a longer description for clarity.',
          icon: 'info',
          type: 'info',
        },
        {
          message: 'Example: Name = "MV", Alias = "Motor Operated Valve"',
          icon: 'text_snippet',
          type: 'example',
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
