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
import { MaximoFormBuilderPageComponent } from '../features/maximo/maximo-form-builder-page/maximo-form-builder-page.component';
import { MaximoFormFillPageComponent } from '../features/maximo/maximo-form-fill-page/maximo-form-fill-page.component';
import { MaximoOutageItemsPageComponent } from '../features/maximo/maximo-outage-items-page/maximo-outage-items-page.component';
import { MaximoToiPageComponent } from '../features/maximo/maximo-toi-page/maximo-toi-page.component';
import { MaximoWoQuestionsPageComponent } from '../features/maximo/maximo-wo-questions-page/maximo-wo-questions-page.component';

export const MAXIMO_ROUTES: Routes = [
  { path: 'maximo', redirectTo: 'maximo/assets', pathMatch: 'full' },
  { path: 'maximo/assets', component: MaximoAssetsPageComponent },
  { path: 'maximo/service-requests', component: MaximoServiceRequestsPageComponent },
  { path: 'maximo/work-orders', component: MaximoWorkOrdersPageComponent },
  { path: 'maximo/outage-items', component: MaximoOutageItemsPageComponent },
  { path: 'maximo/toi', component: MaximoToiPageComponent },
  { path: 'maximo/wo-questions', component: MaximoWoQuestionsPageComponent },
  { path: 'maximo/parts-checkout', component: MaximoPartsCheckoutPageComponent },
  { path: 'maximo/inventory', component: MaximoInventoryPageComponent },
  { path: 'maximo/pm-scheduling', component: MaximoPmPageComponent },
  { path: 'maximo/bundles/lead-operators', component: MaximoLeadOperatorWosPageComponent },
  { path: 'maximo/ticket-search', component: MaximoTicketSearchPageComponent },
  { path: 'maximo/form-builder', component: MaximoFormBuilderPageComponent },
  { path: 'maximo/form-fill', component: MaximoFormFillPageComponent },
  { path: 'maximo/api-test', component: MaximoApiTestPageComponent }
];
