import { Routes } from '@angular/router';
import { WorkAreaMapPageComponent } from '../pages/work-area-map-page/work-area-map-page.component';

export const VISUAL_PLANT_ROUTES: Routes = [
  {
    path: 'visual-plant/work-areas',
    component: WorkAreaMapPageComponent,
    data: { leftPanelMode: 'table' }
  },
  {
    path: 'visual-plant/work-area-map',
    component: WorkAreaMapPageComponent,
    data: { leftPanelMode: 'toggle-menu' }
  },
  {
    path: 'permit-builder/work-areas',
    redirectTo: '/visual-plant/work-areas',
    pathMatch: 'full'
  },
  {
    path: 'work-area-map',
    redirectTo: '/visual-plant/work-area-map',
    pathMatch: 'full'
  }
];
