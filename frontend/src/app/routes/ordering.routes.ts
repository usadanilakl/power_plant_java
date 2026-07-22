import { Routes } from '@angular/router';
import { OrderingWorkbenchComponent } from '../features/ordering/ordering-workbench/ordering-workbench.component';

/**
 * Ordering section (hub-served desktop, FULL access). Registered like Rounds in app.routes.ts.
 * The redirect entry is guard-skipped there (r.redirectTo ? r : ...).
 */
export const ORDERING_ROUTES: Routes = [
  { path: 'ordering', redirectTo: 'ordering/workbench', pathMatch: 'full' },
  { path: 'ordering/workbench', component: OrderingWorkbenchComponent },
];
