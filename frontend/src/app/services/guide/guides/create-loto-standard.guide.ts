import { Guide } from '../guide.model';

export const CREATE_LOTO_STANDARD_GUIDE: Guide = {
  id: 'create-loto-standard',
  name: 'Create LOTO Standard',
  description: 'Learn how to create a standard LOTO procedure',
  icon: 'description',
  category: 'loto',
  steps: [
    {
      id: 'nav-card',
      message: 'Click on the LOTO Standards card to navigate to the standards page.',
      title: 'Navigate to Standards',
      order: 1,
      route: '/home',
    },
    {
      id: 'create-button',
      message: 'Click here to start creating a new LOTO standard procedure.',
      title: 'Create New Standard',
      order: 2,
      route: '/loto-standard',
    },
    {
      id: 'standard-name',
      message: 'Enter a descriptive name for the LOTO standard.',
      title: 'Standard Name',
      order: 3,
      route: '/loto-standard',
    },
    {
      id: 'add-points',
      message: 'Add LOTO points to this standard. You can search and select from existing points.',
      title: 'Add Points',
      order: 4,
      route: '/loto-standard',
    },
    {
      id: 'save-button',
      message: 'Save the standard when all points have been added.',
      title: 'Save Standard',
      order: 5,
      route: '/loto-standard',
    },
  ],
};
