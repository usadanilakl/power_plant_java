import { Routes } from '@angular/router';
import { RfLotoPointPageComponent } from '../features/loto-points/refactored/rf-loto-point-page/rf-loto-point-page.component';
import { LotoPointDbTableComponent } from '../features/loto-points/refactored/loto-point-db-table/loto-point-db-table.component';
import { LotoPointComponent } from '../pages/loto-point/loto-point.component';

export const LOTO_POINTS_ROUTES: Routes = [
  {
    path: 'loto-points',
    component: RfLotoPointPageComponent,
    children: [
      { path: '', redirectTo: 'table', pathMatch: 'full' },
      { path: 'table', component: LotoPointDbTableComponent },
      { path: ':lotoPointId', component: LotoPointComponent }
    ]
  }
];
