import { Component, inject } from '@angular/core';
import { HotWorkTableComponent } from '../hot-work-table/hot-work-table.component';
import { HotWorkLeftMenuComponent } from '../hot-work-left-menu/hot-work-left-menu.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';
import { CurrentHotWorkService } from '../../../../services/current-items-services/current-hot-work.service';

@Component({
  selector: 'app-hot-work-side-menu',
  standalone: true,
  imports: [HotWorkTableComponent, HotWorkLeftMenuComponent, PermitLeftPanelComponent],
  templateUrl: './hot-work-side-menu.component.html',
  styleUrl: './hot-work-side-menu.component.css'
})
export class HotWorkSideMenuComponent {
  currentHotWorkService = inject(CurrentHotWorkService);

  onFormViewChanged(isPaper: boolean) {
    this.currentHotWorkService.isPaperViewActive.set(isPaper);
  }
}
