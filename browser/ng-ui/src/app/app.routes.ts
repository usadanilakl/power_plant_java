import { Routes } from '@angular/router';

import { WorkRequestPageComponent } from './pages/work-request-page/work-request-page.component';
import { JhaPageComponent } from './pages/jha-page/jha-page.component';
import { WorkRequestComponent } from './features/work-request/work-request.component';
import { JhaComponent } from './features/jha/jha.component';
import { standaloneGuard } from './guards/standalone.guard';
import { SpacePageComponent } from './pages/space-page/space-page.component';
import { SpaceComponent } from './features/space/space.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
    {
      path: 'login',
      loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent)
    },
    {
      path: 'install',
      loadComponent: () => import('./pages/install-app-page/install-app-page.component').then(m => m.InstallAppPageComponent),
      canActivate: [standaloneGuard]
    },
    { path: '', redirectTo: '/work-request/form', pathMatch: 'full' },
    {
      path: 'work-request',
      component: WorkRequestPageComponent,
      canActivate: [standaloneGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: WorkRequestComponent }
      ]
    },
    {
      path: 'jha',
      component: JhaPageComponent,
      canActivate: [standaloneGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: JhaComponent }
      ]
    },
    {
      path: 'space',
      component: SpacePageComponent,
      canActivate: [standaloneGuard, authGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: SpaceComponent }
      ]
    },
];
