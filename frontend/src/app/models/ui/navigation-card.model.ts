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
  requiresFullAccess?: boolean;
}

export interface NavigationCardGroup {
  label: string;
  description: string;
  icon: string;
  color: string;
  defaultRoute: string;
  items: NavigationCard[];
  requiresFullAccess?: boolean;
}

export type NavigationCards = NavigationCard[];
export type GroupedNavigationCards = NavigationCardGroup[];

// Grouped navigation cards for home page
export const GROUPED_HOME_NAVIGATION_CARDS: GroupedNavigationCards = [
  {
    label: 'My Account',
    description: 'Profile settings and access management',
    icon: 'account_circle',
    color: '#5c6bc0',
    defaultRoute: '/profile',
    items: [
      { title: 'My Profile', description: 'View and edit your profile, security settings', icon: 'person', route: '/profile', color: '#5c6bc0' },
      { title: 'Access Request', description: 'Request or check full access status', icon: 'vpn_key', route: '/access-request', color: '#7e57c2' }
    ]
  },
  {
    label: 'Files',
    description: 'Manage equipment files, tags, and printing',
    icon: 'folder',
    color: '#3498db',
    defaultRoute: '/file',
    requiresFullAccess: true,
    items: [
      { title: 'View Files', description: 'View and edit equipment files', icon: 'folder', route: '/file', color: '#3498db' },
      { title: 'Create Tag', description: 'Create new equipment tag numbers', icon: 'add_circle', route: '/tag-number', color: '#16a085' },
      { title: 'Print', description: 'Print documents and reports', icon: 'print', route: '/print', color: '#7f8c8d' }
    ]
  },
  {
    label: 'LOTO',
    description: 'Lockout/Tagout procedures and safety protocols',
    icon: 'lock',
    color: '#e74c3c',
    defaultRoute: '/loto',
    requiresFullAccess: true,
    items: [
      { title: 'LOTO', description: 'Manage LOTO procedures', icon: 'lock', route: '/loto', color: '#e74c3c' },
      { title: 'Loto Points', description: 'Manage isolation points', icon: 'location_on', route: '/loto-points', color: '#9b59b6' },
      { title: 'LOTO Standards', description: 'View standard procedures', icon: 'description', route: '/loto-standard', color: '#e67e22' },
      { title: 'Loto Builder', description: 'Build LOTO procedures', icon: 'build', route: '/loto-builder', color: '#1abc9c' },
      { title: 'LOTO Board', description: 'Active LOTO permits and box status', icon: 'dashboard', route: '/permit-builder/loto-board', color: '#EC407A' },
      { title: 'LOTO Usage', description: 'Monitor LOTO usage, jobs, and foremen', icon: 'monitor_heart', route: '/permit-builder/loto-usage', color: '#26C6DA' }
    ]
  },
  {
    label: 'Permits',
    description: 'Work permits, scheduling, and authorizations',
    icon: 'assignment',
    color: '#f39c12',
    defaultRoute: '/permit-builder',
    requiresFullAccess: true,
    items: [
      { title: 'Daily Packages', description: 'Daily permit packages', icon: 'event_note', route: '/permit-builder/daily-packages', color: '#f39c12' },
      { title: 'Work Requests', description: 'Work request permits from SharePoint', icon: 'request_page', route: '/permit-builder/work-requests', color: '#e67e22' },
      { title: 'Job Logs', description: 'Job log entries', icon: 'work', route: '/permit-builder/jobs', color: '#d35400' },
      { title: 'Safe Works', description: 'Safe work permits', icon: 'health_and_safety', route: '/permit-builder/safe-works', color: '#27ae60' },
      { title: 'Hot Works', description: 'Hot work permits', icon: 'local_fire_department', route: '/permit-builder/hot-works', color: '#e74c3c' },
      { title: 'Confined Spaces', description: 'Confined space entry permits', icon: 'sensor_door', route: '/permit-builder/confined-spaces', color: '#8e44ad' },
      { title: 'JHAs', description: 'Job Hazard Analysis', icon: 'checklist', route: '/permit-builder/jhas', color: '#2c3e50' },
      { title: 'Energized Work', description: 'Energized electrical work permits', icon: 'bolt', route: '/permit-builder/energized-work-permits', color: '#f1c40f' },
      { title: 'Excavation', description: 'Excavation work permits', icon: 'construction', route: '/permit-builder/excavation-permits', color: '#795548' },
      { title: 'Venting/Purging', description: 'Venting and purging permits', icon: 'air', route: '/permit-builder/venting-permits', color: '#00bcd4' },
      { title: 'LOTO Board', description: 'Active LOTOs and box grid', icon: 'dashboard', route: '/permit-builder/loto-board', color: '#EC407A' },
      { title: 'LOTO Usage', description: 'Monitor LOTO usage and foremen', icon: 'monitor_heart', route: '/permit-builder/loto-usage', color: '#26C6DA' },
      { title: 'Scheduler', description: 'Schedule tasks', icon: 'schedule', route: '/scheduler', color: '#2ecc71' }
    ]
  },
  {
    label: 'Visual Plant',
    description: 'Plant layout, work areas, schematics, and printable forms',
    icon: 'schema',
    color: '#00897b',
    defaultRoute: '/visual-plant/work-areas',
    requiresFullAccess: true,
    items: [
      { title: 'Work Areas', description: 'Manage plant work areas, hazards, and LOTO references', icon: 'map', route: '/visual-plant/work-areas', color: '#16a085' },
      { title: 'Work Map', description: 'Interactive plant map with work area overview', icon: 'place', route: '/visual-plant/work-area-map', color: '#2980b9' },
      { title: 'Schematics', description: 'Build and view P&ID diagrams and process schematics', icon: 'schema', route: '/diagram-builder/list', color: '#00897b' },
      { title: 'Form Designer', description: 'Design printable forms', icon: 'edit_document', route: '/form-designer', color: '#34495e' }
    ]
  },
  {
    label: 'Log',
    description: 'View all system comments and activity',
    icon: 'forum',
    color: '#607d8b',
    defaultRoute: '/log',
    requiresFullAccess: true,
    items: [
      { title: 'System Log', description: 'View all comments across the system', icon: 'forum', route: '/log', color: '#607d8b' },
      { title: 'Instruments', description: 'View and manage instruments', icon: 'precision_manufacturing', route: '/instrumentation', color: '#00897b' }
    ]
  },
  {
    label: 'Admin',
    description: 'System administration and synchronization',
    icon: 'admin_panel_settings',
    color: '#c0392b',
    defaultRoute: '/backup',
    requiresFullAccess: true,
    items: [
      { title: 'Backup', description: 'Backup and restore data', icon: 'backup', route: '/backup', color: '#8e44ad' },
      { title: 'Sync Dashboard', description: 'Monitor sync status & recovery', icon: 'sync', route: '/sync', color: '#27ae60' },
      { title: 'Full Sync to Server', description: 'Full sync to server', icon: 'cloud_upload', route: '/full-sync-to-server', color: '#2980b9' },
      { title: 'Admin', description: 'Admin settings', icon: 'admin_panel_settings', route: '/admin', color: '#c0392b' },
      { title: 'Work Category Hazards', description: 'Configure standard hazards by work category', icon: 'category', route: '/admin/work-category-profiles', color: '#e67e22' }
    ]
  }
];

// Flat navigation cards (for backward compatibility)
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
