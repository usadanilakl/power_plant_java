import { Component, inject } from '@angular/core';
import { RfJhaTableComponent } from '../rf-jha-table/rf-jha-table.component';
import { RfJhaLeftMenuComponent } from '../rf-jha-left-menu/rf-jha-left-menu.component';
import { PermitLeftPanelComponent } from '../../../shared/permit-left-panel/permit-left-panel.component';
import { RfJhaStateService } from '../services/rf-jha-state.service';

@Component({
  selector: 'app-rf-jha-side-menu',
  standalone: true,
  imports: [RfJhaTableComponent, RfJhaLeftMenuComponent, PermitLeftPanelComponent],
  templateUrl: './rf-jha-side-menu.component.html',
  styleUrl: './rf-jha-side-menu.component.css'
})
export class RfJhaSideMenuComponent {
  stateService = inject(RfJhaStateService);

  onFormViewChanged(isPaper: boolean) {
    this.stateService.isPaperViewActive.set(isPaper);
  }
}
