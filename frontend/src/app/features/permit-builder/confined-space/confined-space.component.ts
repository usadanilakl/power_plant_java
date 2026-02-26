import { Component, inject } from '@angular/core';
import { CurrentConfinedSpaceService } from '../../../services/current-items-services/current-confined-space.service';
import { RfConfinedSpaceFormComponent } from './refactored/rf-confined-space-form.component';
import { ConfinedSpacePaperFormComponent } from './confined-space-paper-form/confined-space-paper-form.component';

@Component({
  selector: 'app-confined-space',
  standalone: true,
  imports: [RfConfinedSpaceFormComponent, ConfinedSpacePaperFormComponent],
  templateUrl: './confined-space.component.html',
  styleUrl: './confined-space.component.css'
})
export class ConfinedSpaceComponent {
  currentConfinedSpaceService = inject(CurrentConfinedSpaceService);
}
