import { Component, inject } from '@angular/core';
import { VentingPermitTableComponent } from '../venting-permit-table/venting-permit-table.component';
import { VentingPermitLeftMenuComponent } from '../venting-permit-left-menu/venting-permit-left-menu.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';
import { CurrentVentingPermitService } from '../../../../services/current-items-services/current-venting-permit.service';

@Component({
  selector: 'app-venting-permit-side-menu',
  standalone: true,
  imports: [VentingPermitTableComponent, VentingPermitLeftMenuComponent, PermitLeftPanelComponent],
  templateUrl: './venting-permit-side-menu.component.html',
  styleUrl: './venting-permit-side-menu.component.css'
})
export class VentingPermitSideMenuComponent {
  currentVentingPermitService = inject(CurrentVentingPermitService);

  onFormViewChanged(isPaper: boolean) {
    this.currentVentingPermitService.isPaperViewActive.set(isPaper);
  }
}
