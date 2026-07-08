import { Routes } from '@angular/router';
import { TagNumberComponent } from '../pages/tag-number/tag-number.component';
import { PrintComponent } from '../pages/print/print.component';
import { BackupComponent } from '../pages/backup/backup.component';
import { AdminFunctionalitiesComponent } from '../pages/admin/admin-functionalities.component';
import { AdminFilesComponent } from '../pages/admin/tabs/admin-files.component';
import { AdminLotoComponent } from '../pages/admin/tabs/admin-loto.component';
import { AdminSyncComponent } from '../pages/admin/tabs/admin-sync.component';
import { AdminSharepointComponent } from '../pages/admin/tabs/admin-sharepoint.component';
import { AdminFormsComponent } from '../pages/admin/tabs/admin-forms.component';
import { AdminMigrationComponent } from '../pages/admin/tabs/admin-migration.component';
import { AdminSdsComponent } from '../pages/admin/tabs/admin-sds.component';
import { AdminDbHealthComponent } from '../pages/admin/tabs/admin-db-health.component';
import { SyncDashboardComponent } from '../pages/sync-dashboard/sync-dashboard.component';
import { SyncMonitorComponent } from '../pages/sync-monitor/sync-monitor.component';
import { SyncResyncComponent } from '../features/sync-resync/sync-resync.component';
import { SharepointSyncComponent } from '../pages/sharepoint-sync/sharepoint-sync.component';
import { SyncOverviewComponent } from '../features/sync/sync-overview/sync-overview.component';
import { SyncActivityComponent } from '../features/sync/sync-activity/sync-activity.component';
import { SyncCompareComponent } from '../features/sync/sync-compare/sync-compare.component';
import { SyncAuditPageComponent } from '../features/sync-audit/sync-audit-page/sync-audit-page.component';
import { FullSyncToServerComponent } from '../features/full-sync-to-server/full-sync-to-server.component';
import { TrashComponent } from '../features/trash/trash.component';
import { CvManagerPageComponent } from '../features/values/refactored/components/cv-manager/cv-manager-page.component';
import { WorkCategoryProfileAdminComponent } from '../features/permit-builder/work-category-profile/work-category-profile-admin.component';
import { E2eTestPageComponent } from '../pages/e2e-test/e2e-test-page.component';
import { Model3dPageComponent } from '../features/model-3d/model-3d-page.component';

export const STANDALONE_ROUTES: Routes = [
  { path: 'tag-number', component: TagNumberComponent },
  { path: 'print', component: PrintComponent },
  { path: 'backup', component: BackupComponent },
  // Admin Dashboard with tab-based layout
  {
    path: 'admin',
    component: AdminFunctionalitiesComponent,
    children: [
      { path: '', redirectTo: 'files', pathMatch: 'full' },
      { path: 'files', component: AdminFilesComponent },
      { path: 'loto', component: AdminLotoComponent },
      { path: 'sync', component: AdminSyncComponent },
      { path: 'sharepoint', component: AdminSharepointComponent },
      { path: 'forms', component: AdminFormsComponent },
      { path: 'migration', component: AdminMigrationComponent },
      { path: 'sds', component: AdminSdsComponent },
      { path: 'db-health', component: AdminDbHealthComponent },
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
      { path: 'sharepoint', component: SharepointSyncComponent },
      { path: 'audit', component: SyncAuditPageComponent }
    ]
  },
  // Full Sync to Server (standalone)
  { path: 'full-sync-to-server', component: FullSyncToServerComponent },
  // Trash / Recycle Bin
  { path: 'trash', component: TrashComponent },
  // 3D Model manager
  { path: '3d-models', component: Model3dPageComponent },
  // E2E Test page (visible only when test.ui.enabled=true on backend)
  { path: 'e2e-test', component: E2eTestPageComponent },
  // Redirects for old bookmarked routes
  { path: 'sync-admin/full-sync', redirectTo: 'full-sync-to-server', pathMatch: 'full' },
  { path: 'sync-resync', redirectTo: 'sync/recovery', pathMatch: 'full' }
];
