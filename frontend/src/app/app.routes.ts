import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LotoComponent } from './pages/loto/loto.component';
import { TagNumberComponent } from './pages/tag-number/tag-number.component';
import { PidComponent } from './pages/pid/pid.component';
import { LotoPointComponent } from './pages/loto-point/loto-point.component';
import { PrintComponent } from './pages/print/print.component';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'loto', component: LotoComponent},
    {path: 'loto-points', component: LotoPointComponent},
    {path: 'tag-number', component: TagNumberComponent},
    {path: 'pid', component: PidComponent},
    {path: 'print', component: PrintComponent},
];
