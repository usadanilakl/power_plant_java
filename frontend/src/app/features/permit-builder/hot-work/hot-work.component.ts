import { Component, inject } from '@angular/core';
import { CurrentHotWorkService } from '../../../services/current-items-services/current-hot-work.service';
import { RfHotWorkFormComponent } from './refactored/rf-hot-work-form.component';
import { HotWorkPaperFormComponent } from './hot-work-paper-form/hot-work-paper-form.component';

@Component({
  selector: 'app-hot-work',
  standalone: true,
  imports: [RfHotWorkFormComponent, HotWorkPaperFormComponent],
  templateUrl: './hot-work.component.html',
  styleUrl: './hot-work.component.css'
})
export class HotWorkComponent {
  currentHotWorkService = inject(CurrentHotWorkService);
}
