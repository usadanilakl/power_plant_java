import { Component, inject } from '@angular/core';
import { HotWorkTableComponent } from "../hot-work-table/hot-work-table.component";
import { CurrentHotWorkService } from '../../../../services/current-items-services/current-hot-work.service';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';

@Component({
  selector: 'app-hot-work-side-menu',
  imports: [HotWorkTableComponent],
  templateUrl: './hot-work-side-menu.component.html',
  styleUrl: './hot-work-side-menu.component.css'
})
export class HotWorkSideMenuComponent {
  currentHotWorkService = inject(CurrentHotWorkService);
onHotWorkRowLeftClick(dto: HotWorkDto) {
  this.currentHotWorkService.setCurrentHotWork(dto.id);
}

}
