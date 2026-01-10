import { Guide } from '../guide.model';

export const CREATE_LOTO_POINT_GUIDE: Guide = {
  id: 'create-loto-point',
  name: 'Create LOTO Point',
  description: 'Learn how to create a new Lock Out Tag Out point',
  icon: 'location_on',
  category: 'loto',
  steps: [
    {
      id: 'nav-card',
      message: 'Click on the LOTO Points card to navigate to the LOTO Points page.',
      title: 'Navigate to LOTO Points',
      order: 1,
      route: '/home',
    },
    {
      id: 'create-button',
      message: 'Click the "Add New Loto Point" button to open the creation form.',
      title: 'Create New Point',
      order: 2,
      route: '/loto-points',
    },
    {
      id: 'field-tag-number',
      message: 'Enter a unique tag number for this LOTO point. This is required.',
      title: 'Tag Number',
      order: 3,
      route: '/loto-points',
    },
    {
      id: 'field-description',
      message: 'Provide a clear description of the LOTO point. This is required.',
      title: 'Description',
      order: 4,
      route: '/loto-points',
    },
  ],
};
