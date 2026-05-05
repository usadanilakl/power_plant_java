import { Routes } from '@angular/router';
import { MaximoAssetsPageComponent } from '../features/maximo/maximo-assets-page/maximo-assets-page.component';
import { MaximoServiceRequestsPageComponent } from '../features/maximo/maximo-service-requests-page/maximo-service-requests-page.component';
import { MaximoWorkOrdersPageComponent } from '../features/maximo/maximo-work-orders-page/maximo-work-orders-page.component';
import { MaximoApiTestPageComponent } from '../features/maximo/maximo-api-test-page/maximo-api-test-page.component';

export const MAXIMO_ROUTES: Routes = [
  { path: 'maximo', redirectTo: 'maximo/assets', pathMatch: 'full' },
  { path: 'maximo/assets', component: MaximoAssetsPageComponent },
  { path: 'maximo/service-requests', component: MaximoServiceRequestsPageComponent },
  { path: 'maximo/work-orders', component: MaximoWorkOrdersPageComponent },
  { path: 'maximo/api-test', component: MaximoApiTestPageComponent }
];
