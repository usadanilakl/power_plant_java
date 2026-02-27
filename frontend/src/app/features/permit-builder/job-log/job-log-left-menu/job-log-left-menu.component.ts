import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrentJobLogService } from '../../../../services/current-items-services/current-job-log.service';
import { JobLogDto } from '../../../../models/permits/job-log.model';
import { TableComponent } from '../../../../shared/table/table.component';

@Component({
  selector: 'app-job-log-left-menu',
  standalone: true,
  imports: [CommonModule, TableComponent],
  templateUrl: './job-log-left-menu.component.html',
  styleUrl: './job-log-left-menu.component.css'
})
export class JobLogLeftMenuComponent implements OnInit {
  private currentJobLogService = inject(CurrentJobLogService);
  private destroyRef = inject(DestroyRef);

  jobLogs = signal<JobLogDto[]>([]);
  isLoading = signal(false);
  columns = JobLogDto.toTableColumns(['permitNumber', 'company', 'location', 'jobStatus']);

  ngOnInit(): void {
    this.isLoading.set(true);
    this.currentJobLogService.allJobLogs$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.jobLogs.set(items);
      this.isLoading.set(false);
    });
  }

  onItemClick(item: JobLogDto) {
    this.currentJobLogService.setCurrentJobLog(item.id);
  }

  refresh(): void {
    this.isLoading.set(true);
    this.currentJobLogService.refresh();
  }

  createJob(): void {
    const job = new JobLogDto({
      name: 'New Job',
      startDate: new Date().toISOString().split('T')[0],
    });
    this.currentJobLogService.createJobLog(job).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}
