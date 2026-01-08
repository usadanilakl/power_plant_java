# Navigation & Routing Refactor Plan

## Current State Analysis

### Issues Identified
1. **Home Page unused** - Root `/` redirects to `/file/edit`, home page component exists but is disabled
2. **Flat route structure** - All 50+ routes in single `app.routes.ts` file
3. **Nested route handling** - Uses conditional `@if(currentRoute === 'x')` pattern (brittle, not scalable)
4. **Duplicate layouts** - Both original and refactored `MainLayoutComponent` exist
5. **Menu/Route misalignment** - Menu items defined separately from routes (not DRY)
6. **Hardcoded navigation** - No dynamic menu generation from route config

### Current Route Groups
- `/file` - File management (2 children)
- `/loto` - LOTO main (6 children)
- `/loto-standard` - LOTO standards
- `/loto-builder` - LOTO builder
- `/loto-points` - LOTO points (2 children)
- `/permit-builder` - Permits (6 children)
- `/scheduler` - Scheduler (2 children)
- `/form-designer` - Form designer (3 children)
- `/tag-number`, `/print`, `/backup`, `/admin` - Standalone pages

---

## Improved Plan

### Phase 1: Route Organization (Split Routes by Feature)

**Goal:** Organize routes into feature-based files for maintainability.

**New File Structure:**
```
src/app/
├── app.routes.ts                    # Main routes (imports feature routes)
├── routes/
│   ├── file.routes.ts               # /file routes
│   ├── loto.routes.ts               # /loto routes
│   ├── loto-points.routes.ts        # /loto-points routes
│   ├── permit-builder.routes.ts     # /permit-builder routes
│   ├── scheduler.routes.ts          # /scheduler routes
│   └── form-designer.routes.ts      # /form-designer routes
```

**Implementation:**
1. Create `src/app/routes/` directory
2. Extract each feature's routes into dedicated files
3. Export routes as `const FEATURE_ROUTES: Routes = [...]`
4. Import and spread into main `app.routes.ts`

---

### Phase 2: Home Page with Card Navigation

**Goal:** Create a dashboard home page with card-based navigation to main sections.

**Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Main Menu (row)                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │    LOTO     │  │    FILES    │  │ LOTO POINTS │        │
│   │   [icon]    │  │   [icon]    │  │   [icon]    │        │
│   │  Manage     │  │  View &     │  │  All LOTO   │        │
│   │  lockout    │  │  edit files │  │  points     │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  PERMITS    │  │  SCHEDULER  │  │    FORMS    │        │
│   │   [icon]    │  │   [icon]    │  │   [icon]    │        │
│   │  Work       │  │  Schedule   │  │  Design     │        │
│   │  permits    │  │  tasks      │  │  forms      │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Components to Create/Modify:**
1. `NavigationCardComponent` - Reusable card with icon, title, description, route
2. `HomePageComponent` - Grid of navigation cards
3. Update root redirect from `/file/edit` to `/home`

**Card Model:**
```typescript
interface NavigationCard {
  title: string;
  description: string;
  icon: string;          // Material icon name or custom
  route: string;
  color?: string;        // Optional accent color
  children?: NavigationCard[];  // For showing sub-sections
}
```

---

### Phase 3: Improved Nested Route Handling

**Goal:** Replace brittle `@if(currentRoute === 'x')` with route-based component selection.

**Option A: Route Data Approach (Recommended)**
```typescript
// In routes
{
  path: 'jobs',
  component: JobLogComponent,
  data: {
    leftMenu: JobLogLeftMenuComponent,
    bottomMenu: JobLogBottomMenuComponent
  }
}

// In parent page template - use existing outlet components
<app-left-menu-outlet></app-left-menu-outlet>
```

**Option B: Named Router Outlets**
```typescript
// In routes
{
  path: 'jobs',
  component: JobLogComponent,
  outlet: 'primary'
},
{
  path: 'jobs',
  component: JobLogLeftMenuComponent,
  outlet: 'leftMenu'
}

// In template
<router-outlet name="leftMenu"></router-outlet>
<router-outlet></router-outlet>
```

**Recommendation:** Use Option A - it already exists (`LeftMenuOutletComponent`, `BottomMenuOutletComponent`) but is underutilized.

---

### Phase 4: Consolidate Layouts

**Goal:** Remove duplicate layout implementations.

**Action:**
1. Audit usage of original vs refactored `MainLayoutComponent`
2. Migrate all pages to refactored version (better mobile support)
3. Remove original layout
4. Rename refactored to main

---

### Phase 5: Dynamic Menu Generation (Optional Enhancement)

**Goal:** Generate menus from route configuration instead of hardcoded constants.

**Approach:**
```typescript
// In route config
{
  path: 'loto',
  data: {
    menu: { label: 'LOTO', icon: 'lock', order: 1 }
  },
  children: [...]
}

// MenuService builds menu from Router.config
@Injectable()
export class MenuService {
  getMainMenu(): MenuItem[] {
    return this.router.config
      .filter(route => route.data?.menu)
      .sort((a, b) => a.data.menu.order - b.data.menu.order)
      .map(route => ({
        label: route.data.menu.label,
        route: route.path,
        icon: route.data.menu.icon
      }));
  }
}
```

---

## Implementation Order

| Step | Task | Priority |
|------|------|----------|
| 1 | Create `routes/` directory and split routes by feature | High |
| 2 | Create `NavigationCardComponent` | High |
| 3 | Update `HomePageComponent` with card grid | High |
| 4 | Change root redirect to `/home` | High |
| 5 | Migrate nested route handling to route data approach | Medium |
| 6 | Consolidate layout components | Medium |
| 7 | Implement dynamic menu generation | Low |

---

## Files to Modify/Create

### New Files
- `src/app/routes/file.routes.ts`
- `src/app/routes/loto.routes.ts`
- `src/app/routes/loto-points.routes.ts`
- `src/app/routes/permit-builder.routes.ts`
- `src/app/routes/scheduler.routes.ts`
- `src/app/routes/form-designer.routes.ts`
- `src/app/shared/navigation-card/navigation-card.component.ts`
- `src/app/shared/navigation-card/navigation-card.component.html`
- `src/app/shared/navigation-card/navigation-card.component.scss`
- `src/app/models/ui/navigation-card.model.ts`

### Files to Modify
- `src/app/app.routes.ts` - Import feature routes, change redirect
- `src/app/pages/home/home-page.component.ts` - Add card grid
- `src/app/pages/home/home-page.component.html` - Card layout
- `src/app/pages/loto/loto-page.component.html` - Remove conditional rendering
- `src/app/pages/permit-builder/permit-builder-page.component.html` - Remove conditional rendering

---

## Benefits of This Approach

1. **Maintainability** - Feature routes in separate files, easier to find and modify
2. **Scalability** - Adding new sections doesn't require touching unrelated code
3. **User Experience** - Home page provides clear entry points to all features
4. **Code Quality** - Removes brittle string-based conditional rendering
5. **Consistency** - Single layout system across all pages
6. **DRY** - Menu items generated from route config (Phase 5)
