export interface RouterMenuItem{
    route: string;
    label: string;
}

export type RouterMenuItems = RouterMenuItem[];

// The app's MAIN menu now lives in ./nav.model.ts — one declaration shared by the bottom nav and
// the top router menu, with each entry's section and access tier. The lists below are FEATURE-LOCAL
// sub-navigation, passed explicitly to <app-router-menu [menuItems]="...">.

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