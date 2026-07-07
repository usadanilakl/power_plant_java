import { Routes } from '@angular/router';
import { LotoPageComponent } from '../pages/loto/loto.component';
import { LotoPermitComponent } from '../features/permit-builder/loto/loto-permit.component';
import { ActiveLotoPointsComponent } from '../features/loto/active-loto-points/active-loto-points.component';
import { LotoBoxTableComponent } from '../features/loto/loto-boxes/loto-box-table/loto-box-table.component';
import { LotoBoxGridComponent } from '../features/loto/loto-boxes/loto-box-grid/loto-box-grid.component';
import { LockTableComponent } from '../features/loto/lock-table/lock-table.component';
import { EspDeviceListComponent } from '../features/esp/esp-device-list/esp-device-list.component';
import { RfLotoStandardPageComponent } from '../features/loto-standard/refactored/rf-loto-standard-page/rf-loto-standard-page.component';
import { LotoBuilderContainerComponent } from '../features/loto-standard/refactored/loto-builder/loto-builder-container.component';
import { LotoPermitSideMenuComponent } from '../features/permit-builder/loto/loto-side-menu/loto-permit-side-menu.component';
import { LotoConflictContainerComponent } from '../features/loto-conflict/loto-conflict-container/loto-conflict-container.component';
import { RedTagStandardListComponent } from '../features/loto-standard/red-tag-standards/red-tag-standard-list.component';
import { RedTagStandardDetailComponent } from '../features/loto-standard/red-tag-standards/red-tag-standard-detail.component';
import { LotoBoardComponent } from '../features/permit-builder/loto-board/loto-board.component';
import { LotoUsageMonitorComponent } from '../features/permit-builder/loto-usage-monitor/loto-usage-monitor.component';

export const LOTO_ROUTES: Routes = [
  {
    path: 'loto',
    component: LotoPageComponent,
    children: [
      { path: '', redirectTo: 'loto', pathMatch: 'full' },
      {
        path: 'loto',
        component: LotoPermitComponent,
        data: { leftMenu: LotoPermitSideMenuComponent }
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
    path: 'red-tag-standards',
    component: RedTagStandardListComponent,
  },
  {
    path: 'red-tag-standards/:id',
    component: RedTagStandardDetailComponent,
  },
  {
    path: 'loto-builder',
    component: LotoBuilderContainerComponent
  },
  {
    path: 'loto-conflicts',
    component: LotoConflictContainerComponent
  },
  { path: 'loto-board', component: LotoBoardComponent },
  { path: 'loto-usage', component: LotoUsageMonitorComponent }
];
