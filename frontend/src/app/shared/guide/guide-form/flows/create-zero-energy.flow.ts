import { WizardFlow } from '../wizard-stack.types';

export const CREATE_ZERO_ENERGY_FLOW: WizardFlow = {
  type: 'create-zero-energy',
  name: 'Configure Zero Energy',
  description: 'Set up zero energy verification for a LOTO point',
  icon: 'energy_savings_leaf',
  canBranch: true, // Always used as a branch

  steps: [
    // Step 1: Method/Phrase Selection
    {
      id: 'zero-energy-phrase',
      type: 'select-input',
      title: 'Zero Energy Phrase',
      description: 'Select a template phrase for zero energy verification.',
      selectConfig: {
        fieldName: 'zeroEnergyTemplate',
        optionsSource: 'api',
        apiEndpoint: 'values/category/zeroEnergyTemplate',
        allowCreate: true,
        createFlowType: 'create-value',
        createInitialData: { categoryName: 'zeroEnergyTemplate' },
        searchable: true,
        required: true,
      },
      hints: [
        {
          message: 'Zero energy phrases use placeholders like [tag1] for equipment references.',
          icon: 'info',
          type: 'info',
        },
        {
          message: 'Example: "Verify [tag1] pressure gauge reads zero PSI"',
          icon: 'text_snippet',
          type: 'example',
        },
        {
          message: 'You can create new phrases if needed.',
          icon: 'add',
          type: 'tip',
        },
      ],
    },

    // Step 2: Custom Method Text (Optional)
    {
      id: 'custom-method',
      type: 'text-input',
      title: 'Custom Verification Method',
      description: 'Enter any custom verification instructions (optional).',
      inputConfig: {
        fieldName: 'method',
        placeholder: 'e.g., Check local pressure indicator',
        required: false,
        maxLength: 500,
      },
      isOptional: true,
      hints: [
        {
          message: 'Add specific instructions not covered by the template.',
          icon: 'edit_note',
          type: 'tip',
        },
      ],
    },

    // Step 3: Reference Equipment
    {
      id: 'reference-equipment',
      type: 'table-selector',
      title: 'Reference Equipment',
      description: 'Select equipment to reference in the zero energy verification.',
      tableConfig: {
        fieldName: 'templateEquipment',
        entityType: 'loto-point',
        columns: ['tagNumber', 'description', 'eqType'],
        allowCreate: true,
        createFlowType: 'add-loto-point',
        minSelection: 0,
        maxSelection: 5,
      },
      isOptional: true,
      hints: [
        {
          message: 'Selected equipment will replace [tag1], [tag2] placeholders.',
          icon: 'swap_horiz',
          type: 'info',
        },
        {
          message: 'You can select existing LOTO points or create new ones.',
          icon: 'lightbulb',
          type: 'tip',
        },
        {
          message: 'Example: Select a downstream gauge for "Verify [tag1] reads zero"',
          icon: 'text_snippet',
          type: 'example',
        },
      ],
    },

    // Step 4: Review
    {
      id: 'review',
      type: 'review',
      title: 'Review Zero Energy Configuration',
      description: 'Review the zero energy verification setup.',
      hints: [
        {
          message: 'Verify the phrase and equipment selections are correct.',
          icon: 'checklist',
          type: 'info',
        },
      ],
    },
  ],
};
