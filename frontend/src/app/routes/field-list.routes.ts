import { Routes } from '@angular/router';
import { RfFieldListPageComponent } from '../features/field-list/refactored/rf-field-list-page/rf-field-list-page.component';

export const FIELD_LIST_ROUTES: Routes = [
  { path: 'field-lists', component: RfFieldListPageComponent },
  { path: 'field-lists/:listType', component: RfFieldListPageComponent },
];
