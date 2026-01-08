import { Routes } from '@angular/router';
import { PrintableFormPageComponent } from '../pages/printable-form-page/printable-form-page.component';
import { PrintableFormComponent } from '../features/form-designer/printable-form/printable-form.component';
import { PrintableFormPreviewComponent } from '../features/form-designer/printable-form/printable-form-preview/printable-form-preview.component';
import { PrintableFormDesignerRefactoredComponent } from '../features/form-designer/refactored/printable-form-designer-refactored/printable-form-designer-refactored.component';

export const FORM_DESIGNER_ROUTES: Routes = [
  {
    path: 'form-designer',
    component: PrintableFormPageComponent,
    children: [
      { path: '', redirectTo: 'forms', pathMatch: 'full' },
      { path: 'forms', component: PrintableFormComponent },
      { path: 'preview', component: PrintableFormPreviewComponent },
      { path: 'design', component: PrintableFormDesignerRefactoredComponent }
    ]
  }
];
