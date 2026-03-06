
import { computed, DestroyRef, inject, Injectable, signal } from "@angular/core";
import { BehaviorSubject, tap } from "rxjs";
import { JobLogDto } from "../../models/permits/job-log.model";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { JobLogService } from "../permits/job-log.service";
import { DailyPermitPackageDto } from "../../models/permits/dailt-permit-package.model";
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class CurrentJobLogService {
  private jobLogService = inject(JobLogService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  private allJobLogsSubject = new BehaviorSubject<JobLogDto[]>([]);
  allJobLogs$ = this.allJobLogsSubject.asObservable();

  private selectedJobLogSubject = new BehaviorSubject<JobLogDto>(new JobLogDto());
  selectedJobLog$ = this.selectedJobLogSubject.asObservable();

  isPaperViewActive = signal<boolean>(false);
  selectedItem = toSignal(this.selectedJobLogSubject.asObservable(), { initialValue: new JobLogDto() });
  packages = computed(() => this.selectedItem().packages);

  constructor() {
    this.loadJobLogs();
  }

  private loadJobLogs() {
    this.jobLogService.getAll().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      if (response?.responseData) {
        const items = response.responseData.map((j: any) => JobLogDto.fromJson(j));
        this.allJobLogsSubject.next(items);
      }
    });
  }

  setCurrentJobLog(id: number) {
    this.jobLogService.getById(id.toString()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      if (response?.responseData) {
        this.selectedJobLogSubject.next(JobLogDto.fromJson(response.responseData));
      }
    });
  }

  setCurrentJobLogWithDto(dto: JobLogDto) {
    this.selectedJobLogSubject.next(dto);
  }

  createJobLog(dto: JobLogDto) {
    return this.jobLogService.create(dto).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(response => {
        if (response?.responseData) {
          const created = JobLogDto.fromJson(response.responseData);
          this.addJobLogToList(created);
          this.setCurrentJobLogWithDto(created);
        }
      })
    );
  }

  createJobFromWorkRequest(workRequestId: string) {
    return this.jobLogService.createFromWorkRequest(workRequestId).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(response => {
        if (response?.responseData) {
          const created = JobLogDto.fromJson(response.responseData);
          this.addJobLogToList(created);
          this.setCurrentJobLogWithDto(created);
        }
      })
    );
  }

  processWorkRequest(jobId: string, workRequestId: string) {
    return this.jobLogService.processWorkRequest(jobId, workRequestId).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(response => {
        if (response?.responseData) {
          const updated = JobLogDto.fromJson(response.responseData);
          this.updateJobLogInList(updated);
          this.setCurrentJobLogWithDto(updated);
        }
      })
    );
  }

  updateJobLog(dto: JobLogDto) {
    return this.jobLogService.update(dto.id.toString(), dto).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(response => {
        if (response?.responseData) {
          const updated = JobLogDto.fromJson(response.responseData);
          this.updateJobLogInList(updated);
          this.setCurrentJobLogWithDto(updated);
        }
      })
    );
  }

  addPackageToJob(jobId: string, pkg: DailyPermitPackageDto) {
    return this.jobLogService.addPackage(jobId, pkg).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(response => {
        if (response?.responseData) {
          const updated = JobLogDto.fromJson(response.responseData);
          this.updateJobLogInList(updated);
          this.setCurrentJobLogWithDto(updated);
        }
      })
    );
  }

  saveJobLog(form: any) {
    const dto = new JobLogDto(form);
    if (dto.id) {
      this.updateJobLog(dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        error: err => console.error('Error updating job log:', err)
      });
    } else {
      this.createJobLog(dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        error: err => console.error('Error creating job log:', err)
      });
    }
  }

  createPackageForJob() {
    const job = this.selectedJobLogSubject.value;
    if (!job?.id) return;
    this.jobLogService.createPackageForJob(job.id.toString()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        if (response?.responseData) {
          const updated = JobLogDto.fromJson(response.responseData);
          this.updateJobLogInList(updated);
          this.setCurrentJobLogWithDto(updated);
        }
      },
      error: err => console.error('Error creating package for job:', err)
    });
  }

  detachPackageFromJob(packageId: number) {
    const job = this.selectedJobLogSubject.value;
    if (!job?.id) return;
    this.jobLogService.removePackage(job.id.toString(), packageId.toString()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        if (response?.responseData) {
          const updated = JobLogDto.fromJson(response.responseData);
          this.updateJobLogInList(updated);
          this.setCurrentJobLogWithDto(updated);
        }
      },
      error: err => console.error('Error detaching package from job:', err)
    });
  }

  navigateToPackage(packageId: number) {
    this.router.navigate(['/permit-builder/daily-packages'], { queryParams: { packageId } });
  }

  closeJob() {
    const job = this.selectedJobLogSubject.value;
    if (!job?.id) return;
    this.jobLogService.closeJob(job.id.toString()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        if (response?.responseData) {
          const updated = JobLogDto.fromJson(response.responseData);
          this.updateJobLogInList(updated);
          this.setCurrentJobLogWithDto(updated);
        }
      },
      error: err => console.error('Error closing job:', err)
    });
  }

  removeJobLogFromList(id: number) {
    const current = this.allJobLogsSubject.value;
    this.allJobLogsSubject.next(current.filter(j => j.id !== id));
  }

  refresh() {
    this.loadJobLogs();
  }

  private addJobLogToList(jobLog: JobLogDto) {
    const current = this.allJobLogsSubject.value;
    this.allJobLogsSubject.next([...current, jobLog]);
  }

  private updateJobLogInList(jobLog: JobLogDto) {
    const current = this.allJobLogsSubject.value;
    const updated = current.map(j => j.id === jobLog.id ? jobLog : j);
    this.allJobLogsSubject.next(updated);
  }
}
