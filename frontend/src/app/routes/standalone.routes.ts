import { Routes } from '@angular/router';
import { TagNumberComponent } from '../pages/tag-number/tag-number.component';
import { PrintComponent } from '../pages/print/print.component';
import { BackupComponent } from '../pages/backup/backup.component';
import { AdminFunctionalitiesComponent } from '../pages/admin/admin-functionalities.component';
import { SyncMonitorComponent } from '../pages/sync-monitor/sync-monitor.component';

export const STANDALONE_ROUTES: Routes = [
  { path: 'tag-number', component: TagNumberComponent },
  { path: 'print', component: PrintComponent },
  { path: 'backup', component: BackupComponent },
  { path: 'admin', component: AdminFunctionalitiesComponent },
  { path: 'sync', component: SyncMonitorComponent }
];
