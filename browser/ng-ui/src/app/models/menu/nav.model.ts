/**
 * The PWA's navigation map — ONE declaration of every destination, the section it belongs to, and
 * who may reach it. Mirrors project/TODO/pwa-auth.md.
 *
 * Before this, two menus each carried their own copy (MAIN_MENU_ITEMS for the top router menu and a
 * separate list inside bottom-nav) and the Home page carried a third. They drifted, which is why
 * Instruments was offered to everyone and then bounced off its guard, and why Insulation appeared in
 * no menu at all.
 *
 * Access here must mirror the route guards in app.routes.ts AND the hub rules in
 * SecurityConfigSpring. When they disagree the user is either shown a dead end or refused something
 * they hold the role for.
 */

/** Who may see an entry. Resolved by NavAccessService against the signed-in user. */
export type NavAccess =
  /** Anyone, signed in or not. */
  | 'public'
  /** Any signed-in account, including one pending admin approval. */
  | 'auth'
  /** Signed in with permissionLevel BASIC or OPERATOR. */
  | 'basic'
  /** ROLE_PLANT / ROLE_ADMIN. */
  | 'plant'
  /** Plant-affiliated groups: ADMIN / PLANT / NAES / JPOWER. */
  | 'plantGroup'
  /** ROLE_INSTRUMENTATION / ROLE_ADMIN — granted per user, NOT implied by PLANT. */
  | 'instrumentation'
  /** ROLE_INSULATION / ROLE_PLANT / ROLE_ADMIN. */
  | 'insulation'
  /** ROLE_SAFETY / ROLE_ADMIN — full access to qualifications; PLANT sees them read-only. */
  | 'safety';

export interface NavItem {
  label: string;
  icon: string;
  /** Internal router path. Absent only for externalUrlKey entries. */
  route?: string;
  /** Deep-link params selecting a tab / list type / mode on the target page. */
  queryParams?: Record<string, string>;
  /**
   * The target page does not read those params yet, so the link opens it on its default tab. Set so
   * the shortcut still works today and the remaining wiring stays greppable.
   */
  deepLinkPending?: boolean;
  /**
   * Destination fetched from the hub at runtime instead of compiled in — used where the URL carries
   * an access token that must not ship inside this publicly-hosted bundle.
   */
  externalUrlKey?: 'sdsEbinder';
  access: NavAccess;
  /**
   * Useless without the hub (reads live server data, no offline cache). Hidden while the hub is
   * unreachable rather than opening onto an error.
   */
  hubOnly?: boolean;
  /** Declared but not built yet — never rendered. Keeps the plan and the code in one place. */
  planned?: boolean;
}

export interface NavSection {
  /** Section label, and the heading used to group the "More" sheet. */
  label: string;
  icon: string;
  /** URL segment for the shared section landing page: /section/{slug}. */
  slug: string;
  items: NavItem[];
  planned?: boolean;
}

/**
 * Route of a section's landing page. One parameterised route serves all of them — a section page is
 * just "the visible items of this section as tiles", so ten near-identical components would be ten
 * places to forget an access rule.
 */
export function sectionRoute(section: { slug: string }): string {
  return `/section/${section.slug}`;
}

/**
 * Sections in menu order. A section is visible when at least one of its items is.
 *
 * Single-item sections (Rounds, Instrumentation) have no sub-section page of their own — they
 * navigate straight to the screen.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'SDS', icon: '🧪', slug: 'sds',
    items: [
      { label: 'eBinder', icon: '📖', externalUrlKey: 'sdsEbinder', access: 'auth', hubOnly: true },
      { label: 'Add New', icon: '➕', route: '/sds', access: 'plant' },
      { label: 'Audit', icon: '✅', route: '/sds-audit', access: 'plant' },
      { label: 'Full Inventory', icon: '📚', route: '/sds', queryParams: { view: 'inventory' }, access: 'plant', planned: true },
    ],
  },
  {
    // Contractor-facing plant information. Every entry here is new build.
    label: 'Plant', icon: '🏭', slug: 'plant',
    items: [
      { label: 'Orientation', icon: '🎓', route: '/plant/orientation', access: 'public' },
      { label: 'Map', icon: '🗺️', route: '/plant/map', access: 'public', planned: true },
      { label: 'Emergency', icon: '🚨', route: '/plant/emergency', access: 'public' },
      { label: 'Contacts & Information', icon: '📇', route: '/plant/contacts', access: 'public' },
    ],
  },
  {
    label: 'Permits', icon: '🛡️', slug: 'permits',
    items: [
      { label: 'Work Request', icon: '📋', route: '/work-request', access: 'public' },
      { label: 'JHA', icon: '⚠️', route: '/jha', access: 'public' },
      { label: 'My Permits', icon: '🗂️', route: '/my-permits', access: 'basic', hubOnly: true },
      { label: 'Messages', icon: '💬', route: '/messages', access: 'auth', hubOnly: true },
      { label: 'LOTO', icon: '🔒', route: '/loto', access: 'plant', hubOnly: true },
      { label: 'LOTO Standards', icon: '📚', route: '/loto-standards', access: 'plant', hubOnly: true },
    ],
  },
  {
    label: 'Maximo', icon: '🏗️', slug: 'maximo',
    items: [
      { label: 'Work Orders', icon: '🔧', route: '/maximo', queryParams: { tab: 'wo' }, access: 'plant', hubOnly: true },
      { label: 'Requests', icon: '📨', route: '/maximo', queryParams: { tab: 'sr' }, access: 'plant', hubOnly: true },
      { label: 'PMs', icon: '🗓️', route: '/maximo/pm', access: 'plant', hubOnly: true },
      { label: 'Parts', icon: '📦', route: '/maximo/parts', access: 'plant', hubOnly: true },
    ],
  },
  {
    label: 'Personnel', icon: '👥', slug: 'personnel',
    items: [
      { label: 'Schedule', icon: '📅', route: '/personnel', queryParams: { tab: 'schedule' }, access: 'plantGroup', hubOnly: true },
      { label: 'Contacts', icon: '📇', route: '/personnel', queryParams: { tab: 'contacts' }, access: 'plantGroup', hubOnly: true },
      { label: 'Chat', icon: '💬', route: '/personnel', queryParams: { tab: 'chat' }, access: 'plantGroup', hubOnly: true },
      { label: 'Contractors', icon: '🦺', route: '/personnel', queryParams: { tab: 'contractors' }, access: 'plantGroup', hubOnly: true },
    ],
  },
  {
    label: 'Rounds', icon: '🔁', slug: 'rounds',
    items: [
      { label: 'Rounds', icon: '🔁', route: '/rounds', access: 'plant', hubOnly: true },
    ],
  },
  {
    // PLANT reads; SAFETY (new role) edits. The read/write split is enforced server-side too.
    label: 'Qualifications', icon: '🏷️', slug: 'qualifications',
    items: [
      { label: 'People', icon: '👤', route: '/qualification-management', queryParams: { tab: 'people' }, access: 'plant', hubOnly: true },
      { label: 'Quals', icon: '🏷️', route: '/qualification-management', queryParams: { tab: 'catalog' }, access: 'plant', hubOnly: true },
      { label: 'Reports', icon: '📊', route: '/qualification-management', queryParams: { tab: 'report' }, access: 'plant', hubOnly: true },
    ],
  },
  {
    label: 'Instrumentation', icon: '🔧', slug: 'instrumentation',
    items: [
      { label: 'Instrumentation', icon: '🔧', route: '/instruments', access: 'instrumentation' },
    ],
  },
  {
    // Sub-items are field-list TYPES, which the hub serves (FieldListComponent.listTypeOptions).
    // They are named here so they can be promoted as shortcuts; these names must stay in step with
    // the server's list-type values.
    label: 'Field List', icon: '📝', slug: 'field-list',
    items: [
      { label: 'Insulation Removal', icon: '🧯', route: '/field-lists', queryParams: { type: 'Insulation Removal' }, access: 'insulation' },
      { label: 'Insulation Installation', icon: '🧱', route: '/field-lists', queryParams: { type: 'Insulation Installation' }, access: 'insulation' },
      { label: 'Leaks', icon: '💧', route: '/field-lists', queryParams: { type: 'Leaks' }, access: 'insulation' },
      { label: 'Winterization', icon: '❄️', route: '/field-lists', queryParams: { type: 'Winterization' }, access: 'insulation' },
      { label: 'Open Items', icon: '📂', route: '/insulation', access: 'insulation', hubOnly: true },
    ],
  },
  {
    label: 'Inventory', icon: '📦', slug: 'inventory',
    items: [
      { label: 'Scan', icon: '📷', route: '/inventory', queryParams: { mode: 'scan' }, access: 'plant' },
      { label: 'Add New Item', icon: '➕', route: '/inventory', queryParams: { mode: 'new' }, access: 'plant' },
      { label: 'View Inventory', icon: '📋', route: '/inventory', queryParams: { mode: 'list' }, access: 'plant' },
    ],
  },
];

/** Always-present entries that sit outside the section structure. */
export const NAV_HOME: NavItem = { label: 'Home', icon: '🏠', route: '/home', access: 'public' };
export const NAV_PROFILE: NavItem = { label: 'Profile', icon: '👤', route: '/user-profile', access: 'auth' };

/**
 * Stable identity for one nav entry — used to persist shortcut ordering.
 *
 * The route alone is NOT unique: several sub-sections deep-link into the same page with different
 * params (Maximo Work Orders vs Requests, the field-list types, the inventory modes), so keying on
 * route would make them collide in the saved order.
 */
export function navKeyOf(item: NavItem): string {
  const base = item.route ?? `ext:${item.externalUrlKey ?? item.label}`;
  const params = item.queryParams
    ? Object.keys(item.queryParams).sort().map(k => `${k}=${item.queryParams![k]}`).join('&')
    : '';
  return params ? `${base}?${params}` : base;
}
