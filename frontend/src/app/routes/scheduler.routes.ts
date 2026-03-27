import { Routes } from '@angular/router';
import { SchedulerPageComponent } from '../pages/scheduler-page/scheduler-page.component';
import { SchedulerComponent } from '../features/scheduler/scheduler.component';
import { TemplateManagerComponent } from '../features/scheduler/components/template-manager/template-manager.component';
import { TaskTableComponent } from '../features/scheduler/components/task-table/task-table.component';
import { FileEditorBottomMenuComponent } from '../features/files/file-editor/file-editor-bottom-menu/file-editor-bottom-menu.component';

export const SCHEDULER_ROUTES: Routes = [
  {
    path: 'scheduler',
    component: SchedulerPageComponent,
    children: [
      { path: '', redirectTo: 'flow', pathMatch: 'full' },
      { path: 'flow', component: SchedulerComponent, data: { bottomMenu: FileEditorBottomMenuComponent } },
      { path: 'templates', component: TemplateManagerComponent },
      { path: 'table', component: TaskTableComponent }
    ]
  }
];
