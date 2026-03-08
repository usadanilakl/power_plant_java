import { Component, inject } from '@angular/core';
import { LotoPermitTableComponent } from '../loto-table/loto-permit-table.component';
import { LotoPermitLeftMenuComponent } from '../loto-left-menu/loto-permit-left-menu.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';
import { CurrentLotoService } from '../../../../services/current-items-services/current-loto.service';

@Component({
  selector: 'app-loto-permit-side-menu',
  standalone: true,
  imports: [LotoPermitTableComponent, LotoPermitLeftMenuComponent, PermitLeftPanelComponent],
  templateUrl: './loto-permit-side-menu.component.html',
  styleUrl: './loto-permit-side-menu.component.css'
})
export class LotoPermitSideMenuComponent {
  currentLotoService = inject(CurrentLotoService);

  onFormViewChanged(isPaper: boolean) {
    this.currentLotoService.isPaperViewActive.set(isPaper);
  }
}
