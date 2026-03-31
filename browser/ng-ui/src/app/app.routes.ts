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
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
    {
      path: 'login',
      loadComponent: () => import('./pages/login-page/login-page.component').then(m => m.LoginPageComponent),
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
