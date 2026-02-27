import { Component } from '@angular/core';
import { DailyPermitPackageTableComponent } from '../daily-permit-package-table/daily-permit-package-table.component';
import { DailyPermitPackageLeftMenuComponent } from '../daily-permit-package-left-menu/daily-permit-package-left-menu.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';

@Component({
  selector: 'app-daily-permit-package-side-menu',
  standalone: true,
  imports: [DailyPermitPackageTableComponent, DailyPermitPackageLeftMenuComponent, PermitLeftPanelComponent],
  templateUrl: './daily-permit-package-side-menu.component.html',
  styleUrl: './daily-permit-package-side-menu.component.css'
})
export class DailyPermitPackageSideMenuComponent {

  onFormViewChanged(isPaper: boolean) {
    // DPP doesn't have a paper view toggle
  }
}
