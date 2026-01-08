import { Routes } from '@angular/router';
import { RfLotoPointPageComponent } from '../features/loto-points/refactored/rf-loto-point-page/rf-loto-point-page.component';
import { DoubleLotoPointTableComponent } from '../features/loto-points/refactored/double-loto-point-table/double-loto-point-table.component';
import { LotoPointComponent } from '../pages/loto-point/loto-point.component';

export const LOTO_POINTS_ROUTES: Routes = [
  {
    path: 'loto-points',
    component: RfLotoPointPageComponent,
    children: [
      { path: '', redirectTo: 'table', pathMatch: 'full' },
      { path: 'table', component: DoubleLotoPointTableComponent },
      { path: ':lotoPointId', component: LotoPointComponent }
    ]
  }
];
