import { Routes } from '@angular/router';
import { RfSdsPageComponent } from '../features/sds/refactored/rf-sds-page/rf-sds-page.component';

export const SDS_ROUTES: Routes = [
  { path: 'sds', component: RfSdsPageComponent },
  { path: 'sds/:status', component: RfSdsPageComponent },
];
