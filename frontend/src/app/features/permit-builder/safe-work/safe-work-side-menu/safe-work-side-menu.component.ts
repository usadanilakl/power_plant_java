import { Component, inject } from '@angular/core';
import { SafeWorkTableComponent } from "../safe-work-table/safe-work-table.component";
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';
import { CurrentSafeWorkService } from '../../../../services/current-items-services/current-safe-work.service';

@Component({
  selector: 'app-safe-work-side-menu',
  imports: [SafeWorkTableComponent],
  templateUrl: './safe-work-side-menu.component.html',
  styleUrl: './safe-work-side-menu.component.css'
})
export class SafeWorkSideMenuComponent {
  currentSafeWorkService = inject(CurrentSafeWorkService);
onSafeWorkRowLeftClick($event: SafeWorkDto) {
  this.currentSafeWorkService.setCurrentSafeWork($event.id);
}
switchFormView() {
  this.currentSafeWorkService.isPaperViewActive.set(!this.currentSafeWorkService.isPaperViewActive());
}

}
