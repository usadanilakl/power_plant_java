import { Routes } from '@angular/router';
import { RfInventoryPageComponent } from '../features/inventory/refactored/rf-inventory-page/rf-inventory-page.component';

export const INVENTORY_ROUTES: Routes = [
  { path: 'inventory', component: RfInventoryPageComponent },
  { path: 'inventory/:type', component: RfInventoryPageComponent },
];
