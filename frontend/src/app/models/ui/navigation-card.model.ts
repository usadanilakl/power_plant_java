export interface NavigationCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color?: string;
  children?: NavigationCard[];
  /** Guide identifier in format "guideId:stepId" for the guide system */
  guideId?: string;
  /** Message to show when this card is highlighted by a guide */
  guideMessage?: string;
  /** Reactive guide identifier in format "guideId:stepId" for the reactive guide system */
  reactiveGuideId?: string;
  /** Message to show when this card is highlighted by a reactive guide */
  reactiveGuideMessage?: string;
}

export type NavigationCards = NavigationCard[];

export const HOME_NAVIGATION_CARDS: NavigationCards = [
  {
    title: 'LOTO',
    description: 'Manage lockout/tagout procedures and safety protocols',
    icon: 'lock',
    route: '/loto',
    color: '#e74c3c'
  },
  {
    title: 'Files',
    description: 'View and edit equipment files and documentation',
    icon: 'folder',
    route: '/file',
    color: '#3498db',
    guideId: 'manage-files:nav-card',
    guideMessage: 'Click here to access the file management system'
  },
  {
    title: 'LOTO Points',
    description: 'Manage all LOTO isolation points',
    icon: 'location_on',
    route: '/loto-points',
    color: '#9b59b6',
    guideId: 'create-loto-point:nav-card',
    guideMessage: 'Click here to navigate to LOTO Points and create a new point'
  },
  {
    title: 'LOTO Standards',
    description: 'View and manage LOTO standard procedures',
    icon: 'description',
    route: '/loto-standard',
    color: '#e67e22',
    guideId: 'create-loto-standard:nav-card',
    guideMessage: 'Click here to navigate to LOTO Standards'
  },
  {
    title: 'LOTO Builder',
    description: 'Build and configure LOTO procedures',
    icon: 'build',
    route: '/loto-builder',
    color: '#1abc9c',
    guideId: 'create-loto-point-bulk:nav-card',
    guideMessage: 'Click here to open LOTO Builder and create multiple LOTO points',
    reactiveGuideId: 'loto-builder-full:nav-card',
    reactiveGuideMessage: 'Click here to open the LOTO Builder'
  },
  {
    title: 'Permits',
    description: 'Manage work permits, safe works, and hot works',
    icon: 'assignment',
    route: '/permit-builder',
    color: '#f39c12'
  },
  {
    title: 'Scheduler',
    description: 'Schedule and manage tasks',
    icon: 'schedule',
    route: '/scheduler',
    color: '#2ecc71'
  },
  {
    title: 'Form Designer',
    description: 'Design and preview printable forms',
    icon: 'edit_document',
    route: '/form-designer',
    color: '#34495e'
  },
  {
    title: 'Create Tag',
    description: 'Create new equipment tag numbers',
    icon: 'add_circle',
    route: '/tag-number',
    color: '#16a085'
  },
  {
    title: 'Print',
    description: 'Print documents and reports',
    icon: 'print',
    route: '/print',
    color: '#7f8c8d'
  },
  {
    title: 'Backup',
    description: 'Backup and restore system data',
    icon: 'backup',
    route: '/backup',
    color: '#8e44ad'
  },
  {
    title: 'Admin',
    description: 'Administrative functions and settings',
    icon: 'admin_panel_settings',
    route: '/admin',
    color: '#c0392b'
  }
];
