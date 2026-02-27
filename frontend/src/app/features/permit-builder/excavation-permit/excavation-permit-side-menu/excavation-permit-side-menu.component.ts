import { Component, inject } from '@angular/core';
import { ExcavationPermitLeftMenuComponent } from '../excavation-permit-left-menu/excavation-permit-left-menu.component';
import { ExcavationPermitTableComponent } from '../excavation-permit-table/excavation-permit-table.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';
import { CurrentExcavationPermitService } from '../../../../services/current-items-services/current-excavation-permit.service';

@Component({
  selector: 'app-excavation-permit-side-menu',
  standalone: true,
  imports: [ExcavationPermitLeftMenuComponent, ExcavationPermitTableComponent, PermitLeftPanelComponent],
  templateUrl: './excavation-permit-side-menu.component.html',
  styleUrl: './excavation-permit-side-menu.component.css'
})
export class ExcavationPermitSideMenuComponent {
  currentService = inject(CurrentExcavationPermitService);
  onFormViewChanged(isPaper: boolean) {
    this.currentService.isPaperViewActive.set(isPaper);
  }
}
