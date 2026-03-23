import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PermitsMonitorComponent } from './features/permit-builder/permits-monitor/permits-monitor.component';
import { LoginComponent } from './features/auth/login/login.component';
import { AccessRequestComponent } from './features/auth/access-request/access-request.component';
import { AdminAccessComponent } from './features/auth/admin-access/admin-access.component';
import { UserManagementComponent } from './features/admin/user-management/user-management.component';
import { ProfileComponent } from './features/auth/profile/profile.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { QrEquipmentViewerComponent } from './features/qr/qr-equipment-viewer/qr-equipment-viewer.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { fullAccessGuard } from './guards/full-access.guard';

// Feature routes
import { FILE_ROUTES } from './routes/file.routes';
import { LOTO_ROUTES } from './routes/loto.routes';
import { LOTO_POINTS_ROUTES } from './routes/loto-points.routes';
import { PERMIT_BUILDER_ROUTES } from './routes/permit-builder.routes';
import { SCHEDULER_ROUTES } from './routes/scheduler.routes';
import { FORM_DESIGNER_ROUTES } from './routes/form-designer.routes';
import { STANDALONE_ROUTES } from './routes/standalone.routes';
import { LOG_ROUTES } from './routes/log.routes';
import { INSTRUMENTATION_ROUTES } from './routes/instrumentation.routes';
import { DIAGRAM_BUILDER_ROUTES } from './routes/diagram-builder.routes';
import { VISUAL_PLANT_ROUTES } from './routes/visual-plant.routes';

export const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // Accessible to all authenticated users (including restricted external)
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'access-request', component: AccessRequestComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  // QR code scanned traffic (restricted access — no fullAccessGuard)
  { path: 'qr/equipment/:tagNumber', component: QrEquipmentViewerComponent, canActivate: [authGuard] },

  // Admin routes
  { path: 'admin/users', component: UserManagementComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/access-management', component: AdminAccessComponent, canActivate: [authGuard, adminGuard] },

  // Full-access feature routes (restricted users redirected to /home)
  { path: 'permits-monitor', component: PermitsMonitorComponent, canActivate: [authGuard, fullAccessGuard] },
  ...FILE_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard, fullAccessGuard] })),
  ...LOTO_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard, fullAccessGuard] })),
  ...LOTO_POINTS_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard, fullAccessGuard] })),
  ...PERMIT_BUILDER_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard, fullAccessGuard] })),
  ...SCHEDULER_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard, fullAccessGuard] })),
  ...FORM_DESIGNER_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard, fullAccessGuard] })),
  ...STANDALONE_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard, fullAccessGuard] })),
  ...LOG_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard, fullAccessGuard] })),
  ...INSTRUMENTATION_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard, fullAccessGuard] })),
  ...DIAGRAM_BUILDER_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard, fullAccessGuard] })),
  ...VISUAL_PLANT_ROUTES.map(r => r.redirectTo ? r : ({ ...r, canActivate: [authGuard, fullAccessGuard] }))
];
