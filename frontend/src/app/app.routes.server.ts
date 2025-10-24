import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'permit-builder/daily-packages/:workRequestId',
    renderMode: RenderMode.Client
  },
  {
    path: 'permit-builder/daily-packages/re-issue/:workRequestId',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];