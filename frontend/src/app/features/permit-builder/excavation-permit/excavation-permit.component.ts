import { Component, inject } from '@angular/core';
import { CurrentExcavationPermitService } from '../../../services/current-items-services/current-excavation-permit.service';
import { RfExcavationPermitFormComponent } from './refactored/rf-excavation-permit-form.component';
import { ExcavationPermitPaperFormComponent } from './excavation-permit-paper-form/excavation-permit-paper-form.component';

@Component({
  selector: 'app-excavation-permit',
  standalone: true,
  imports: [RfExcavationPermitFormComponent, ExcavationPermitPaperFormComponent],
  templateUrl: './excavation-permit.component.html',
  styleUrl: './excavation-permit.component.css'
})
export class ExcavationPermitComponent {
  currentService = inject(CurrentExcavationPermitService);
}
