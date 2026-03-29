import { Routes } from '@angular/router';
import { TagNumberComponent } from '../pages/tag-number/tag-number.component';
import { PrintComponent } from '../pages/print/print.component';
import { BackupComponent } from '../pages/backup/backup.component';
import { AdminFunctionalitiesComponent } from '../pages/admin/admin-functionalities.component';
import { SyncDashboardComponent } from '../pages/sync-dashboard/sync-dashboard.component';
import { SyncMonitorComponent } from '../pages/sync-monitor/sync-monitor.component';
import { SyncResyncComponent } from '../features/sync-resync/sync-resync.component';
import { SharepointSyncComponent } from '../pages/sharepoint-sync/sharepoint-sync.component';
import { SyncOverviewComponent } from '../features/sync/sync-overview/sync-overview.component';
import { SyncActivityComponent } from '../features/sync/sync-activity/sync-activity.component';
import { SyncCompareComponent } from '../features/sync/sync-compare/sync-compare.component';
import { FullSyncToServerComponent } from '../features/full-sync-to-server/full-sync-to-server.component';
import { TrashComponent } from '../features/trash/trash.component';
import { CvManagerPageComponent } from '../features/values/refactored/components/cv-manager/cv-manager-page.component';
import { WorkCategoryProfileAdminComponent } from '../features/permit-builder/work-category-profile/work-category-profile-admin.component';

export const STANDALONE_ROUTES: Routes = [
  { path: 'tag-number', component: TagNumberComponent },
  { path: 'print', component: PrintComponent },
  { path: 'backup', component: BackupComponent },
  // Admin Dashboard with subroutes
  {
    path: 'admin',
    children: [
      { path: '', component: AdminFunctionalitiesComponent },
      { path: 'category-values', component: CvManagerPageComponent },
      { path: 'work-category-profiles', component: WorkCategoryProfileAdminComponent }
    ]
  },
  // Sync Dashboard (Status + Health & Recovery)
  {
    path: 'sync',
    component: SyncDashboardComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: SyncOverviewComponent },
      { path: 'activity', component: SyncActivityComponent },
      { path: 'compare', component: SyncCompareComponent },
      { path: 'status', component: SyncMonitorComponent },
      { path: 'recovery', component: SyncResyncComponent },
      { path: 'sharepoint', component: SharepointSyncComponent }
    ]
  },
  // Full Sync to Server (standalone)
  { path: 'full-sync-to-server', component: FullSyncToServerComponent },
  // Trash / Recycle Bin
  { path: 'trash', component: TrashComponent },
  // Redirects for old bookmarked routes
  { path: 'sync-admin/full-sync', redirectTo: 'full-sync-to-server', pathMatch: 'full' },
  { path: 'sync-resync', redirectTo: 'sync/recovery', pathMatch: 'full' }
];
