import { Routes } from '@angular/router';

import { WorkRequestPageComponent } from './pages/work-request-page/work-request-page.component';
import { JhaPageComponent } from './pages/jha-page/jha-page.component';
import { WorkRequestComponent } from './features/work-request/work-request.component';
import { JhaComponent } from './features/jha/jha.component';
import { standaloneGuard } from './guards/standalone.guard';
import { SpacePageComponent } from './pages/space-page/space-page.component';
import { SpaceComponent } from './features/space/space.component';
import { authGuard } from './auth/auth.guard';
import { UserComponent } from './auth/user/user.component';
import { UserPageComponent } from './pages/user-page/user-page.component';
import { UserProfilePageComponent } from './pages/user-profile-page/user-profile-page.component';
import { InstrumentPageComponent } from './pages/instrument-page/instrument-page.component';
import { InstrumentComponent } from './features/equipment/instrument/instrument.component';
import { QrScannerComponent } from './shared/qr-scanner/qr-scanner.component';
import { LotoPageComponent } from './pages/loto-page/loto-page.component';
import { LotoProcessorComponent } from './features/loto/loto-processor/loto-processor.component';
import { ImageComponent } from './shared/image/image.component';
import { TestPageComponent } from './pages/test-page/test-page.component';

export const routes: Routes = [
    {
      path: 'login',
      loadComponent: () => import('./pages/login-page/login-page.component').then(m => m.LoginPageComponent)
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
    {
      path: 'users',
      component: UserPageComponent,
      canActivate: [standaloneGuard, authGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: UserComponent }
      ]
    },
    {
      path: 'user-profile',
      component: UserProfilePageComponent,
      canActivate: [standaloneGuard, authGuard]
    },
    {
      path: 'instruments',
      component: InstrumentPageComponent,
      canActivate: [standaloneGuard],
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: InstrumentComponent }
      ]
    },
      {
        path: 'qr', // <-- Add this route
        component: QrScannerComponent
      },
    {
      path: 'loto',
      component: LotoPageComponent,
      canActivate: [standaloneGuard],
      children: [
        { path: '', redirectTo: 'process', pathMatch: 'full' },
        { path: 'process', component: LotoProcessorComponent }
      ]
    },
    {
      path: 'img',
      component: TestPageComponent,
      children: [
        { path: '', redirectTo: 'process', pathMatch: 'full' },
        { path: 'process', component: ImageComponent }
      ]
    },
];
