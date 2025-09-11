import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LotoPageComponent } from './pages/loto/loto.component';
import { TagNumberComponent } from './pages/tag-number/tag-number.component';
import { LotoPointComponent } from './pages/loto-point/loto-point.component';
import { PrintComponent } from './pages/print/print.component';
import { LotoTableComponent } from './features/loto/loto-table/loto-table.component';
import { LotoPointTableComponent } from './features/loto-points/loto-point-table/loto-point-table.component';
import { LockTableComponent } from './features/loto/lock-table/lock-table.component';
import { LotoBoxTableComponent } from './features/loto/loto-box-table/loto-box-table.component';
import { ActiveLotoPointsComponent } from './features/loto/active-loto-points/active-loto-points.component';
import { FileEditorComponent } from './features/files/file-editor/file-editor.component';
import { FilePageComponent } from './pages/file-page/file-page.component';
import { FileTableComponent } from './features/files/file-table/file-table.component';
import { FileEditorBottomMenuComponent } from './features/files/file-editor/file-editor-bottom-menu/file-editor-bottom-menu.component';
import { BackupComponent } from './pages/backup/backup.component';
import { SchedulerPageComponent } from './pages/scheduler-page/scheduler-page.component';
import { SchedulerComponent } from './features/scheduler/scheduler.component';
import { LotoStandardComponent } from './features/loto-standard/loto-standard.component';
import { LotoStandardSideMenuComponent } from './features/loto-standard/loto-standard-side-menu/loto-standard-side-menu.component';
import { LotoComponent } from './features/loto/loto.component';
import { PermitBuilderPageComponent } from './pages/permit-builder-page/permit-builder-page.component';
import { JobLogComponent } from './features/permit-builder/job-log/job-log.component';
import { WorkRequestComponent } from './features/permit-builder/work-request/work-request.component';
import { DailyPermitPackageComponent } from './features/permit-builder/daily-permit-package/daily-permit-package.component';

export const routes: Routes = [
    // {path: '', component: HomeComponent, data: {menuType: 'main'}},
    { path: '', redirectTo: '/file/edit', pathMatch: 'full' },
    {
      path: 'file',
      component: FilePageComponent,
      children: [
        { path: '', redirectTo: 'table', pathMatch: 'full' },
        { path: 'edit', component: FileEditorComponent, data: {bottomMenu: FileEditorBottomMenuComponent} },
        { path: 'table', component: FileTableComponent }
      ]
    },

    {
      path: 'loto',
      component: LotoPageComponent,
      // data: {menuType: 'loto'},
      children: [
        { path: '', redirectTo: 'loto', pathMatch: 'full' },
        { path: 'loto', component: LotoComponent },
        { path: 'loto-standard', component: LotoStandardComponent,data: {leftMenu: LotoStandardSideMenuComponent} },
        { path: 'loto-points', component: LotoPointTableComponent },
        { path: 'loto-points-active', component: ActiveLotoPointsComponent },
        { path: 'loto-boxes', component: LotoBoxTableComponent },
        { path: 'locks', component: LockTableComponent }
      ]
    },

    {path: 'loto-points', component: LotoPointComponent},
    {path: 'tag-number', component: TagNumberComponent},
    {path: 'print', component: PrintComponent},
    {path: 'backup', component: BackupComponent},


    {
      path: 'permit-builder', component: PermitBuilderPageComponent,
      children: [
        { path: '', redirectTo: 'jobs', pathMatch: 'full' },
        { path: 'jobs', component: JobLogComponent },
        { path: 'work-requests', component: WorkRequestComponent },
        { path: 'daily-packages', component: DailyPermitPackageComponent },
      ]
    },

    {
      path: 'scheduler',
      component: SchedulerPageComponent,
      children: [
        { path: '', redirectTo: 'flow', pathMatch: 'full' },
        { path: 'flow', component: SchedulerComponent, data: {bottomMenu: FileEditorBottomMenuComponent} },
        { path: 'table', component: FileTableComponent }
      ]
    },
];
