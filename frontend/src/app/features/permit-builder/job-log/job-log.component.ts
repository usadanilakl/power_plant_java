import { Component, inject } from '@angular/core';
import { CurrentJobLogService } from '../../../services/current-items-services/current-job-log.service';
import { RfJobLogFormComponent } from './refactored/rf-job-log-form.component';

@Component({
  selector: 'app-job-log',
  standalone: true,
  imports: [RfJobLogFormComponent],
  templateUrl: './job-log.component.html',
  styleUrl: './job-log.component.css'
})
export class JobLogComponent {
  currentJobLogService = inject(CurrentJobLogService);
}
