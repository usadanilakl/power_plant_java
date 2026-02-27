import { Component, inject } from '@angular/core';
import { CurrentVentingPermitService } from '../../../services/current-items-services/current-venting-permit.service';
import { RfVentingPermitFormComponent } from './refactored/rf-venting-permit-form.component';
import { VentingPermitPaperFormComponent } from './venting-permit-paper-form/venting-permit-paper-form.component';

@Component({
  selector: 'app-venting-permit',
  standalone: true,
  imports: [RfVentingPermitFormComponent, VentingPermitPaperFormComponent],
  templateUrl: './venting-permit.component.html',
  styleUrl: './venting-permit.component.css'
})
export class VentingPermitComponent {
  currentService = inject(CurrentVentingPermitService);
}
