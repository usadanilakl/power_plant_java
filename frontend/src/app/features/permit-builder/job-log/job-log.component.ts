import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrentJobLogService } from '../../../services/current-items-services/current-job-log.service';
import { JobLogDto } from '../../../models/permits/job-log.model';
import { DailyPermitPackageDto } from '../../../models/permits/dailt-permit-package.model';
import { TableComponent } from '../../../shared/table/table.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Component({
  selector: 'app-job-log',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent],
  templateUrl: './job-log.component.html',
  styleUrl: './job-log.component.css'
})
export class JobLogComponent {
  currentJobLogService = inject(CurrentJobLogService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  currentJob = this.currentJobLogService.selectedItem;

  packageColumns = DailyPermitPackageDto.toTableColumns(['name', 'permitNumber', 'date']);

  onFieldChange(field: keyof JobLogDto, value: any) {
    const current = this.currentJob();
    if (!current || current.id === 0) return;
    const updated = new JobLogDto({ ...current, [field]: value });
    this.currentJobLogService.updateJobLog(updated).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  createJob() {
    const job = new JobLogDto({
      name: 'New Job',
      startDate: new Date().toISOString().split('T')[0],
    });
    this.currentJobLogService.createJobLog(job).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  onPackageClick(pkg: DailyPermitPackageDto) {
    this.router.navigate(['/permit-builder/daily-packages']);
  }
}
