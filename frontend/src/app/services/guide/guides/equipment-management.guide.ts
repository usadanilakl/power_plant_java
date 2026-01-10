import { Guide } from '../guide.model';

export const EQUIPMENT_MANAGEMENT_GUIDE: Guide = {
  id: 'equipment-management',
  name: 'Equipment Management',
  description: 'Learn how to add and manage equipment records',
  icon: 'build',
  category: 'equipment',
  steps: [
    {
      id: 'nav-card',
      message: 'Click on the Equipment card to access equipment management.',
      title: 'Navigate to Equipment',
      order: 1,
      route: '/home',
    },
    {
      id: 'create-button',
      message: 'Click here to add new equipment to the system.',
      title: 'Add Equipment',
      order: 2,
      route: '/equipment',
    },
    {
      id: 'equipment-name',
      message: 'Enter the equipment name or tag number.',
      title: 'Equipment Name',
      order: 3,
      route: '/equipment',
    },
    {
      id: 'equipment-type',
      message: 'Select the equipment type from the available categories.',
      title: 'Equipment Type',
      order: 4,
      route: '/equipment',
    },
    {
      id: 'save-button',
      message: 'Save the equipment record when all details are complete.',
      title: 'Save Equipment',
      order: 5,
      route: '/equipment',
    },
  ],
};
