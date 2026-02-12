export interface RouterMenuItem {
    route: string;
    label: string;
    guideId?: string;
    guideMessage?: string;
}

export interface RouterMenuGroup {
    label: string;
    icon?: string;
    defaultRoute: string;
    items: RouterMenuItem[];
}

export type RouterMenuItems = RouterMenuItem[];
export type GroupedRouterMenu = RouterMenuGroup[];

// Grouped main menu items
export const GROUPED_MAIN_MENU: GroupedRouterMenu = [
    {
        label: 'Files',
        icon: 'folder',
        defaultRoute: '/file',
        items: [
            { route: '/file', label: 'View Files' },
            { route: '/tag-number', label: 'Create New Tag' },
            { route: '/print', label: 'Print' }
        ]
    },
    {
        label: 'LOTO',
        icon: 'lock',
        defaultRoute: '/loto',
        items: [
            { route: '/loto', label: 'LOTO' },
            { route: '/loto-points', label: 'Loto Points', guideId: 'create-loto-point:menu-item', guideMessage: 'Click here to navigate to LOTO Points' },
            { route: '/loto-standard', label: 'LOTO Standards' },
            { route: '/loto-builder', label: 'Loto Builder' }
        ]
    },
    {
        label: 'Permits',
        icon: 'assignment',
        defaultRoute: '/permit-builder',
        items: [
            { route: '/permit-builder/daily-packages', label: 'Daily Packages' },
            { route: '/permit-builder/work-requests', label: 'Work Requests' },
            { route: '/permit-builder/jobs', label: 'Job Logs' },
            { route: '/permit-builder/safe-works', label: 'Safe Works' },
            { route: '/permit-builder/hot-works', label: 'Hot Works' },
            { route: '/permit-builder/confined-spaces', label: 'Confined Spaces' },
            { route: '/scheduler', label: 'Scheduler' }
        ]
    },
    {
        label: 'Form Designer',
        icon: 'edit_document',
        defaultRoute: '/form-designer',
        items: [
            { route: '/form-designer/forms', label: 'Existing Forms' },
            { route: '/form-designer/design', label: 'Design' },
            { route: '/form-designer/preview', label: 'Preview' }
        ]
    },
    {
        label: 'Log',
        icon: 'forum',
        defaultRoute: '/log',
        items: [
            { route: '/log', label: 'System Log' }
        ]
    },
    {
        label: 'Admin',
        icon: 'admin_panel_settings',
        defaultRoute: '/backup',
        items: [
            { route: '/backup', label: 'Backup' },
            { route: '/sync', label: 'Sync Dashboard' },
            { route: '/full-sync-to-server', label: 'Full Sync to Server' },
            { route: '/admin', label: 'Admin' }
        ]
    }
];

// Flat main menu items (for backward compatibility)
export const MAIN_MENU_ITEMS: RouterMenuItems = [
    { route: '/', label: 'Home' },
    { route: '/loto', label: 'LOTO' },
    { route: '/loto-points', label: 'LOTO Points', guideId: 'create-loto-point:menu-item', guideMessage: 'Click here to navigate to LOTO Points' },
    { route: '/loto-standard', label: 'LOTO Standards' },
    { route: '/loto-builder', label: 'LOTO Builder' },
    { route: '/tag-number', label: 'Create New Tag' },
    { route: '/file', label: 'View Files' },
    { route: '/print', label: 'Print' },
    { route: '/backup', label: 'Backup' },
    { route: '/scheduler', label: 'Scheduler' },
    { route: '/permit-builder', label: 'Permit Builder' },
    { route: '/form-designer', label: 'Form Designer' },
    { route: '/sync', label: 'Sync Dashboard' }
];

export const FILE_NAV_MENU_ITEMS: RouterMenuItems = [
    { route: './table', label: 'File Table' },
    { route: './edit', label: 'Edit File' },
];

export const FILE_EDITOR_MENU_ITEMS: RouterMenuItems = [
    
];

export const LOTO_NAV_MENU_ITEMS: RouterMenuItems = [
    { label: 'LOTO', route: './loto' },
    { label: 'LOTO Standards', route: './loto-standard' },
    { label: 'Active LOTO Points', route: './loto-points-active' },
    { label: 'All LOTO Points', route: './loto-points' },
    { label: 'LOTO Boxes', route: './loto-boxes' },
    { label: 'LOTO Grid', route: './loto-boxes-grid' },
    { label: 'ESP', route: './esp-devices' },
    { label: 'Locks', route: './locks' }

];

export const PERMIT_BUILDER_NAV_MENU_ITEMS = [
    { label: 'Job-Logs', route: './jobs' },
    { label: 'Daily Packages', route: './daily-packages' },
    { label: 'Work Requests', route: './work-requests' },
    { label: 'Safe Works', route: './safe-works' },
    { label: 'Hot Works', route: './hot-works' },
    { label: 'Confined Spaces', route: './confined-spaces' },
]

export const FORM_DESIGNER_NAV_MENU_ITEMS = [
    { label: 'Existing Forms', route: './forms' },
    { label: 'Design', route: './design' },
    { label: 'Preview', route: './preview' },
]