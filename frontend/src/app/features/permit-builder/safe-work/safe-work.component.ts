import { Component, inject } from '@angular/core';
import { CurrentSafeWorkService } from '../../../services/current-items-services/current-safe-work.service';
import { RfSafeWorkFormComponent } from './refactored/rf-safe-work-form.component';
import { SafeWorkPaperFormComponent } from './safe-work-paper-form/safe-work-paper-form.component';

@Component({
  selector: 'app-safe-work',
  standalone: true,
  imports: [RfSafeWorkFormComponent, SafeWorkPaperFormComponent],
  templateUrl: './safe-work.component.html',
  styleUrl: './safe-work.component.css'
})
export class SafeWorkComponent {
  currentSafeWorkService = inject(CurrentSafeWorkService);
}
