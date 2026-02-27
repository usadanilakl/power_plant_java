import { Component, inject } from '@angular/core';
import { JobLogTableComponent } from '../job-log-table/job-log-table.component';
import { JobLogLeftMenuComponent } from '../job-log-left-menu/job-log-left-menu.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';
import { CurrentJobLogService } from '../../../../services/current-items-services/current-job-log.service';

@Component({
  selector: 'app-job-log-side-menu',
  standalone: true,
  imports: [JobLogTableComponent, JobLogLeftMenuComponent, PermitLeftPanelComponent],
  templateUrl: './job-log-side-menu.component.html',
  styleUrl: './job-log-side-menu.component.css'
})
export class JobLogSideMenuComponent {
  currentJobLogService = inject(CurrentJobLogService);

  onFormViewChanged(isPaper: boolean) {
    this.currentJobLogService.isPaperViewActive.set(isPaper);
  }
}
