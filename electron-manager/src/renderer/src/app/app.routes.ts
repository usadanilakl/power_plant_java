import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { FireImpairmentComponent } from './pages/fire-impairment/fire-impairment.component';
import { GateLogComponent } from './pages/gate-log/gate-log.component';
import { WeatherComponent } from './pages/weather/weather.component';
import { PjmComponent } from './pages/pjm/pjm.component';
import { LogsComponent } from './pages/logs/logs.component';
import { SyncUpdatesComponent } from './pages/sync-updates/sync-updates.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { SpringBootUiComponent } from './pages/spring-boot-ui/spring-boot-ui.component';
import { PersonnelComponent } from './pages/personnel/personnel.component';
import { ToiComponent } from './pages/toi/toi.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'pid-app', component: SpringBootUiComponent },
  { path: 'fire-impairment', component: FireImpairmentComponent },
  { path: 'gate-log', component: GateLogComponent },
  { path: 'weather', component: WeatherComponent },
  { path: 'pjm', component: PjmComponent },
  { path: 'logs', component: LogsComponent },
  { path: 'sync-updates', component: SyncUpdatesComponent },
  { path: 'personnel', component: PersonnelComponent },
  { path: 'toi', component: ToiComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' }
];
