import { Routes } from '@angular/router';
import { TagNumberComponent } from '../pages/tag-number/tag-number.component';
import { PrintComponent } from '../pages/print/print.component';
import { BackupComponent } from '../pages/backup/backup.component';
import { AdminFunctionalitiesComponent } from '../pages/admin/admin-functionalities.component';
import { SyncDashboardComponent } from '../pages/sync-dashboard/sync-dashboard.component';
import { SyncMonitorComponent } from '../pages/sync-monitor/sync-monitor.component';
import { SyncResyncComponent } from '../features/sync-resync/sync-resync.component';
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
  // Full Sync to Server (standalone)
  { path: 'full-sync-to-server', component: FullSyncToServerComponent },
  // Redirects for old bookmarked routes
  { path: 'sync-admin/full-sync', redirectTo: 'full-sync-to-server', pathMatch: 'full' },
  { path: 'sync-resync', redirectTo: 'sync/recovery', pathMatch: 'full' }
];
