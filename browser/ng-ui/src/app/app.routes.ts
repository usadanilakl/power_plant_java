import { Routes } from '@angular/router';

/*
 * Every screen is lazy-loaded. Eagerly importing the Tier-1 screens (work request, JHA, inventory,
 * SDS, instruments, field lists) pulled their whole dependency trees into the initial bundle — which
 * is the worst place for them, since those are the screens most often opened cold on plant cellular.
 * Guards stay eager: they're tiny and must run before the chunk is fetched.
 */
import { standaloneGuard } from './guards/standalone.guard';
import { userSetupGuard } from './guards/user-setup.guard';
import { authGuard } from './auth/auth.guard';
import { plantGuard } from './guards/plant.guard';
import { plantGroupGuard } from './guards/plant-group.guard';
import { instrumentationGuard } from './guards/instrumentation.guard';
import { insulationGuard } from './guards/insulation.guard';

export const routes: Routes = [
    {
      path: 'login',
      loadComponent: () => import('./pages/login-page/login-page.component').then(m => m.LoginPageComponent),
      canActivate: [standaloneGuard]
    },
    {
      path: 'reset-password',
      loadComponent: () => import('./pages/reset-password-page/reset-password-page.component').then(m => m.ResetPasswordPageComponent),
      canActivate: [standaloneGuard]
    },
    {
      path: 'install',
      loadComponent: () => import('./pages/install-app-page/install-app-page.component').then(m => m.InstallAppPageComponent),
      canActivate: [standaloneGuard]
    },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    {
      // One landing page for every section, parameterised by slug. Access is enforced by the
      // section's own items (NavAccessService) — an empty section renders the "not available" note
      // rather than leaking what exists.
      path: 'section/:slug',
      loadComponent: () => import('./pages/section-page/section-page.component').then(m => m.SectionPageComponent),
      canActivate: [standaloneGuard]
    },
    {
      path: 'home',
      loadComponent: () => import('./pages/home-page/home-page.component').then(m => m.HomePageComponent),
      canActivate: [standaloneGuard, userSetupGuard]
    },
    {
      path: 'work-request',
      loadComponent: () => import('./pages/work-request-page/work-request-page.component').then(m => m.WorkRequestPageComponent),
      canActivate: [standaloneGuard, userSetupGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', loadComponent: () => import('./features/work-request/work-request.component').then(m => m.WorkRequestComponent) }
      ]
    },
    {
      path: 'jha',
      loadComponent: () => import('./pages/jha-page/jha-page.component').then(m => m.JhaPageComponent),
      canActivate: [standaloneGuard, userSetupGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', loadComponent: () => import('./features/jha/jha.component').then(m => m.JhaComponent) }
      ]
    },
    {
      path: 'my-permits',
      loadComponent: () => import('./pages/my-permits-page/my-permits-page.component').then(m => m.MyPermitsPageComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard]
    },
    {
      path: 'my-permits/:id',
      loadComponent: () => import('./pages/permit-detail-page/permit-detail-page.component').then(m => m.PermitDetailPageComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard]
    },
    {
      path: 'user-profile',
      loadComponent: () => import('./pages/user-profile-page/user-profile-page.component').then(m => m.UserProfilePageComponent),
      canActivate: [standaloneGuard, userSetupGuard]
    },
    {
      path: 'messages',
      loadComponent: () => import('./pages/messages-page/messages-page.component').then(m => m.MessagesPageComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard]
    },
    {
      // Personnel section — schedule + contacts (chat sub-tab planned as Stage 3 of plant-chat).
      // Gated to plant-affiliated groups (Admin/Plant/NAES/JPower); contractors redirected.
      path: 'personnel',
      loadComponent: () => import('./pages/personnel-page/personnel-page.component').then(m => m.PersonnelPageComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGroupGuard]
    },
    {
      path: 'field-lists',
      loadComponent: () => import('./pages/field-list-page/field-list-page.component').then(m => m.FieldListPageComponent),
      canActivate: [standaloneGuard, userSetupGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', loadComponent: () => import('./features/field-list/field-list.component').then(m => m.FieldListComponent) }
      ]
    },
    {
      path: 'inventory',
      loadComponent: () => import('./pages/inventory-page/inventory-page.component').then(m => m.InventoryPageComponent),
      canActivate: [standaloneGuard, userSetupGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent) }
      ]
    },
    {
      path: 'sds',
      loadComponent: () => import('./pages/sds-page/sds-page.component').then(m => m.SdsPageComponent),
      canActivate: [standaloneGuard, userSetupGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', loadComponent: () => import('./features/sds/sds.component').then(m => m.SdsComponent) }
      ]
    },
    {
      path: 'sds-audit',
      loadComponent: () => import('./pages/sds-audit-page/sds-audit-page.component').then(m => m.SdsAuditPageComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', loadComponent: () => import('./features/sds-audit/sds-audit.component').then(m => m.SdsAuditComponent) }
      ]
    },
    {
      path: 'loto-standards',
      loadComponent: () => import('./features/loto-standard/loto-standards-list.component').then(m => m.LotoStandardsListComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'loto-standards/:id',
      loadComponent: () => import('./features/loto-standard/loto-standard-detail.component').then(m => m.LotoStandardDetailComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'loto-standards/:id/walkdown',
      loadComponent: () => import('./features/loto-standard/loto-standard-walkdown.component').then(m => m.LotoStandardWalkdownComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'loto',
      loadComponent: () => import('./features/loto-permit/loto-permit-list.component').then(m => m.LotoPermitListComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'loto/:id/hang',
      loadComponent: () => import('./features/loto-permit/loto-permit-phase.component').then(m => m.LotoPermitPhaseComponent),
      data: { mode: 'HANG' },
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'loto/:id/verify',
      loadComponent: () => import('./features/loto-permit/loto-permit-phase.component').then(m => m.LotoPermitPhaseComponent),
      data: { mode: 'VERIFY' },
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'loto/:id/walkdown',
      loadComponent: () => import('./features/loto-permit/loto-permit-walkdown.component').then(m => m.LotoPermitWalkdownComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo',
      loadComponent: () => import('./features/maximo/maximo-page.component').then(m => m.MaximoPageComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo/new-request',
      loadComponent: () => import('./features/maximo/maximo-sr-create.component').then(m => m.MaximoSrCreateComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo/pm',
      loadComponent: () => import('./features/maximo/maximo-pm-page.component').then(m => m.MaximoPmPageComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo/grabbed',
      loadComponent: () => import('./features/maximo/maximo-grabbed-page.component').then(m => m.MaximoGrabbedPageComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo/parts',
      loadComponent: () => import('./features/maximo/maximo-parts-page.component').then(m => m.MaximoPartsPageComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'rounds',
      loadComponent: () => import('./features/rounds/rounds-list.component').then(m => m.RoundsListComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'rounds/issues',
      loadComponent: () => import('./features/rounds/round-issues.component').then(m => m.RoundIssuesComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'rounds/:id/perform',
      loadComponent: () => import('./features/rounds/round-perform.component').then(m => m.RoundPerformComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      path: 'qualifications/:userId',
      loadComponent: () => import('./features/qualifications/qualification-lookup.component').then(m => m.QualificationLookupComponent)
    },
    {
      path: 'qualification-management',
      loadComponent: () => import('./features/qualifications/qualification-management.component').then(m => m.QualificationManagementComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, plantGuard]
    },
    {
      // Instrumentation. Search IS the landing screen (no chooser), and each instrument has its own
      // URL so a QR sticker on the device can deep-link straight to its log form. `new` must precede
      // `:tag` — first match wins, and otherwise "new" would resolve as a tag.
      path: 'instruments',
      loadComponent: () => import('./pages/instrument-page/instrument-page.component').then(m => m.InstrumentPageComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, instrumentationGuard],
      children: [
        { path: '', loadComponent: () => import('./features/equipment/instrument/instrument-search/instrument-search.component').then(m => m.InstrumentSearchComponent) },
        { path: 'new', loadComponent: () => import('./features/equipment/instrument/instrument-create/instrument-create.component').then(m => m.InstrumentCreateComponent) },
        // Pre-rework links pointed at /instruments/form; keep them landing somewhere sensible.
        { path: 'form', redirectTo: '', pathMatch: 'full' },
        { path: ':tag', loadComponent: () => import('./features/equipment/instrument/instrument-detail/instrument-detail.component').then(m => m.InstrumentDetailComponent) }
      ]
    },
    {
      // Insulation contractor queue. Simple flat list — no chooser, no nested routes. The guard
      // gate matches the hub's /api/pwa/secured/insulation/** rule (ROLE_INSULATION or supervisor).
      path: 'insulation',
      loadComponent: () => import('./features/insulation/insulation-page.component').then(m => m.InsulationPageComponent),
      canActivate: [standaloneGuard, userSetupGuard, authGuard, insulationGuard]
    }
];
