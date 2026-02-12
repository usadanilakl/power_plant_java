import { Routes } from '@angular/router';
import { FormDesignerPageComponent } from '../features/form-designer-refactored/form-designer-page.component';
import { FormDesignerLeftMenuComponent } from '../features/form-designer-refactored/form-designer-left-menu/form-designer-left-menu.component';

export const FORM_DESIGNER_ROUTES: Routes = [
  {
    path: 'form-designer',
    component: FormDesignerPageComponent,
    children: [
      { path: '', redirectTo: 'forms', pathMatch: 'full' },
      {
        path: 'forms',
        loadComponent: () => import('../features/form-designer-refactored/form-designer-forms/form-designer-forms.component').then(m => m.FormDesignerFormsComponent),
        data: { leftMenu: FormDesignerLeftMenuComponent },
      },
      {
        path: 'design',
        loadComponent: () => import('../features/form-designer-refactored/form-designer-canvas/form-designer-canvas.component').then(m => m.FormDesignerCanvasComponent),
        data: { leftMenu: FormDesignerLeftMenuComponent },
      },
      {
        path: 'preview',
        loadComponent: () => import('../features/form-designer-refactored/form-designer-preview/form-designer-preview.component').then(m => m.FormDesignerPreviewComponent),
        data: { leftMenu: FormDesignerLeftMenuComponent },
      },
    ],
  },
];
