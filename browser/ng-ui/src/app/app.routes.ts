import { Routes } from '@angular/router';

/*
 * Every screen is lazy-loaded. Eagerly importing the Tier-1 screens (work request, JHA, inventory,
 * SDS, instruments, field lists) pulled their whole dependency trees into the initial bundle — which
 * is the worst place for them, since those are the screens most often opened cold on plant cellular.
 * Guards stay eager: they're tiny and must run before the chunk is fetched.
 */
import { standaloneGuard } from './guards/standalone.guard';
import { welcomeGuard } from './guards/welcome.guard';
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
    {
      // The signed-out landing page. No welcomeGuard here — this IS where it sends people.
      path: 'welcome',
      loadComponent: () => import('./pages/welcome-page/welcome-page.component').then(m => m.WelcomePageComponent),
      canActivate: [standaloneGuard]
    },
    {
      // Safety information, deliberately public — see PlantInfoPageComponent.
      path: 'plant/emergency',
      loadComponent: () => import('./pages/plant-info-page/plant-info-page.component').then(m => m.PlantInfoPageComponent),
      data: { page: 'emergency' },
      canActivate: [standaloneGuard]
    },
    {
      // Site orientation. Public: it is reached by scanning a QR at the gate, before an account exists.
      path: 'plant/orientation',
      loadComponent: () => import('./pages/orientation-page/orientation-page.component').then(m => m.OrientationPageComponent),
      canActivate: [standaloneGuard]
    },
    {
      path: 'plant/contacts',
      loadComponent: () => import('./pages/plant-info-page/plant-info-page.component').then(m => m.PlantInfoPageComponent),
      data: { page: 'contacts' },
      canActivate: [standaloneGuard]
    },
    {
      // Equipment Finder — the one plant-gated entry in an otherwise contractor-facing section.
      // plantGuard (unlike the /qr scan route) because it is reached from a nav tile that is already
      // hidden from non-plant users, so a bounce here can only follow a hand-typed URL.
      path: 'plant/equipment-finder',
      loadComponent: () => import('./features/equipment-finder/equipment-finder-page.component').then(m => m.EquipmentFinderPageComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      // Reached from the plant nav. Guarded like the other plant surfaces: it is the same people in
      // the same places, and the readings are a safety record.
      path: 'plant/air-monitoring',
      loadComponent: () => import('./features/air-monitoring/air-monitoring-page.component')
        .then(m => m.AirMonitoringPageComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
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
      // welcomeGuard is deliberately ONLY here. Home is where someone opening the app cold arrives
      // ('' redirects to it), so it is the one place an explainer belongs. On any other route it
      // would override an explicit destination — which is exactly what broke the orientation QR.
      canActivate: [standaloneGuard, welcomeGuard]
    },
    {
      path: 'work-request',
      loadComponent: () => import('./pages/work-request-page/work-request-page.component').then(m => m.WorkRequestPageComponent),
      canActivate: [standaloneGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', loadComponent: () => import('./features/work-request/work-request.component').then(m => m.WorkRequestComponent) }
      ]
    },
    {
      path: 'jha',
      loadComponent: () => import('./pages/jha-page/jha-page.component').then(m => m.JhaPageComponent),
      canActivate: [standaloneGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', loadComponent: () => import('./features/jha/jha.component').then(m => m.JhaComponent) }
      ]
    },
    {
      path: 'my-permits',
      loadComponent: () => import('./pages/my-permits-page/my-permits-page.component').then(m => m.MyPermitsPageComponent),
      canActivate: [standaloneGuard, authGuard]
    },
    {
      path: 'my-permits/:id',
      loadComponent: () => import('./pages/permit-detail-page/permit-detail-page.component').then(m => m.PermitDetailPageComponent),
      canActivate: [standaloneGuard, authGuard]
    },
    {
      path: 'user-profile',
      loadComponent: () => import('./pages/user-profile-page/user-profile-page.component').then(m => m.UserProfilePageComponent),
      canActivate: [standaloneGuard, authGuard]
    },
    {
      path: 'messages',
      loadComponent: () => import('./pages/messages-page/messages-page.component').then(m => m.MessagesPageComponent),
      canActivate: [standaloneGuard, authGuard]
    },
    {
      // Personnel section — schedule + contacts (chat sub-tab planned as Stage 3 of plant-chat).
      // Gated to plant-affiliated groups (Admin/Plant/NAES/JPower); contractors redirected.
      path: 'personnel',
      loadComponent: () => import('./pages/personnel-page/personnel-page.component').then(m => m.PersonnelPageComponent),
      canActivate: [standaloneGuard, authGuard, plantGroupGuard]
    },
    {
      path: 'field-lists',
      loadComponent: () => import('./pages/field-list-page/field-list-page.component').then(m => m.FieldListPageComponent),
      canActivate: [standaloneGuard, authGuard, insulationGuard],
      children: [
        // Empty child forwards to /form so ?type= / ?view= query params reach the
        // FieldListComponent's ngOnInit, which routes into the create-form or
        // open-items mode. Bare-URL (no query) landing on /field-lists/form now
        // renders the legacy select-mode cards — kept only for compat; the back
        // button and every nav tile bypass it. See backToSelect() for the
        // sub-section home used on back-navigation.
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', loadComponent: () => import('./features/field-list/field-list.component').then(m => m.FieldListComponent) }
      ]
    },
    {
      path: 'inventory',
      loadComponent: () => import('./pages/inventory-page/inventory-page.component').then(m => m.InventoryPageComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent) }
      ]
    },
    {
      path: 'sds',
      loadComponent: () => import('./pages/sds-page/sds-page.component').then(m => m.SdsPageComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', loadComponent: () => import('./features/sds/sds.component').then(m => m.SdsComponent) }
      ]
    },
    {
      path: 'sds-audit',
      loadComponent: () => import('./pages/sds-audit-page/sds-audit-page.component').then(m => m.SdsAuditPageComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', loadComponent: () => import('./features/sds-audit/sds-audit.component').then(m => m.SdsAuditComponent) }
      ]
    },
    {
      path: 'loto-standards',
      loadComponent: () => import('./features/loto-standard/loto-standards-list.component').then(m => m.LotoStandardsListComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      // Create-a-standard route BEFORE the :id catchall — otherwise "new" would be parsed as an id.
      path: 'loto-standards/new',
      loadComponent: () => import('./features/loto-standard/loto-standard-create.component').then(m => m.LotoStandardCreateComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'loto-standards/:id/edit',
      loadComponent: () => import('./features/loto-standard/loto-standard-create.component').then(m => m.LotoStandardCreateComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'loto-standards/:id',
      loadComponent: () => import('./features/loto-standard/loto-standard-detail.component').then(m => m.LotoStandardDetailComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'loto-standards/:id/walkdown',
      loadComponent: () => import('./features/loto-standard/loto-standard-walkdown.component').then(m => m.LotoStandardWalkdownComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      // Standard-independent walkdown of a PILE of LOTO points (pick standards / a location / a
      // system → walk them down). Uses the same summary+dialog UX as the standard walkdown
      // but saves per-tap and treats Pass/Fail as session-only.
      path: 'loto-points-walkdown',
      loadComponent: () => import('./features/loto-standard/loto-points-walkdown.component').then(m => m.LotoPointsWalkdownComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      // Create a new LOTO Point. Accepts ?addToStandard=<id> to attach the saved point to that
      // standard in one round-trip (used by the standard-detail "add point" flow).
      path: 'loto-points/new',
      loadComponent: () => import('./features/loto-standard/loto-point-create.component').then(m => m.LotoPointCreateComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'loto-points/:id/edit',
      loadComponent: () => import('./features/loto-standard/loto-point-create.component').then(m => m.LotoPointCreateComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      // Where a scanned LOTO/equipment label lands: the hub's public /qr/{tag} redirects here.
      // authGuard (not plantGuard) on purpose — plantGuard bounces silently to Home, and a QR scan
      // that ends on an unexplained home screen is indistinguishable from a broken label. The API is
      // still ROLE_PLANT-gated; the page turns that 403 into a sentence the scanner can act on.
      path: 'qr/:tag',
      loadComponent: () => import('./features/qr/qr-tag-page.component').then(m => m.QrTagPageComponent),
      canActivate: [standaloneGuard, authGuard]
    },
    {
      path: 'loto',
      loadComponent: () => import('./features/loto-permit/loto-permit-list.component').then(m => m.LotoPermitListComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      // Read-only permit view. Where the list sends a permit with no phase available — Building before
      // CA approval, or Active with nothing left to do. Same component as hang/verify, actions withheld.
      path: 'loto/:id',
      loadComponent: () => import('./features/loto-permit/loto-permit-phase.component').then(m => m.LotoPermitPhaseComponent),
      data: { mode: 'VIEW' },
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'loto/:id/hang',
      loadComponent: () => import('./features/loto-permit/loto-permit-phase.component').then(m => m.LotoPermitPhaseComponent),
      data: { mode: 'HANG' },
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'loto/:id/verify',
      loadComponent: () => import('./features/loto-permit/loto-permit-phase.component').then(m => m.LotoPermitPhaseComponent),
      data: { mode: 'VERIFY' },
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'loto/:id/walkdown',
      loadComponent: () => import('./features/loto-permit/loto-permit-walkdown.component').then(m => m.LotoPermitWalkdownComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo',
      loadComponent: () => import('./features/maximo/maximo-page.component').then(m => m.MaximoPageComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo/new-request',
      loadComponent: () => import('./features/maximo/maximo-sr-create.component').then(m => m.MaximoSrCreateComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo/pm',
      loadComponent: () => import('./features/maximo/maximo-pm-page.component').then(m => m.MaximoPmPageComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo/grabbed',
      loadComponent: () => import('./features/maximo/maximo-grabbed-page.component').then(m => m.MaximoGrabbedPageComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo/parts',
      loadComponent: () => import('./features/maximo/maximo-parts-page.component').then(m => m.MaximoPartsPageComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo/outage',
      loadComponent: () => import('./features/maximo/maximo-outage-page.component').then(m => m.MaximoOutagePageComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo/toi',
      loadComponent: () => import('./features/maximo/maximo-toi-page.component').then(m => m.MaximoToiPageComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'maximo/ammonia',
      loadComponent: () => import('./features/maximo/maximo-ammonia-page.component').then(m => m.MaximoAmmoniaPageComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'rounds',
      loadComponent: () => import('./features/rounds/rounds-list.component').then(m => m.RoundsListComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'rounds/issues',
      loadComponent: () => import('./features/rounds/round-issues.component').then(m => m.RoundIssuesComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'rounds/:id/perform',
      loadComponent: () => import('./features/rounds/round-perform.component').then(m => m.RoundPerformComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      path: 'qualifications/:userId',
      loadComponent: () => import('./features/qualifications/qualification-lookup.component').then(m => m.QualificationLookupComponent)
    },
    {
      path: 'qualification-management',
      loadComponent: () => import('./features/qualifications/qualification-management.component').then(m => m.QualificationManagementComponent),
      canActivate: [standaloneGuard, authGuard, plantGuard]
    },
    {
      // Instrumentation. Search IS the landing screen (no chooser), and each instrument has its own
      // URL so a QR sticker on the device can deep-link straight to its log form. `new` must precede
      // `:tag` — first match wins, and otherwise "new" would resolve as a tag.
      path: 'instruments',
      loadComponent: () => import('./pages/instrument-page/instrument-page.component').then(m => m.InstrumentPageComponent),
      canActivate: [standaloneGuard, authGuard, instrumentationGuard],
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
      canActivate: [standaloneGuard, authGuard, insulationGuard]
    }
];
