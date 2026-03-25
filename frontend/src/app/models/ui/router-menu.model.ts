export interface RouterMenuItem {
    route: string;
    label: string;
    icon?: string;
    guideId?: string;
    guideMessage?: string;
    requiresFullAccess?: boolean;
    separator?: boolean;
}

export interface RouterMenuGroup {
    label: string;
    icon?: string;
    color?: string;
    defaultRoute: string;
    items: RouterMenuItem[];
    requiresFullAccess?: boolean;
}

export type RouterMenuItems = RouterMenuItem[];
export type GroupedRouterMenu = RouterMenuGroup[];

// Grouped main menu items
export const GROUPED_MAIN_MENU: GroupedRouterMenu = [
    {
        label: 'My Account',
        icon: 'account_circle',
        color: '#5C6BC0',
        defaultRoute: '/profile',
        items: [
            { route: '/profile', label: 'My Profile', icon: 'person' },
            { route: '/access-request', label: 'Access Request', icon: 'key' }
        ]
    },
    {
        label: 'Files',
        icon: 'folder',
        color: '#26A69A',
        defaultRoute: '/file',
        requiresFullAccess: true,
        items: [
            { route: '/file', label: 'View Files', icon: 'description' },
            { route: '/tag-number', label: 'Create New Tag', icon: 'new_label' },
            { route: '/print', label: 'Print', icon: 'print' }
        ]
    },
    {
        label: 'LOTO',
        icon: 'lock',
        color: '#FFA726',
        defaultRoute: '/loto',
        requiresFullAccess: true,
        items: [
            { route: '/loto', label: 'LOTO', icon: 'lock' },
            { route: '/loto-points', label: 'Loto Points', icon: 'place', guideId: 'create-loto-point:menu-item', guideMessage: 'Click here to navigate to LOTO Points' },
            { route: '/loto-standard', label: 'LOTO Standards', icon: 'checklist' },
            { route: '/loto-builder', label: 'Loto Builder', icon: 'construction' }
        ]
    },
    {
        label: 'Permits',
        icon: 'assignment',
        color: '#EF5350',
        defaultRoute: '/permit-builder',
        requiresFullAccess: true,
        items: [
            { route: '/permits-monitor', label: 'Permits Monitor', icon: 'monitor_heart' },
            { route: '/permit-builder/daily-packages', label: 'Daily Packages', icon: 'inventory_2', separator: true },
            { route: '/permit-builder/work-requests', label: 'Work Requests', icon: 'request_page' },
            { route: '/permit-builder/jobs', label: 'Job Logs', icon: 'work_history' },
            { route: '/permit-builder/safe-works', label: 'Safe Works', icon: 'verified_user', separator: true },
            { route: '/permit-builder/hot-works', label: 'Hot Works', icon: 'local_fire_department' },
            { route: '/permit-builder/confined-spaces', label: 'Confined Spaces', icon: 'sensor_door' },
            { route: '/permit-builder/jhas', label: 'JHAs', icon: 'health_and_safety' },
            { route: '/permit-builder/energized-work-permits', label: 'Energized Work', icon: 'bolt' },
            { route: '/permit-builder/excavation-permits', label: 'Excavation', icon: 'landscape' },
            { route: '/permit-builder/venting-permits', label: 'Venting/Purging', icon: 'air' },
            { route: '/permit-builder/lotos', label: 'LOTO', icon: 'lock', separator: true },
            { route: '/scheduler', label: 'Scheduler', icon: 'calendar_month' }
        ]
    },
    {
        label: 'Visual Plant',
        icon: 'schema',
        color: '#66BB6A',
        defaultRoute: '/visual-plant/work-areas',
        requiresFullAccess: true,
        items: [
            { route: '/visual-plant/work-areas', label: 'Work Areas', icon: 'location_city' },
            { route: '/visual-plant/work-area-map', label: 'Work Map', icon: 'map' },
            { route: '/diagram-builder/list', label: 'Schematics', icon: 'account_tree', separator: true },
            { route: '/form-designer/forms', label: 'Form Designer', icon: 'dynamic_form', separator: true },
            { route: '/form-designer/design', label: 'Form Design', icon: 'edit_note' },
            { route: '/form-designer/preview', label: 'Form Preview', icon: 'preview' }
        ]
    },
    {
        label: 'Log',
        icon: 'forum',
        color: '#42A5F5',
        defaultRoute: '/log',
        requiresFullAccess: true,
        items: [
            { route: '/log/table', label: 'System Log', icon: 'list_alt' },
            { route: '/log/correspondence', label: 'Correspondence', icon: 'mail' },
            { route: '/log/messaging', label: 'Messages', icon: 'chat' },
            { route: '/instrumentation', label: 'Instruments', icon: 'speed' }
        ]
    },
    {
        label: 'Admin',
        icon: 'admin_panel_settings',
        color: '#AB47BC',
        defaultRoute: '/admin/users',
        requiresFullAccess: true,
        items: [
            { route: '/admin/users', label: 'User Management', icon: 'group' },
            { route: '/admin/access-management', label: 'Access Management', icon: 'security' },
            { route: '/backup', label: 'Backup', icon: 'backup', separator: true },
            { route: '/sync', label: 'Sync Dashboard', icon: 'sync' },
            { route: '/full-sync-to-server', label: 'Full Sync to Server', icon: 'cloud_upload' },
            { route: '/admin', label: 'Admin', icon: 'settings', separator: true }
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
    { route: '/diagram-builder', label: 'Schematics' },
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
    { label: 'JHAs', route: './jhas' },
    { label: 'Energized Work', route: './energized-work-permits' },
    { label: 'Excavation', route: './excavation-permits' },
    { label: 'Venting/Purging', route: './venting-permits' },
    { label: 'LOTO', route: './lotos' },
    { label: 'Scheduler', route: '/scheduler' },
]

export const VISUAL_PLANT_NAV_MENU_ITEMS = [
    { label: 'Work Areas', route: '/visual-plant/work-areas' },
    { label: 'Work Map', route: '/visual-plant/work-area-map' },
    { label: 'Schematics', route: '/diagram-builder/list' },
    { label: 'Form Designer', route: '/form-designer/forms' },
    { label: 'Form Design', route: '/form-designer/design' },
    { label: 'Form Preview', route: '/form-designer/preview' },
]

export const FORM_DESIGNER_NAV_MENU_ITEMS = [
    { label: 'Existing Forms', route: './forms' },
    { label: 'Design', route: './design' },
    { label: 'Preview', route: './preview' },
]
