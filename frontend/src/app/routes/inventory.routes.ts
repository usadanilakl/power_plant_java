import { Routes } from '@angular/router';
import { RfInventoryPageComponent } from '../features/inventory/refactored/rf-inventory-page/rf-inventory-page.component';
import { RfInventoryAuditComponent } from '../features/inventory/refactored/rf-inventory-audit/rf-inventory-audit.component';

export const INVENTORY_ROUTES: Routes = [
  { path: 'inventory', component: RfInventoryPageComponent },
  { path: 'inventory/audit', component: RfInventoryAuditComponent },
  { path: 'inventory/:type', component: RfInventoryPageComponent },
];
