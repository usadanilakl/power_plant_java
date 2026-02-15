# Restricted Access

## Overview

External authenticated users without an approved `ACCESS_TOKEN` grant are in the **restricted** access tier. The system is **secure by default** — all endpoints require full access unless explicitly opted in via the `@RestrictedAllowed` annotation or listed in the exempt prefixes.

The restricted area is designed to be extended incrementally: annotate backend controllers as needed, then update frontend navigation to expose those features.

## Two Mechanisms for Restricted Access

### 1. Exempt Prefixes (hardcoded in `AccessGrantFilter`)

These paths are always accessible to any authenticated user, regardless of access level:

- `/api/auth/` — login, logout, me, profile, access-status, request-access
- `/api/sharepoint-sync/`, `/power-automate/`, `/actuator/` — public/webhook endpoints
- Static resources (`/angular/`, `/assets/`, `/favicon`, etc.)
- LAN-only endpoints (`/api/sync/`, `/api/files/`, etc.) — handled by SecurityFilterChain IP check

### 2. `@RestrictedAllowed` Annotation (per-endpoint opt-in)

Controllers or methods annotated with `@RestrictedAllowed` are accessible to restricted external users. This is the primary mechanism for extending the restricted area.

**File:** `config/security/RestrictedAllowed.java`

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RestrictedAllowed {}
```

### How It Works

1. `AccessGrantFilter` receives a request from an external authenticated user
2. After checking exempt paths, localhost, and LAN bypasses, the filter resolves the target handler
3. Uses `RequestMappingHandlerMapping.getHandler(request)` to get the `HandlerMethod`
4. Checks for `@RestrictedAllowed`:
   - **Method-level** annotation checked first (takes priority)
   - **Class-level** annotation checked as fallback
5. If found → request passes through (restricted user can access)
6. If not found → proceeds to ACCESS_TOKEN validation (requires grant)
7. **Fails closed**: if handler resolution throws an exception, returns `false` (requires full access)

### Currently Annotated Controllers

| Controller | Path | Scope | Reason |
|------------|------|-------|--------|
| `RfValueController` | `/ng/rf-values/**` | Class-level | Reference data (categories/values) needed for UI dropdowns |
| `NgValueController` | `/ng/values/**` | Class-level | Legacy value endpoints also used by UI components |
| `AuthController` | `/api/auth/profile/sessions` | Method-level | User's own grant history needed for profile Sessions tab |

## Frontend Restricted Access

### Route Guard: `fullAccessGuard`

**File:** `frontend/src/app/guards/full-access.guard.ts`

Route guard that checks `user.accessLevel === 'FULL'`. If the user is restricted, redirects to `/home`. Applied to all feature route sets in `app.routes.ts`.

Pattern (same as `authGuard` and `adminGuard`):
```typescript
export const fullAccessGuard: CanActivateFn = (route, state) => {
    return authService.authChecked$.pipe(
        filter(checked => checked), take(1),
        switchMap(() => authService.currentUser$), take(1),
        map(user => {
            if (user && user.accessLevel === 'FULL') return true;
            router.navigate(['/home']);
            return false;
        })
    );
};
```

### Navigation Filtering

Menu groups and home page cards have a `requiresFullAccess?: boolean` flag. When the current user's `accessLevel !== 'FULL'`, items with `requiresFullAccess: true` are filtered out.

**Router menu** (`router-menu.component.ts`):
- `filteredGroupedMenu` computed signal filters `GROUPED_MAIN_MENU` by access level
- `activeGroup` uses the filtered menu

**Home page** (`home.component.ts`):
- `filteredGroupedCards` computed signal filters `GROUPED_HOME_NAVIGATION_CARDS` by access level

Both use `toSignal(authService.currentUser$)` for reactive access level tracking.

### Current Navigation State

All 6 groups are marked `requiresFullAccess: true`:
- Files, LOTO, Permits, Form Designer, Log, Admin

A restricted external user sees:
- **Nav bar**: Home link only (all groups hidden)
- **Home page**: empty card area
- **Profile**: accessible via user avatar dropdown in header
- **Access Request**: accessible via auth interceptor redirect or direct URL

### Routes Protected by `fullAccessGuard`

```
/permits-monitor          — authGuard + fullAccessGuard
FILE_ROUTES               — authGuard + fullAccessGuard
LOTO_ROUTES               — authGuard + fullAccessGuard
LOTO_POINTS_ROUTES        — authGuard + fullAccessGuard
PERMIT_BUILDER_ROUTES     — authGuard + fullAccessGuard
SCHEDULER_ROUTES          — authGuard + fullAccessGuard
FORM_DESIGNER_ROUTES      — authGuard + fullAccessGuard
STANDALONE_ROUTES         — authGuard + fullAccessGuard
LOG_ROUTES                — authGuard + fullAccessGuard
```

Routes **without** `fullAccessGuard` (accessible to restricted users):
```
/login                    — public
/home                     — authGuard
/profile                  — authGuard
/access-request           — authGuard
/admin/users              — authGuard + adminGuard
/admin/access-management  — authGuard + adminGuard
```

### Deferred Service Preloading

Services that preload data in their constructors (`RfValueService`, `RfLotoStandardStateService`) defer API calls until `accessLevel === 'FULL'`. This prevents 403 error floods for restricted users, since these services are injected by globally-rendered components.

## How to Extend the Restricted Area

To make a feature accessible to restricted external users:

### Backend

1. Add `@RestrictedAllowed` to the controller class (all methods) or specific methods:

```java
@RestController
@RequestMapping("/ng/my-feature")
@RestrictedAllowed  // All endpoints accessible to restricted users
public class MyFeatureController { ... }
```

Or per-method:
```java
@GetMapping("/public-data")
@RestrictedAllowed  // Only this method accessible
public ResponseEntity<?> getPublicData() { ... }
```

2. Verify: `mvn compile` passes

### Frontend

1. In `router-menu.model.ts` — remove `requiresFullAccess: true` from the relevant group in `GROUPED_MAIN_MENU`
2. In `navigation-card.model.ts` — remove `requiresFullAccess: true` from the matching group in `GROUPED_HOME_NAVIGATION_CARDS`
3. In `app.routes.ts` — remove `fullAccessGuard` from the relevant route set (keep `authGuard`)
4. Verify: `ng build` passes

### Example: Opening Permits to Restricted Users

```diff
// router-menu.model.ts
{
    label: 'Permits',
    icon: 'assignment',
    defaultRoute: '/permit-builder',
-   requiresFullAccess: true,
    items: [ ... ]
}

// navigation-card.model.ts
{
    label: 'Permits',
    description: 'Work permits, scheduling, and authorizations',
-   requiresFullAccess: true,
    items: [ ... ]
}

// app.routes.ts
- ...PERMIT_BUILDER_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard, fullAccessGuard] })),
+ ...PERMIT_BUILDER_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard] })),
```

Plus on backend: add `@RestrictedAllowed` to the permit controllers.

## Key Files

| File | Purpose |
|------|---------|
| `config/security/RestrictedAllowed.java` | The annotation |
| `config/security/AccessGrantFilter.java` | Checks annotation via `isRestrictedAllowed()` |
| `guards/full-access.guard.ts` | Frontend route guard |
| `models/ui/router-menu.model.ts` | `requiresFullAccess` flag on menu groups |
| `models/ui/navigation-card.model.ts` | `requiresFullAccess` flag on home cards |
| `shared/menu/router-menu/router-menu.component.ts` | `filteredGroupedMenu` computed |
| `pages/home/home.component.ts` | `filteredGroupedCards` computed |
| `app.routes.ts` | Guard assignments per route |
| `features/values/refactored/services/rf-value.service.ts` | Deferred preloading |
| `features/loto-standard/refactored/services/rf-loto-standard-state.service.ts` | Deferred preloading |
