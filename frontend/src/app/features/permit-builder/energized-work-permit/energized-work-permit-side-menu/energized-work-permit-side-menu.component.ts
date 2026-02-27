import { Component, inject } from '@angular/core';
import { EnergizedWorkPermitLeftMenuComponent } from '../energized-work-permit-left-menu/energized-work-permit-left-menu.component';
import { EnergizedWorkPermitTableComponent } from '../energized-work-permit-table/energized-work-permit-table.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';
import { CurrentEnergizedWorkPermitService } from '../../../../services/current-items-services/current-energized-work-permit.service';

@Component({
  selector: 'app-energized-work-permit-side-menu',
  standalone: true,
  imports: [EnergizedWorkPermitLeftMenuComponent, EnergizedWorkPermitTableComponent, PermitLeftPanelComponent],
  templateUrl: './energized-work-permit-side-menu.component.html',
  styleUrl: './energized-work-permit-side-menu.component.css'
})
export class EnergizedWorkPermitSideMenuComponent {
  currentService = inject(CurrentEnergizedWorkPermitService);
  onFormViewChanged(isPaper: boolean) {
    this.currentService.isPaperViewActive.set(isPaper);
  }
}
