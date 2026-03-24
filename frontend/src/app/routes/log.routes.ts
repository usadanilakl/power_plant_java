import { Routes } from '@angular/router';
import { LogPageComponent } from '../features/log/log-page/log-page.component';
import { LogDbTableComponent } from '../features/log/log-db-table/log-db-table.component';
import { CorrespondencePageComponent } from '../features/log/correspondence-page/correspondence-page.component';
import { MessagingPageComponent } from '../features/log/messaging-page/messaging-page.component';

export const LOG_ROUTES: Routes = [
  {
    path: 'log',
    component: LogPageComponent,
    children: [
      { path: '', redirectTo: 'table', pathMatch: 'full' },
      { path: 'table', component: LogDbTableComponent },
      { path: 'correspondence', component: CorrespondencePageComponent },
      { path: 'messaging', component: MessagingPageComponent },
    ],
  },
];
