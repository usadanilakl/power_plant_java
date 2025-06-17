import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LotoComponent } from './pages/loto/loto.component';
import { TagNumberComponent } from './pages/tag-number/tag-number.component';
import { PidComponent } from './pages/pid/pid.component';
import { LotoPointComponent } from './pages/loto-point/loto-point.component';
import { PrintComponent } from './pages/print/print.component';
import { LotoTableComponent } from './features/loto/loto-table/loto-table.component';
import { LotoPointTableComponent } from './features/loto-points/loto-point-table/loto-point-table.component';
import { LockTableComponent } from './features/loto/lock-table/lock-table.component';
import { LotoBoxTableComponent } from './features/loto/loto-box-table/loto-box-table.component';
import { ActiveLotoPointsComponent } from './features/loto/active-loto-points/active-loto-points.component';
import { NewFileComponent } from './features/new/new-file/new-file.component';

export const routes: Routes = [
    {path: '', component: HomeComponent},

    {
      path: 'loto',
      component: LotoComponent,
      children: [
        { path: '', redirectTo: 'loto', pathMatch: 'full' },
        { path: 'loto', component: LotoTableComponent },
        { path: 'loto-points', component: LotoPointTableComponent },
        { path: 'loto-points-active', component: ActiveLotoPointsComponent },
        { path: 'loto-boxes', component: LotoBoxTableComponent },
        { path: 'locks', component: LockTableComponent }
      ]
    },

    {path: 'loto-points', component: LotoPointComponent},
    {path: 'tag-number', component: TagNumberComponent},
    {path: 'pid', component: PidComponent},
    {path: 'print', component: PrintComponent},


    {path: 'new-files', component: NewFileComponent},
];
