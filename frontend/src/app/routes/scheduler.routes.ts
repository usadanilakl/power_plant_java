import { Routes } from '@angular/router';
import { SchedulerPageComponent } from '../pages/scheduler-page/scheduler-page.component';
import { SchedulerComponent } from '../features/scheduler/scheduler.component';
import { FileTableComponent } from '../features/files/file-table/file-table.component';
import { FileEditorBottomMenuComponent } from '../features/files/file-editor/file-editor-bottom-menu/file-editor-bottom-menu.component';

export const SCHEDULER_ROUTES: Routes = [
  {
    path: 'scheduler',
    component: SchedulerPageComponent,
    children: [
      { path: '', redirectTo: 'flow', pathMatch: 'full' },
      { path: 'flow', component: SchedulerComponent, data: { bottomMenu: FileEditorBottomMenuComponent } },
      { path: 'table', component: FileTableComponent }
    ]
  }
];
