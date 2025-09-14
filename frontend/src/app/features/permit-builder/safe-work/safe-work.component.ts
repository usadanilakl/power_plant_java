import { Component, inject } from '@angular/core';
import { CurrentSafeWorkService } from '../../../services/current-items-services/current-safe-work.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { SafeWorkDto } from '../../../models/permits/safe-work.model';
import { SafeWorkFormComponent } from "./safe-work-form/safe-work-form.component";

@Component({
  selector: 'app-safe-work',
  imports: [SafeWorkFormComponent],
  templateUrl: './safe-work.component.html',
  styleUrl: './safe-work.component.css'
})
export class SafeWorkComponent {
  currentSafeWorkService = inject(CurrentSafeWorkService);
  currentSafeWorkSignal = toSignal(this.currentSafeWorkService.selectedSafeWork$, { initialValue: new SafeWorkDto } );

}
