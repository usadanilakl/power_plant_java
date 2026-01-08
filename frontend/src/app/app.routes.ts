import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

// Feature routes
import { FILE_ROUTES } from './routes/file.routes';
import { LOTO_ROUTES } from './routes/loto.routes';
import { LOTO_POINTS_ROUTES } from './routes/loto-points.routes';
import { PERMIT_BUILDER_ROUTES } from './routes/permit-builder.routes';
import { SCHEDULER_ROUTES } from './routes/scheduler.routes';
import { FORM_DESIGNER_ROUTES } from './routes/form-designer.routes';
import { STANDALONE_ROUTES } from './routes/standalone.routes';

export const routes: Routes = [
  // Home page as default
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  // Feature routes
  ...FILE_ROUTES,
  ...LOTO_ROUTES,
  ...LOTO_POINTS_ROUTES,
  ...PERMIT_BUILDER_ROUTES,
  ...SCHEDULER_ROUTES,
  ...FORM_DESIGNER_ROUTES,
  ...STANDALONE_ROUTES
];
