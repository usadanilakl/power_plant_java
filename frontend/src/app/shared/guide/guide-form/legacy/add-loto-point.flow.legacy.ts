import { GuideFlow } from './guide-form.types';

export const ADD_LOTO_POINT_FLOW: GuideFlow = {
  action: 'add-loto-point',
  name: 'Add LOTO Point',
  description: 'Step-by-step guide to creating a LOTO point',
  icon: 'add_location',
  steps: [
    // Step 1: Welcome
    {
      id: 'welcome',
      type: 'welcome',
      title: 'Create a LOTO Point',
      description:
        "This guide will walk you through creating a LOTO point step by step. You'll learn how to properly fill out each field using our specialized tools.",
      icon: 'add_location',
      actionLabel: 'Start Tutorial',
      hints: [
        {
          message: 'Each field will be explained with examples and conventions',
          icon: 'school',
          type: 'info',
        },
        {
          message: 'Estimated time: 5-10 minutes for your first LOTO point',
          icon: 'schedule',
          type: 'tip',
        },
      ],
    },

    // Step 2: Tag Number Generation
    {
      id: 'tag-number',
      type: 'tutorial',
      title: 'Step 1: Tag Number',
      description: 'The tag number is the unique identifier for this LOTO point.',
      tutorialTopic: 'tag-number',
      tutorialConfig: {
        explanation:
          'Tag numbers follow a specific format based on Unit, Equipment Type, and System. The generator will create a standardized tag number for you.',
        examples: [
          '01-BV-001 (Unit 01, Ball Valve, System 001)',
          '02-MCC-015 (Unit 02, Motor Control Center, System 015)',
          '01-XV-COND (Unit 01, Control Valve, Condensate)',
        ],
        conventions: [
          'Always starts with unit number (01 or 02)',
          'Equipment type abbreviation in the middle',
          'System or sequence number at the end',
          'Use the generator to ensure uniqueness',
        ],
        actionLabel: 'Open Tag Generator',
        actionIcon: 'tag',
        fieldName: 'tagNumber',
        canSkip: false,
      },
      hints: [
        {
          message: 'The tag generator checks for duplicates automatically',
          icon: 'verified',
          type: 'tip',
        },
      ],
    },

    // Step 3: Description with Naming Convention
    {
      id: 'description',
      type: 'tutorial',
      title: 'Step 2: Description',
      description: 'The description helps identify what this LOTO point controls.',
      tutorialTopic: 'description',
      tutorialConfig: {
        explanation:
          'Descriptions should follow naming conventions to maintain consistency across all LOTO points. Use the Naming Convention helper to build a proper description.',
        examples: [
          'HP TERM ATEMP STR (BFW100) OUTLET ROOT',
          'COND PUMP A DISCH ISO',
          'MVB SWITCHGEAR 1 CUBICLE 9B',
        ],
        conventions: [
          'Use standard abbreviations (ISO, DISCH, SUCT, etc.)',
          'Include equipment identifier in parentheses',
          'Specify location (INLET, OUTLET, ROOT, etc.)',
          'Keep it concise but descriptive',
        ],
        actionLabel: 'Open Naming Helper',
        actionIcon: 'text_fields',
        fieldName: 'description',
        canSkip: false,
      },
      hints: [
        {
          message: 'Consistent descriptions make searching easier',
          icon: 'search',
          type: 'info',
        },
      ],
    },

    // Step 4: Positions (isoPos, normPos)
    {
      id: 'positions',
      type: 'tutorial',
      title: 'Step 3: Positions',
      description: 'Set the Normal and Isolated positions for this LOTO point.',
      tutorialTopic: 'positions',
      tutorialConfig: {
        explanation:
          'Every LOTO point has two key positions: the Normal operating position (how it runs during normal operation) and the Isolated position (how it should be set during LOTO).',
        examples: [
          'Valve: Normal = OPEN, Isolated = CLOSED',
          'Breaker: Normal = CLOSED, Isolated = OPEN/RACKED OUT',
          'Disconnect: Normal = ENERGIZED, Isolated = DE-ENERGIZED',
        ],
        conventions: [
          'Normal Position = state during normal plant operation',
          'Isolated Position = state required for safe isolation',
          'Select from predefined values for consistency',
        ],
        actionLabel: 'Set Positions',
        actionIcon: 'swap_horiz',
        fieldName: 'positions',
        canSkip: false,
      },
      hints: [
        {
          message: 'Think: "What state is it normally in?" and "What state isolates it?"',
          icon: 'psychology',
          type: 'tip',
        },
      ],
    },

    // Step 5: Zero Energy Configuration
    {
      id: 'zero-energy',
      type: 'tutorial',
      title: 'Step 4: Zero Energy',
      description: 'Define how to verify zero energy state for this point.',
      tutorialTopic: 'zero-energy',
      tutorialConfig: {
        explanation:
          'Zero Energy verification ensures the equipment is truly de-energized. You\'ll select a phrase template and specify which equipment to reference in the verification steps.',
        examples: [
          'Verify no flow through [tag1] by checking downstream gauge',
          'Confirm [tag1] breaker is racked out and LOTO applied',
          'Check pressure gauge at [tag1] reads zero PSI',
        ],
        conventions: [
          'Use [tag1], [tag2] placeholders for equipment references',
          'Phrases should be actionable verification steps',
          'Select equipment that will be substituted into placeholders',
        ],
        actionLabel: 'Configure Zero Energy',
        actionIcon: 'energy_savings_leaf',
        fieldName: 'zeroEnergy',
        canSkip: true,
        skipLabel: 'Skip for Now',
      },
      hints: [
        {
          message: 'Zero energy is optional but recommended for safety',
          icon: 'warning',
          type: 'warning',
        },
      ],
    },

    // Step 6: File/Equipment Connection
    {
      id: 'file-connection',
      type: 'tutorial',
      title: 'Step 5: Connect to File',
      description: 'Link this LOTO point to a file and mark its location.',
      tutorialTopic: 'file-connection',
      tutorialConfig: {
        explanation:
          'LOTO points are associated with files (P&IDs, electrical drawings, etc.) through equipment. This connection allows the point to be shown on the drawing and helps operators locate it.',
        examples: [
          'Select the P&ID where this valve appears',
          'Choose the electrical drawing showing this breaker',
          'Pick equipment symbols that represent this point',
        ],
        conventions: [
          'Select the primary file where this point is documented',
          'Choose equipment symbols on the drawing',
          'The point will appear on the file viewer',
        ],
        actionLabel: 'Connect to File',
        actionIcon: 'link',
        fieldName: 'fileConnection',
        canSkip: true,
        skipLabel: 'Connect Later',
      },
      hints: [
        {
          message: 'You can connect to multiple equipment symbols if needed',
          icon: 'hub',
          type: 'tip',
        },
      ],
    },

    // Step 7: Counterpart Configuration
    {
      id: 'counterpart',
      type: 'tutorial',
      title: 'Step 6: Counterpart',
      description: 'Create a matching LOTO point for the other unit.',
      tutorialTopic: 'counterpart',
      tutorialConfig: {
        explanation:
          'Most plants have duplicate equipment in Unit 01 and Unit 02. A counterpart is the matching LOTO point on the other unit. The system can automatically create it with adjusted tag numbers and descriptions.',
        examples: [
          '01-BV-001 counterpart is 02-BV-001',
          '"Unit 1 Pump" becomes "Unit 2 Pump"',
          'Most fields are synced, positions may differ',
        ],
        conventions: [
          'Counterparts have mirrored unit numbers (01 ↔ 02)',
          'Text references to units are automatically transformed',
          'You can sync individual fields or all at once',
          'Link the counterparts for easy navigation',
        ],
        actionLabel: 'Create Counterpart',
        actionIcon: 'sync_alt',
        fieldName: 'counterpart',
        canSkip: true,
        skipLabel: 'No Counterpart Needed',
      },
      hints: [
        {
          message: 'If this equipment only exists in one unit, skip this step',
          icon: 'info',
          type: 'info',
        },
      ],
    },

    // Step 8: Review & Save
    {
      id: 'review',
      type: 'review',
      title: 'Review & Save',
      description: 'Review your LOTO point details before saving.',
      hints: [
        {
          message: 'Click Back to make changes to any field',
          icon: 'edit',
          type: 'tip',
        },
      ],
    },

    // Step 9: Complete
    {
      id: 'complete',
      type: 'complete',
      title: 'LOTO Point Created!',
      description:
        'Your LOTO point has been saved. You can now view it on the file or create another one.',
      icon: 'check_circle',
      actionLabel: 'Done',
      hints: [
        {
          message: 'Want to add more LOTO points? Select "Add Another" below',
          icon: 'add_location',
          type: 'tip',
        },
      ],
    },
  ],
};
