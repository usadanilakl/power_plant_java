import { Routes } from '@angular/router';
import { LotoPageComponent } from '../pages/loto/loto.component';
import { LotoComponent } from '../features/loto/loto.component';
import { ActiveLotoPointsComponent } from '../features/loto/active-loto-points/active-loto-points.component';
import { LotoBoxTableComponent } from '../features/loto/loto-boxes/loto-box-table/loto-box-table.component';
import { LotoBoxGridComponent } from '../features/loto/loto-boxes/loto-box-grid/loto-box-grid.component';
import { LockTableComponent } from '../features/loto/lock-table/lock-table.component';
import { EspDeviceListComponent } from '../features/esp/esp-device-list/esp-device-list.component';
import { RfLotoStandardPageComponent } from '../features/loto-standard/refactored/rf-loto-standard-page/rf-loto-standard-page.component';
import { LotoBuilderContainerComponent } from '../features/loto-standard/refactored/loto-builder/loto-builder-container.component';
import { LotoSideMenuComponent } from '../features/loto/loto-side-menu/loto-side-menu.component';
import { LotoConflictContainerComponent } from '../features/loto-conflict/loto-conflict-container/loto-conflict-container.component';

export const LOTO_ROUTES: Routes = [
  {
    path: 'loto',
    component: LotoPageComponent,
    children: [
      { path: '', redirectTo: 'loto', pathMatch: 'full' },
      {
        path: 'loto',
        component: LotoComponent,
        data: { leftMenu: LotoSideMenuComponent }
      },
      { path: 'loto-points-active', component: ActiveLotoPointsComponent },
      { path: 'loto-boxes', component: LotoBoxTableComponent },
      { path: 'loto-boxes-grid', component: LotoBoxGridComponent },
      { path: 'locks', component: LockTableComponent },
      { path: 'esp-devices', component: EspDeviceListComponent }
    ]
  },
  {
    path: 'loto-standard',
    component: RfLotoStandardPageComponent,
  },
  {
    path: 'loto-builder',
    component: LotoBuilderContainerComponent
  },
  {
    path: 'loto-conflicts',
    component: LotoConflictContainerComponent
  }
];
