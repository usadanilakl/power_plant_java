import { Routes } from '@angular/router';
import { PermitBuilderPageComponent } from '../pages/permit-builder-page/permit-builder-page.component';
import { JobLogComponent } from '../features/permit-builder/job-log/job-log.component';
import { WorkRequestComponent } from '../features/permit-builder/work-request/work-request.component';
import { RfWorkRequestPageComponent } from '../features/permit-builder/work-request/refactored/rf-work-request-page/rf-work-request-page.component';
import { DailyPermitPackageComponent } from '../features/permit-builder/daily-permit-package/daily-permit-package.component';
import { SafeWorkComponent } from '../features/permit-builder/safe-work/safe-work.component';
import { HotWorkComponent } from '../features/permit-builder/hot-work/hot-work.component';
import { ConfinedSpaceComponent } from '../features/permit-builder/confined-space/confined-space.component';
import { EnergizedWorkPermitComponent } from '../features/permit-builder/energized-work-permit/energized-work-permit.component';
import { ExcavationPermitComponent } from '../features/permit-builder/excavation-permit/excavation-permit.component';
import { VentingPermitComponent } from '../features/permit-builder/venting-permit/venting-permit.component';
import { JobLogSideMenuComponent } from '../features/permit-builder/job-log/job-log-side-menu/job-log-side-menu.component';
import { DailyPermitPackageSideMenuComponent } from '../features/permit-builder/daily-permit-package/daily-permit-package-side-menu/daily-permit-package-side-menu.component';
import { SafeWorkSideMenuComponent } from '../features/permit-builder/safe-work/safe-work-side-menu/safe-work-side-menu.component';
import { HotWorkSideMenuComponent } from '../features/permit-builder/hot-work/hot-work-side-menu/hot-work-side-menu.component';
import { ConfinedSpaceSideMenuComponent } from '../features/permit-builder/confined-space/confined-space-side-menu/confined-space-side-menu.component';
import { EnergizedWorkPermitSideMenuComponent } from '../features/permit-builder/energized-work-permit/energized-work-permit-side-menu/energized-work-permit-side-menu.component';
import { ExcavationPermitSideMenuComponent } from '../features/permit-builder/excavation-permit/excavation-permit-side-menu/excavation-permit-side-menu.component';
import { VentingPermitSideMenuComponent } from '../features/permit-builder/venting-permit/venting-permit-side-menu/venting-permit-side-menu.component';
import { LotoPermitComponent } from '../features/permit-builder/loto/loto-permit.component';
import { LotoPermitSideMenuComponent } from '../features/permit-builder/loto/loto-side-menu/loto-permit-side-menu.component';
import { RfJhaPageComponent } from '../features/permit-builder/jha/refactored/rf-jha-page/rf-jha-page.component';
import { RfJhaSideMenuComponent } from '../features/permit-builder/jha/refactored/rf-jha-side-menu/rf-jha-side-menu.component';
import { LotoBoardComponent } from '../features/permit-builder/loto-board/loto-board.component';

export const PERMIT_BUILDER_ROUTES: Routes = [
  {
    path: 'permit-builder',
    component: PermitBuilderPageComponent,
    children: [
      { path: '', redirectTo: 'daily-packages', pathMatch: 'full' },
      {
        path: 'jobs',
        component: JobLogComponent,
        data: { leftMenu: JobLogSideMenuComponent }
      },
      { path: 'work-requests', component: RfWorkRequestPageComponent },
      {
        path: 'jhas',
        component: RfJhaPageComponent,
        data: { leftMenu: RfJhaSideMenuComponent }
      },
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
      },
      {
        path: 'energized-work-permits',
        component: EnergizedWorkPermitComponent,
        data: { leftMenu: EnergizedWorkPermitSideMenuComponent }
      },
      {
        path: 'excavation-permits',
        component: ExcavationPermitComponent,
        data: { leftMenu: ExcavationPermitSideMenuComponent }
      },
      {
        path: 'venting-permits',
        component: VentingPermitComponent,
        data: { leftMenu: VentingPermitSideMenuComponent }
      },
      {
        path: 'lotos',
        component: LotoPermitComponent,
        data: { leftMenu: LotoPermitSideMenuComponent }
      },
      { path: 'loto-board', component: LotoBoardComponent },
    ]
  }
];
