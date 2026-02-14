import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PermitsMonitorComponent } from './features/permit-builder/permits-monitor/permits-monitor.component';
import { LoginComponent } from './features/auth/login/login.component';
import { AccessRequestComponent } from './features/auth/access-request/access-request.component';
import { AdminAccessComponent } from './features/auth/admin-access/admin-access.component';
import { ProfileComponent } from './features/auth/profile/profile.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

// Feature routes
import { FILE_ROUTES } from './routes/file.routes';
import { LOTO_ROUTES } from './routes/loto.routes';
import { LOTO_POINTS_ROUTES } from './routes/loto-points.routes';
import { PERMIT_BUILDER_ROUTES } from './routes/permit-builder.routes';
import { SCHEDULER_ROUTES } from './routes/scheduler.routes';
import { FORM_DESIGNER_ROUTES } from './routes/form-designer.routes';
import { STANDALONE_ROUTES } from './routes/standalone.routes';
import { LOG_ROUTES } from './routes/log.routes';

export const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent },

  // Auth-protected routes
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'permits-monitor', component: PermitsMonitorComponent, canActivate: [authGuard] },
  { path: 'access-request', component: AccessRequestComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  // Admin routes
  { path: 'admin/access-management', component: AdminAccessComponent, canActivate: [authGuard, adminGuard] },

  // Feature routes (all protected)
  ...FILE_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard] })),
  ...LOTO_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard] })),
  ...LOTO_POINTS_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard] })),
  ...PERMIT_BUILDER_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard] })),
  ...SCHEDULER_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard] })),
  ...FORM_DESIGNER_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard] })),
  ...STANDALONE_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard] })),
  ...LOG_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard] }))
];
