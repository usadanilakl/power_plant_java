import { Routes } from '@angular/router';
import { PermitBuilderPageComponent } from '../pages/permit-builder-page/permit-builder-page.component';
import { JobLogComponent } from '../features/permit-builder/job-log/job-log.component';
import { WorkRequestComponent } from '../features/permit-builder/work-request/work-request.component';
import { RfWorkRequestPageComponent } from '../features/permit-builder/work-request/refactored/rf-work-request-page/rf-work-request-page.component';
import { DailyPermitPackageComponent } from '../features/permit-builder/daily-permit-package/daily-permit-package.component';
import { SafeWorkComponent } from '../features/permit-builder/safe-work/safe-work.component';
import { HotWorkComponent } from '../features/permit-builder/hot-work/hot-work.component';
import { ConfinedSpaceComponent } from '../features/permit-builder/confined-space/confined-space.component';
import { JobLogLeftMenuComponent } from '../features/permit-builder/job-log/job-log-left-menu/job-log-left-menu.component';
import { DailyPermitPackageSideMenuComponent } from '../features/permit-builder/daily-permit-package/daily-permit-package-side-menu/daily-permit-package-side-menu.component';
import { SafeWorkSideMenuComponent } from '../features/permit-builder/safe-work/safe-work-side-menu/safe-work-side-menu.component';
import { HotWorkSideMenuComponent } from '../features/permit-builder/hot-work/hot-work-side-menu/hot-work-side-menu.component';
import { ConfinedSpaceSideMenuComponent } from '../features/permit-builder/confined-space/confined-space-side-menu/confined-space-side-menu.component';

export const PERMIT_BUILDER_ROUTES: Routes = [
  {
    path: 'permit-builder',
    component: PermitBuilderPageComponent,
    children: [
      { path: '', redirectTo: 'daily-packages', pathMatch: 'full' },
      {
        path: 'jobs',
        component: JobLogComponent,
        data: { leftMenu: JobLogLeftMenuComponent }
      },
      { path: 'work-requests', component: RfWorkRequestPageComponent },
      {
        path: 'daily-packages',
        component: DailyPermitPackageComponent,
        data: { leftMenu: DailyPermitPackageSideMenuComponent }
      },
      {
        path: 'daily-packages/re-issue/:workRequestId',
        component: DailyPermitPackageComponent,
        data: { mode: 'reissue', leftMenu: DailyPermitPackageSideMenuComponent }
      },
      {
        path: 'daily-packages/:workRequestId',
        component: DailyPermitPackageComponent,
        data: { leftMenu: DailyPermitPackageSideMenuComponent }
      },
      {
        path: 'safe-works',
        component: SafeWorkComponent,
        data: { leftMenu: SafeWorkSideMenuComponent }
      },
      {
        path: 'hot-works',
        component: HotWorkComponent,
        data: { leftMenu: HotWorkSideMenuComponent }
      },
      {
        path: 'confined-spaces',
        component: ConfinedSpaceComponent,
        data: { leftMenu: ConfinedSpaceSideMenuComponent }
      }
    ]
  }
];
