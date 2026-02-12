import { Component, inject } from '@angular/core';
import { SafeWorkTableComponent } from '../safe-work-table/safe-work-table.component';
import { SafeWorkLeftMenuComponent } from '../safe-work-left-menu/safe-work-left-menu.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';
import { CurrentSafeWorkService } from '../../../../services/current-items-services/current-safe-work.service';

@Component({
  selector: 'app-safe-work-side-menu',
  standalone: true,
  imports: [SafeWorkTableComponent, SafeWorkLeftMenuComponent, PermitLeftPanelComponent],
  templateUrl: './safe-work-side-menu.component.html',
  styleUrl: './safe-work-side-menu.component.css'
})
export class SafeWorkSideMenuComponent {
  currentSafeWorkService = inject(CurrentSafeWorkService);

  onFormViewChanged(isPaper: boolean) {
    this.currentSafeWorkService.isPaperViewActive.set(isPaper);
  }
}
