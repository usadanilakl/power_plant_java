import { Routes } from '@angular/router';

import { WorkRequestPageComponent } from './pages/work-request-page/work-request-page.component';
import { WorkRequestFormComponent } from './features/work-request/work-request-form/work-request-form.component';
import { WorkRequestTableComponent } from './features/work-request/work-request-table/work-request-table.component';
import { JhaPageComponent } from './pages/jha-page/jha-page.component';
import { JhaFormComponent } from './features/jha/jha-form/jha-form.component';
import { JhaTableComponent } from './features/jha/jha-table/jha-table.component';
import { WorkRequestComponent } from './features/work-request/work-request.component';
import { JhaComponent } from './features/jha/jha.component';

export const routes: Routes = [
    { path: '', redirectTo: '/work-request/form', pathMatch: 'full' },
    {
      path: 'work-request',
      component: WorkRequestPageComponent,
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: WorkRequestComponent }
      ]
    },
    {
      path: 'jha',
      component: JhaPageComponent,
      children: [
        { path: '', redirectTo: 'form', pathMatch: 'full' },
        { path: 'form', component: JhaComponent }
      ]
    },
];
