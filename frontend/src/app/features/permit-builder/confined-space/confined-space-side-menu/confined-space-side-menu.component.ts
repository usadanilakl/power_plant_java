import { Component, inject } from '@angular/core';
import { ConfinedSpaceTableComponent } from '../confined-space-table/confined-space-table.component';
import { ConfinedSpaceLeftMenuComponent } from '../confined-space-left-menu/confined-space-left-menu.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';
import { CurrentConfinedSpaceService } from '../../../../services/current-items-services/current-confined-space.service';

@Component({
  selector: 'app-confined-space-side-menu',
  standalone: true,
  imports: [ConfinedSpaceTableComponent, ConfinedSpaceLeftMenuComponent, PermitLeftPanelComponent],
  templateUrl: './confined-space-side-menu.component.html',
  styleUrl: './confined-space-side-menu.component.css'
})
export class ConfinedSpaceSideMenuComponent {
  currentConfinedSpaceService = inject(CurrentConfinedSpaceService);

  onFormViewChanged(isPaper: boolean) {
    this.currentConfinedSpaceService.isPaperViewActive.set(isPaper);
  }
}
