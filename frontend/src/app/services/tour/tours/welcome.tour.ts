import { Tour } from '../tour.model';

export const WELCOME_TOUR: Tour = {
  id: 'welcome',
  name: 'Welcome Tour',
  description: 'Get started with the Power Plant Management system',
  route: '/',
  steps: [
    {
      popover: {
        title: 'Welcome to Power Plant Management',
        description:
          'This quick tour will help you get familiar with the main features of the application. You can restart this tour anytime from the help menu.',
        side: 'over',
        align: 'center',
      },
    },
    {
      element: '.home-header',
      popover: {
        title: 'Dashboard',
        description:
          'This is your home dashboard. From here you can access all the main modules of the system.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.navigation-grid',
      popover: {
        title: 'Module Navigation',
        description:
          'Click on any card to navigate to that module. Each module handles a specific part of plant operations.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: 'app-navigation-card:nth-child(1)',
      popover: {
        title: 'LOTO Module',
        description:
          'Manage lockout/tagout procedures. Create, view, and track safety isolation procedures for equipment maintenance.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: 'app-navigation-card:nth-child(2)',
      popover: {
        title: 'Files Module',
        description:
          'Access equipment files and documentation. View P&IDs, technical drawings, and other reference materials.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: 'app-navigation-card:nth-child(3)',
      popover: {
        title: 'LOTO Points',
        description:
          'Manage isolation points throughout the plant. View, edit, and organize all LOTO isolation locations.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: 'app-navigation-card:nth-child(4)',
      popover: {
        title: 'LOTO Standards',
        description:
          'Create and manage standard LOTO procedures that can be reused across the plant.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: 'app-theme-toggle',
      popover: {
        title: 'Theme Toggle',
        description:
          'Switch between light and dark mode for comfortable viewing in different environments.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '.clipboard-container',
      popover: {
        title: 'Clipboard',
        description:
          'The clipboard allows you to copy and store items temporarily. You can drag it around the screen.',
        side: 'left',
        align: 'start',
      },
    },
    {
      popover: {
        title: 'Ready to Start!',
        description:
          'You are now ready to explore the system. Click on any module to begin. You can access specific feature tours from the help button in each module.',
        side: 'over',
        align: 'center',
      },
    },
  ],
};
