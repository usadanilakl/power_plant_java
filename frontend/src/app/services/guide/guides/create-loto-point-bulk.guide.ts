import { Guide } from '../guide.model';

export const CREATE_LOTO_POINT_BULK_GUIDE: Guide = {
  id: 'create-loto-point-bulk',
  name: 'Create LOTO Points in Bulk',
  description: 'Learn how to create multiple LOTO points quickly using the LOTO Builder',
  icon: 'dynamic_feed',
  category: 'loto',
  steps: [
    {
      id: 'nav-card',
      message: 'Click on the LOTO Builder card to open the bulk creation tool.',
      title: 'Open LOTO Builder',
      order: 1,
      route: '/home',
    },
    {
      id: 'nav-menu',
      message: 'You can also access LOTO Builder from the navigation menu.',
      title: 'Navigation Menu',
      order: 2,
    },
    {
      id: 'left-panel-files',
      message: 'Select the Files tab to browse P&ID files. Click on a file to load it in the viewer.',
      title: 'Select a File',
      order: 3,
      route: '/loto-builder',
    },
    {
      id: 'file-menu',
      message: 'Expand folders and click on a P&ID file to load it. The file will be displayed on the right.',
      title: 'Browse Files',
      order: 4,
      route: '/loto-builder',
    },
    {
      id: 'image-viewer',
      message: 'Right-click and drag on the image to draw a rectangle around equipment. Release to create an equipment shape.',
      title: 'Draw Equipment Shapes',
      order: 5,
      route: '/loto-builder',
    },
    {
      id: 'loto-point-form',
      message: 'After drawing, a form will appear. Fill in the LOTO point details and save.',
      title: 'Fill LOTO Point Details',
      order: 6,
      route: '/loto-builder',
    },
    {
      id: 'continue-drawing',
      message: 'Continue drawing more equipment shapes to create additional LOTO points. Each shape creates a new point.',
      title: 'Create More Points',
      order: 7,
      route: '/loto-builder',
    },
  ],
};
