import { Component, inject } from '@angular/core';
import { CurrentEnergizedWorkPermitService } from '../../../services/current-items-services/current-energized-work-permit.service';
import { RfEnergizedWorkPermitFormComponent } from './refactored/rf-energized-work-permit-form.component';
import { EnergizedWorkPermitPaperFormComponent } from './energized-work-permit-paper-form/energized-work-permit-paper-form.component';

@Component({
  selector: 'app-energized-work-permit',
  standalone: true,
  imports: [RfEnergizedWorkPermitFormComponent, EnergizedWorkPermitPaperFormComponent],
  templateUrl: './energized-work-permit.component.html',
  styleUrl: './energized-work-permit.component.css'
})
export class EnergizedWorkPermitComponent {
  currentService = inject(CurrentEnergizedWorkPermitService);
}
