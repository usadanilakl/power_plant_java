import { Component, inject } from '@angular/core';
import { ConfinedSpaceTableComponent } from "../confined-space-table/confined-space-table.component";
import { CurrentConfinedSpaceService } from '../../../../services/current-items-services/current-confined-space.service';
import { ConfinedSpaceDto } from '../../../../models/permits/confined-space.model';

@Component({
  selector: 'app-confined-space-side-menu',
  imports: [ConfinedSpaceTableComponent],
  templateUrl: './confined-space-side-menu.component.html',
  styleUrl: './confined-space-side-menu.component.css'
})
export class ConfinedSpaceSideMenuComponent {
  currentConfinedSpaceService = inject(CurrentConfinedSpaceService);
onConfinedSpaceRowLeftClick(dto: ConfinedSpaceDto) {
  this.currentConfinedSpaceService.setCurrentConfinedSpace(dto.id);
}

}
