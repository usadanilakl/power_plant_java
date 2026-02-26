import { Component, inject } from '@angular/core';
import { RfJhaFormComponent } from '../rf-jha-form/rf-jha-form.component';
import { RfJhaPaperFormComponent } from '../rf-jha-paper-form/rf-jha-paper-form.component';
import { RfJhaStateService } from '../services/rf-jha-state.service';

@Component({
  selector: 'app-rf-jha-page',
  standalone: true,
  imports: [
    RfJhaFormComponent,
    RfJhaPaperFormComponent,
  ],
  templateUrl: './rf-jha-page.component.html',
  styleUrl: './rf-jha-page.component.css',
})
export class RfJhaPageComponent {
  stateService = inject(RfJhaStateService);
}
