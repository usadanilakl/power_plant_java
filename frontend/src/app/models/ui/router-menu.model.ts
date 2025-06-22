export interface RouterMenuItem{
    route: string;
    label: string;
}

export type RouterMenuItems = RouterMenuItem[];

// Main menu items
export const MAIN_MENU_ITEMS: RouterMenuItems = [
    { route: '/', label: 'Home' },
    { route: '/loto', label: 'LOTO' },
    { route: '/loto-points', label: 'LOTO Points' },
    { route: '/tag-number', label: 'Create New Tag' },
    { route: '/pid', label: 'View P&IDs' },
    { route: '/print', label: 'Print' },
    { route: '/file-editor', label: 'Edit File' }
];

export const FILE_EDITOR_MENU_ITEMS: RouterMenuItems = [
    
];