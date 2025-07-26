import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LotoComponent } from './pages/loto/loto.component';
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
      component: LotoComponent,
      data: {menuType: 'loto'},
      children: [
        { path: '', redirectTo: 'loto', pathMatch: 'full' },
        { path: 'loto', component: LotoTableComponent },
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


    {path: 'file-editor', component: FileEditorComponent, data: {menuType: 'main'}},

    {
      path: 'scheduler',
      component: SchedulerPageComponent,
      children: [
        { path: '', redirectTo: 'table', pathMatch: 'full' },
        { path: 'edit', component: SchedulerComponent, data: {bottomMenu: FileEditorBottomMenuComponent} },
        { path: 'table', component: FileTableComponent }
      ]
    },
];
