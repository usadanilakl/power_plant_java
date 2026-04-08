export interface RouterMenuItem {
    route: string;
    label: string;
    icon?: string;
    iconColor?: string;
    guideId?: string;
    guideMessage?: string;
    requiresFullAccess?: boolean;
    separator?: boolean;
    /** Only visible when test mode is enabled on backend */
    testOnly?: boolean;
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
            { route: '/profile', label: 'My Profile', icon: 'person', iconColor: '#5C6BC0' },
            { route: '/access-request', label: 'Access Request', icon: 'key', iconColor: '#FFA726' }
        ]
    },
    {
        label: 'Files',
        icon: 'folder',
        color: '#26A69A',
        defaultRoute: '/file',
        requiresFullAccess: true,
        items: [
            { route: '/file', label: 'View Files', icon: 'description', iconColor: '#26A69A' },
            { route: '/tag-number', label: 'Create New Tag', icon: 'new_label', iconColor: '#FFA726' },
            { route: '/print', label: 'Print', icon: 'print', iconColor: '#78909C' }
        ]
    },
    {
        label: 'LOTO',
        icon: 'lock',
        color: '#FFA726',
        defaultRoute: '/loto',
        requiresFullAccess: true,
        items: [
            { route: '/loto', label: 'LOTO', icon: 'lock', iconColor: '#FFA726' },
            { route: '/loto-points', label: 'Loto Points', icon: 'place', iconColor: '#EF5350', guideId: 'create-loto-point:menu-item', guideMessage: 'Click here to navigate to LOTO Points' },
            { route: '/loto-standard', label: 'LOTO Standards', icon: 'checklist', iconColor: '#66BB6A' },
            { route: '/loto-builder', label: 'Loto Builder', icon: 'construction', iconColor: '#42A5F5' },
            { route: '/permit-builder/loto-board', label: 'LOTO Board', icon: 'dashboard', iconColor: '#EC407A' },
            { route: '/permit-builder/loto-usage', label: 'LOTO Usage', icon: 'monitor_heart', iconColor: '#26C6DA' }
        ]
    },
    {
        label: 'Permits',
        icon: 'assignment',
        color: '#EF5350',
        defaultRoute: '/permit-builder',
        requiresFullAccess: true,
        items: [
            { route: '/permits-monitor', label: 'Permits Monitor', icon: 'monitor_heart', iconColor: '#EF5350' },
            { route: '/permit-builder/daily-packages', label: 'Daily Packages', icon: 'inventory_2', iconColor: '#AB47BC', separator: true },
            { route: '/permit-builder/work-requests', label: 'Work Requests', icon: 'request_page', iconColor: '#42A5F5' },
            { route: '/permit-builder/jobs', label: 'Job Logs', icon: 'work_history', iconColor: '#78909C' },
            { route: '/permit-builder/safe-works', label: 'Safe Works', icon: 'verified_user', iconColor: '#66BB6A', separator: true },
            { route: '/permit-builder/hot-works', label: 'Hot Works', icon: 'local_fire_department', iconColor: '#FF7043' },
            { route: '/permit-builder/confined-spaces', label: 'Confined Spaces', icon: 'sensor_door', iconColor: '#FFA726' },
            { route: '/permit-builder/jhas', label: 'JHAs', icon: 'health_and_safety', iconColor: '#26A69A' },
            { route: '/permit-builder/energized-work-permits', label: 'Energized Work', icon: 'bolt', iconColor: '#FFEE58' },
            { route: '/permit-builder/excavation-permits', label: 'Excavation', icon: 'landscape', iconColor: '#8D6E63' },
            { route: '/permit-builder/venting-permits', label: 'Venting/Purging', icon: 'air', iconColor: '#29B6F6' },
            { route: '/permit-builder/lotos', label: 'LOTO', icon: 'lock', iconColor: '#FFA726', separator: true },
            { route: '/scheduler', label: 'Scheduler', icon: 'calendar_month', iconColor: '#5C6BC0' }
        ]
    },
    {
        label: 'Visual Plant',
        icon: 'schema',
        color: '#66BB6A',
        defaultRoute: '/visual-plant/work-areas',
        requiresFullAccess: true,
        items: [
            { route: '/visual-plant/work-areas', label: 'Work Areas', icon: 'location_city', iconColor: '#66BB6A' },
            { route: '/visual-plant/work-area-map', label: 'Work Map', icon: 'map', iconColor: '#42A5F5' },
            { route: '/diagram-builder/list', label: 'Schematics', icon: 'account_tree', iconColor: '#FFA726', separator: true },
            { route: '/form-designer/forms', label: 'Form Designer', icon: 'dynamic_form', iconColor: '#AB47BC', separator: true },
            { route: '/form-designer/design', label: 'Form Design', icon: 'edit_note', iconColor: '#EF5350' },
            { route: '/form-designer/preview', label: 'Form Preview', icon: 'preview', iconColor: '#78909C' }
        ]
    },
    {
        label: 'Log',
        icon: 'forum',
        color: '#42A5F5',
        defaultRoute: '/log',
        requiresFullAccess: true,
        items: [
            { route: '/log/diagnostics', label: 'Diagnostics', icon: 'monitoring', iconColor: '#EF5350' },
            { route: '/log/table', label: 'System Log', icon: 'list_alt', iconColor: '#42A5F5' },
            { route: '/log/correspondence', label: 'Correspondence', icon: 'mail', iconColor: '#FFA726' },
            { route: '/log/messaging', label: 'Messages', icon: 'chat', iconColor: '#66BB6A' },
            { route: '/instrumentation', label: 'Instruments', icon: 'speed', iconColor: '#AB47BC' },
            { route: '/field-lists', label: 'Field Lists', icon: 'checklist_rtl', iconColor: '#26A69A' },
            { route: '/etapro', label: 'EtaPro Trends', icon: 'trending_up', iconColor: '#42A5F5' }
        ]
    },
    {
        label: 'Admin',
        icon: 'admin_panel_settings',
        color: '#AB47BC',
        defaultRoute: '/admin/users',
        requiresFullAccess: true,
        items: [
            { route: '/admin/users', label: 'User Management', icon: 'group', iconColor: '#5C6BC0' },
            { route: '/admin/access-management', label: 'Access Management', icon: 'security', iconColor: '#EF5350' },
            { route: '/backup', label: 'Backup', icon: 'backup', iconColor: '#66BB6A', separator: true },
            { route: '/sync', label: 'Sync Dashboard', icon: 'sync', iconColor: '#42A5F5' },
            { route: '/full-sync-to-server', label: 'Full Sync to Server', icon: 'cloud_upload', iconColor: '#26A69A' },
            { route: '/admin', label: 'Admin', icon: 'settings', iconColor: '#78909C', separator: true },
            { route: '/admin/work-category-profiles', label: 'Work Category Hazards', icon: 'category', iconColor: '#FF9800' },
            { route: '/e2e-test', label: 'E2E Test', icon: 'science', iconColor: '#E91E63', separator: true, testOnly: true }
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
    { label: 'LOTO Board', route: './loto-board' },
    { label: 'LOTO Usage', route: './loto-usage' },
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
