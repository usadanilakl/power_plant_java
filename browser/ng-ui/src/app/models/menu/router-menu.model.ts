export interface RouterMenuItem{
    route: string;
    label: string;
}

export type RouterMenuItems = RouterMenuItem[];

// Main menu items
// No-login "Quick Submit" tier — always available with just basic info.
// (SDS Audit, Messages, My Permits require sign-in and live on the Home grid.)
export const MAIN_MENU_ITEMS: RouterMenuItems = [
    { route: '/home', label: 'Home' },
    { route: '/work-request', label: 'Work Request' },
    { route: '/jha', label: 'JHA' },
    { route: '/instruments', label: 'Instrumentation' },
    { route: '/field-lists', label: 'Field Lists' },
    { route: '/inventory', label: 'Inventory' },
    { route: '/sds', label: 'SDS Chemicals' },
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
    { label: 'Existing Froms', route: './forms' },
    { label: 'Design New', route: './design' },
    { label: 'Preview', route: './perview' },
]