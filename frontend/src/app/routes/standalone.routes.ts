import { Routes } from '@angular/router';
import { TagNumberComponent } from '../pages/tag-number/tag-number.component';
import { PrintComponent } from '../pages/print/print.component';
import { BackupComponent } from '../pages/backup/backup.component';
import { AdminFunctionalitiesComponent } from '../pages/admin/admin-functionalities.component';
import { SyncDashboardComponent } from '../pages/sync-dashboard/sync-dashboard.component';
import { SyncAdminComponent } from '../pages/sync-admin/sync-admin.component';
import { SyncMonitorComponent } from '../pages/sync-monitor/sync-monitor.component';
import { SyncResyncComponent } from '../features/sync-resync/sync-resync.component';
import { SyncTestingComponent } from '../features/sync-testing/sync-testing.component';
import { FullSyncToServerComponent } from '../features/full-sync-to-server/full-sync-to-server.component';

export const STANDALONE_ROUTES: Routes = [
  { path: 'tag-number', component: TagNumberComponent },
  { path: 'print', component: PrintComponent },
  { path: 'backup', component: BackupComponent },
  { path: 'admin', component: AdminFunctionalitiesComponent },
  // Sync Dashboard (Status + Health & Recovery)
  {
    path: 'sync',
    component: SyncDashboardComponent,
    children: [
      { path: '', redirectTo: 'status', pathMatch: 'full' },
      { path: 'status', component: SyncMonitorComponent },
      { path: 'recovery', component: SyncResyncComponent }
    ]
  },
  // Sync Admin (Testing + Full Sync to Server)
  {
    path: 'sync-admin',
    component: SyncAdminComponent,
    children: [
      { path: '', redirectTo: 'testing', pathMatch: 'full' },
      { path: 'testing', component: SyncTestingComponent },
      { path: 'full-sync', component: FullSyncToServerComponent }
    ]
  },
  // Redirects for old bookmarked routes
  { path: 'sync-test', redirectTo: 'sync-admin/testing', pathMatch: 'full' },
  { path: 'sync-resync', redirectTo: 'sync/recovery', pathMatch: 'full' },
  { path: 'full-sync-to-server', redirectTo: 'sync-admin/full-sync', pathMatch: 'full' }
];
