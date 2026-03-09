import { Routes } from '@angular/router';
import { InstrumentPageComponent } from '../features/instrumentation/instrument-page/instrument-page.component';
import { InstrumentBulkUploadComponent } from '../features/instrumentation/instrument-bulk-upload/instrument-bulk-upload.component';
import { InstrumentFormComponent } from '../features/instrumentation/instrument-form/instrument-form.component';

export const INSTRUMENTATION_ROUTES: Routes = [
  { path: 'instrumentation', component: InstrumentPageComponent },
  { path: 'instrumentation/add', component: InstrumentFormComponent },
  { path: 'instrumentation/bulk-upload', component: InstrumentBulkUploadComponent },
];
