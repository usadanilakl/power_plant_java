import { Routes } from '@angular/router';

export const DIAGRAM_BUILDER_ROUTES: Routes = [
  {
    path: 'diagram-builder',
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
