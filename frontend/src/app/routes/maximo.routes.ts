import { Routes } from '@angular/router';
import { MaximoAssetsPageComponent } from '../features/maximo/maximo-assets-page/maximo-assets-page.component';
import { MaximoServiceRequestsPageComponent } from '../features/maximo/maximo-service-requests-page/maximo-service-requests-page.component';
import { MaximoWorkOrdersPageComponent } from '../features/maximo/maximo-work-orders-page/maximo-work-orders-page.component';
import { MaximoApiTestPageComponent } from '../features/maximo/maximo-api-test-page/maximo-api-test-page.component';
import { MaximoLeadOperatorWosPageComponent } from '../features/maximo/maximo-lead-operator-wos-page/maximo-lead-operator-wos-page.component';
import { MaximoPartsCheckoutPageComponent } from '../features/maximo/maximo-parts-checkout-page/maximo-parts-checkout-page.component';
import { MaximoInventoryPageComponent } from '../features/maximo/maximo-inventory-page/maximo-inventory-page.component';
import { MaximoPmPageComponent } from '../features/maximo/maximo-pm-page/maximo-pm-page.component';
import { MaximoTicketSearchPageComponent } from '../features/maximo/maximo-ticket-search-page/maximo-ticket-search-page.component';

export const MAXIMO_ROUTES: Routes = [
  { path: 'maximo', redirectTo: 'maximo/assets', pathMatch: 'full' },
  { path: 'maximo/assets', component: MaximoAssetsPageComponent },
  { path: 'maximo/service-requests', component: MaximoServiceRequestsPageComponent },
  { path: 'maximo/work-orders', component: MaximoWorkOrdersPageComponent },
  { path: 'maximo/parts-checkout', component: MaximoPartsCheckoutPageComponent },
  { path: 'maximo/inventory', component: MaximoInventoryPageComponent },
  { path: 'maximo/pm-scheduling', component: MaximoPmPageComponent },
  { path: 'maximo/bundles/lead-operators', component: MaximoLeadOperatorWosPageComponent },
  { path: 'maximo/ticket-search', component: MaximoTicketSearchPageComponent },
  { path: 'maximo/api-test', component: MaximoApiTestPageComponent }
];
