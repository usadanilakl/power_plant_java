import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LotoPageComponent } from './pages/loto/loto.component';
import { TagNumberComponent } from './pages/tag-number/tag-number.component';
import { LotoPointComponent } from './pages/loto-point/loto-point.component';
import { PrintComponent } from './pages/print/print.component';
import { LotoTableComponent } from './features/loto/loto-table/loto-table.component';
import { LotoPointTableComponent } from './features/loto-points/loto-point-table/loto-point-table.component';
import { LockTableComponent } from './features/loto/lock-table/lock-table.component';
import { LotoBoxTableComponent } from './features/loto/loto-boxes/loto-box-table/loto-box-table.component';
import { LotoBoxGridComponent } from './features/loto/loto-boxes/loto-box-grid/loto-box-grid.component';
import { ActiveLotoPointsComponent } from './features/loto/active-loto-points/active-loto-points.component';
import { FileEditorComponent } from './features/files/file-editor/file-editor.component';
import { FilePageComponent } from './pages/file-page/file-page.component';
import { FileTableComponent } from './features/files/file-table/file-table.component';
import { FileEditorBottomMenuComponent } from './features/files/file-editor/file-editor-bottom-menu/file-editor-bottom-menu.component';
import { BackupComponent } from './pages/backup/backup.component';
import { SchedulerPageComponent } from './pages/scheduler-page/scheduler-page.component';
import { SchedulerComponent } from './features/scheduler/scheduler.component';
import { LotoStandardComponent } from './features/loto-standard/loto-standard.component';
import { LotoStandardSideMenuComponent } from './features/loto-standard/loto-standard-side-menu/loto-standard-side-menu.component';
import { LotoComponent } from './features/loto/loto.component';
import { PermitBuilderPageComponent } from './pages/permit-builder-page/permit-builder-page.component';
import { JobLogComponent } from './features/permit-builder/job-log/job-log.component';
import { WorkRequestComponent } from './features/permit-builder/work-request/work-request.component';
import { DailyPermitPackageComponent } from './features/permit-builder/daily-permit-package/daily-permit-package.component';
import { ConfinedSpaceComponent } from './features/permit-builder/confined-space/confined-space.component';
import { HotWorkComponent } from './features/permit-builder/hot-work/hot-work.component';
import { SafeWorkComponent } from './features/permit-builder/safe-work/safe-work.component';
import { FormDesignerComponent } from './features/form-designer/form-designer.component';
import { PrintableFormDesignerComponent } from './features/form-designer/printable-form-designer/printable-form-designer.component';
import { PrintableFormPageComponent } from './pages/printable-form-page/printable-form-page.component';
import { PrintableFormComponent } from './features/form-designer/printable-form/printable-form.component';
import { PrintableFormPreviewComponent } from './features/form-designer/printable-form/printable-form-preview/printable-form-preview.component';
import { RfLotoPointPageComponent } from './features/loto-points/refactored/rf-loto-point-page/rf-loto-point-page.component';
import { RfLotoPointTableComponent } from './features/loto-points/refactored/rf-loto-point-table/rf-loto-point-table.component';
import { DoubleLotoPointTableComponent } from './features/loto-points/refactored/double-loto-point-table/double-loto-point-table.component';
import { PrintableFormDesignerRefactoredComponent } from './features/form-designer/refactored/printable-form-designer-refactored/printable-form-designer-refactored.component';
import { RfFilePageComponent } from './features/files/refactored/rf-file-page/rf-file-page.component';
import { RfFileEditroComponent } from './features/files/refactored/rf-file-editor.component';
import { EspDeviceListComponent } from './features/esp/esp-device-list/esp-device-list.component';
import { RfLotoStandardPageComponent } from './features/loto-standard/refactored/rf-loto-standard-page/rf-loto-standard-page.component';
import { RfLotoStandardMainTableViewComponent } from './features/loto-standard/refactored/rf-loto-standard-page/rf-loto-standard-main-table-view.component';
import { LotoBuilderContainerComponent } from './features/loto-standard/refactored/loto-builder/loto-builder-container.component';
import { SourceLotoPointTableComponent } from './features/loto-points/refactored/double-loto-point-table/source-loto-point-table/source-loto-point-table.component';
import { AdminFunctionalitiesComponent } from './pages/admin/admin-functionalities.component';

export const routes: Routes = [
    // {path: '', component: HomeComponent, data: {menuType: 'main'}},
    { path: '', redirectTo: '/file/edit', pathMatch: 'full' },
    {
      path: 'file',
      component: RfFilePageComponent,
      // component: FilePageComponent,
      children: [
        { path: '', redirectTo: 'table', pathMatch: 'full' },
        { path: 'edit', component: RfFileEditroComponent },
        // { path: 'edit', component: FileEditorComponent, data: {bottomMenu: FileEditorBottomMenuComponent} },
        { path: 'table', component: FileTableComponent }
      ]
    },

    // {
    //   path: 'loto',
    //   component: LotoPageComponent,
    //   // data: {menuType: 'loto'},
    //   children: [
    //     { path: '', redirectTo: 'loto', pathMatch: 'full' },
    //     { path: 'loto', component: LotoComponent },
    //     { path: 'loto-standard', component: RfLotoStandardPageComponent },
    //     // { path: 'loto-standard', component: LotoStandardComponent,data: {leftMenu: LotoStandardSideMenuComponent} },
    //     { path: 'loto-points', component: LotoPointTableComponent },
    //     { path: 'loto-points-active', component: ActiveLotoPointsComponent },
    //     { path: 'loto-boxes', component: LotoBoxTableComponent },
    //     { path: 'loto-boxes-grid', component: LotoBoxGridComponent },
    //     { path: 'locks', component: LockTableComponent },
    //     { path: 'esp-devices', component: EspDeviceListComponent }
    //   ]
    // },

    {
      path: 'loto',
      component: LotoPageComponent,
      // data: {menuType: 'loto'},
      children: [
        { path: '', redirectTo: 'loto', pathMatch: 'full' },
        { path: 'loto', component: LotoComponent },
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
      children: [
        { path: '', component: RfLotoStandardMainTableViewComponent }
      ]
    },

    {
      path: 'loto-builder',
      component: LotoBuilderContainerComponent,
    },

    {
      path: 'loto-points', component: RfLotoPointPageComponent,
      children: [
        { path: '', redirectTo: 'table', pathMatch: 'full' },
        { path: 'table', component: DoubleLotoPointTableComponent },
        { path: ':lotoPointId', component: LotoPointComponent }
      ]
    },
    {path: 'tag-number', component: TagNumberComponent},
    {path: 'print', component: PrintComponent},
    {path: 'backup', component: BackupComponent},
    {path: 'admin', component: AdminFunctionalitiesComponent},


    {
      path: 'permit-builder', component: PermitBuilderPageComponent,
      children: [
        { path: '', redirectTo: 'daily-packages', pathMatch: 'full' },
        { path: 'jobs', component: JobLogComponent },
        { path: 'work-requests', component: WorkRequestComponent },
        { path: 'daily-packages', component: DailyPermitPackageComponent },
        {
          path: 'daily-packages/re-issue/:workRequestId',
          component: DailyPermitPackageComponent,
          data: { mode: 'reissue' }
        },
        {
          path: 'daily-packages/:workRequestId',
          component: DailyPermitPackageComponent
        },
        { path: 'safe-works', component: SafeWorkComponent },
        { path: 'hot-works', component: HotWorkComponent },
        { path: 'confined-spaces', component: ConfinedSpaceComponent },
      ]
    },

    {
      path: 'scheduler',
      component: SchedulerPageComponent,
      children: [
        { path: '', redirectTo: 'flow', pathMatch: 'full' },
        { path: 'flow', component: SchedulerComponent, data: {bottomMenu: FileEditorBottomMenuComponent} },
        { path: 'table', component: FileTableComponent }
      ]
    },

    {
      path: 'form-designer',
      component: PrintableFormPageComponent,
      // component: FormDesignerComponent,
      children: [
        { path: '', redirectTo: 'forms', pathMatch: 'full' },
        { path: 'forms', component: PrintableFormComponent },
        { path: 'perview', component: PrintableFormPreviewComponent },
        // { path: 'design', component: PrintableFormDesignerComponent }
        { path: 'design', component: PrintableFormDesignerRefactoredComponent }
      ]
    },
];
