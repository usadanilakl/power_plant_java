import { Routes } from '@angular/router';

import { WorkRequestPageComponent } from './pages/work-request-page/work-request-page.component';
import { JhaPageComponent } from './pages/jha-page/jha-page.component';
import { WorkRequestComponent } from './features/work-request/work-request.component';
import { JhaComponent } from './features/jha/jha.component';
import { standaloneGuard } from './guards/standalone.guard';
import { userSetupGuard } from './guards/user-setup.guard';
import { InstrumentPageComponent } from './pages/instrument-page/instrument-page.component';
import { InstrumentComponent } from './features/equipment/instrument/instrument.component';
import { InstrumentFormComponent } from './features/equipment/instrument/instrument-form/instrument-form.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { FieldListPageComponent } from './pages/field-list-page/field-list-page.component';
import { FieldListComponent } from './features/field-list/field-list.component';
import { InventoryPageComponent } from './pages/inventory-page/inventory-page.component';
import { InventoryComponent } from './features/inventory/inventory.component';
import { SdsPageComponent } from './pages/sds-page/sds-page.component';
import { SdsComponent } from './features/sds/sds.component';
import { SdsAuditPageComponent } from './pages/sds-audit-page/sds-audit-page.component';
import { SdsAuditComponent } from './features/sds-audit/sds-audit.component';
import { authGuard } from './auth/auth.guard';
import { plantGuard } from './guards/plant.guard';

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
      path: 'home',
      component: HomePageComponent,
      canActivate: [standaloneGuard, userSetupGuard]
    },
    {
      path: 'work-request',
      component: WorkRequestPageComponent,
      canActivate: [standaloneGuard, userSetupGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: WorkRequestComponent }
      ]
    },
    {
      path: 'jha',
      component: JhaPageComponent,
      canActivate: [standaloneGuard, userSetupGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: JhaComponent }
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
      path: 'field-lists',
      component: FieldListPageComponent,
      canActivate: [standaloneGuard, userSetupGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: FieldListComponent }
      ]
    },
    {
      path: 'inventory',
      component: InventoryPageComponent,
      canActivate: [standaloneGuard, userSetupGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: InventoryComponent }
      ]
    },
    {
      path: 'sds',
      component: SdsPageComponent,
      canActivate: [standaloneGuard, userSetupGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: SdsComponent }
      ]
    },
    {
      path: 'sds-audit',
      component: SdsAuditPageComponent,
      canActivate: [standaloneGuard, userSetupGuard, authGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: SdsAuditComponent }
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
      path: 'instruments',
      component: InstrumentPageComponent,
      canActivate: [standaloneGuard, userSetupGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: InstrumentComponent },
        { path: 'new', component: InstrumentFormComponent }
      ]
    },
];
