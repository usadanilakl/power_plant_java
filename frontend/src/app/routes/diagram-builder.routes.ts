import { Routes } from '@angular/router';
import { DiagramBuilderPageComponent } from '../features/diagram-builder/diagram-builder-page.component';

export const DIAGRAM_BUILDER_ROUTES: Routes = [
  {
    path: 'diagram-builder',
    component: DiagramBuilderPageComponent,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () =>
          import('../features/diagram-builder/components/diagram-list/diagram-list.component').then(m => m.DiagramListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('../features/diagram-builder/components/diagram-canvas/diagram-canvas.component').then(m => m.DiagramCanvasComponent),
        data: { mode: 'builder' },
      },
      {
        path: 'build/:id',
        loadComponent: () =>
          import('../features/diagram-builder/components/diagram-canvas/diagram-canvas.component').then(m => m.DiagramCanvasComponent),
        data: { mode: 'builder' },
      },
      {
        path: 'view/:id',
        loadComponent: () =>
          import('../features/diagram-builder/components/diagram-canvas/diagram-canvas.component').then(m => m.DiagramCanvasComponent),
        data: { mode: 'renderer' },
      },
    ],
  },
];
