import { Routes } from '@angular/router';
import { LogPageComponent } from '../features/log/log-page/log-page.component';
import { LogDbTableComponent } from '../features/log/log-db-table/log-db-table.component';
import { CorrespondencePageComponent } from '../features/log/correspondence-page/correspondence-page.component';
import { MessagingPageComponent } from '../features/log/messaging-page/messaging-page.component';
import { LogDiagnosticsPageComponent } from '../features/log/log-diagnostics-page/log-diagnostics-page.component';
import { fullAccessGuard } from '../guards/full-access.guard';
import { logDiagnosticsGuard } from '../guards/log-diagnostics.guard';

export const LOG_ROUTES: Routes = [
  {
    path: 'log',
    component: LogPageComponent,
    children: [
      { path: '', redirectTo: 'table', pathMatch: 'full' },
      {
        path: 'diagnostics',
        component: LogDiagnosticsPageComponent,
        canActivate: [logDiagnosticsGuard],
      },
      { path: 'table', component: LogDbTableComponent, canActivate: [fullAccessGuard] },
      { path: 'correspondence', component: CorrespondencePageComponent, canActivate: [fullAccessGuard] },
      { path: 'messaging', component: MessagingPageComponent, canActivate: [fullAccessGuard] },
    ],
  },
];
