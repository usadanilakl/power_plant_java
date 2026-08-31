
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { JobLogDto } from "../../models/permits/job-log.model";
import { DailyPermitPackageDto } from "../../models/permits/dailt-permit-package.model";

@Injectable({
  providedIn: 'root'
})
export class JobLogService {
  private apiUrl = `${environment.apiUrl}/job-logs`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpringApiResponse<JobLogDto[]>> {
    return this.http.get<SpringApiResponse<JobLogDto[]>>(`${this.apiUrl}/get-all`);
  }

  getById(id: string): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.get<SpringApiResponse<JobLogDto>>(`${this.apiUrl}/get-by-id/${id}`);
  }

  create(jobLog: JobLogDto): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.post<SpringApiResponse<JobLogDto>>(this.apiUrl, jobLog);
  }

  update(id: string, jobLog: JobLogDto): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.post<SpringApiResponse<JobLogDto>>(`${this.apiUrl}/update/${id}`, jobLog);
  }

  createFromWorkRequest(workRequestId: string): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.post<SpringApiResponse<JobLogDto>>(`${this.apiUrl}/create-from-work-request/${workRequestId}`, {});
  }

  addPackage(jobId: string, pkg: DailyPermitPackageDto): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.post<SpringApiResponse<JobLogDto>>(`${this.apiUrl}/${jobId}/add-package`, pkg);
  }

  removePackage(jobId: string, packageId: string): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.delete<SpringApiResponse<JobLogDto>>(`${this.apiUrl}/${jobId}/packages/${packageId}`);
  }

  createPackageForJob(jobId: string): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.post<SpringApiResponse<JobLogDto>>(`${this.apiUrl}/${jobId}/create-package`, {});
  }

  processWorkRequest(jobId: string, workRequestId: string): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.post<SpringApiResponse<JobLogDto>>(
      `${this.apiUrl}/${jobId}/process-work-request/${workRequestId}`, {}
    );
  }

  deleteJob(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  movePackage(sourceJobId: string, packageId: string, targetJobId: string): Observable<SpringApiResponse<JobLogDto[]>> {
    return this.http.post<SpringApiResponse<JobLogDto[]>>(
      `${this.apiUrl}/${sourceJobId}/move-package/${packageId}/to/${targetJobId}`, {}
    );
  }

  mergeJobs(sourceJobId: string, targetJobId: string): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.post<SpringApiResponse<JobLogDto>>(
      `${this.apiUrl}/${sourceJobId}/merge-into/${targetJobId}`, {}
    );
  }

  closeJob(jobId: string): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.post<SpringApiResponse<JobLogDto>>(`${this.apiUrl}/${jobId}/close`, {});
  }

  getByPackageId(packageId: string): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.get<SpringApiResponse<JobLogDto>>(`${this.apiUrl}/by-package/${packageId}`);
  }

  findMatchingJobs(workRequestId: string): Observable<SpringApiResponse<any[]>> {
    return this.http.get<SpringApiResponse<any[]>>(`${this.apiUrl}/find-matching/${workRequestId}`);
  }

  /** Admin: what the stale sweep would close. Reads only. */
  staleScan(inactiveDays: number, packageHours: number): Observable<SpringApiResponse<StaleSweepResult>> {
    return this.http.get<SpringApiResponse<StaleSweepResult>>(
      `${this.apiUrl}/maintenance/stale`,
      { params: { inactiveDays, packageHours } as any });
  }

  /** Admin: close stale packages, and stale jobs with their still-open packages. */
  closeStale(inactiveDays: number, packageHours: number, dryRun: boolean, reason?: string)
      : Observable<SpringApiResponse<StaleSweepResult>> {
    const params: any = { inactiveDays, packageHours, dryRun };
    if (reason && reason.trim()) params.reason = reason.trim();
    return this.http.post<SpringApiResponse<StaleSweepResult>>(
      `${this.apiUrl}/maintenance/close-stale`, null, { params });
  }

  /** Admin: what the automatic expiry sweep would do right now. */
  expiryPreview(): Observable<SpringApiResponse<ExpirySweepResult>> {
    return this.http.get<SpringApiResponse<ExpirySweepResult>>(
      `${this.apiUrl}/maintenance/expiry-preview`);
  }

  /** Admin: run the expiry sweep now instead of waiting for the hourly schedule. */
  expirePackages(dryRun: boolean): Observable<SpringApiResponse<ExpirySweepResult>> {
    return this.http.post<SpringApiResponse<ExpirySweepResult>>(
      `${this.apiUrl}/maintenance/expire-packages`, null, { params: { dryRun } as any });
  }

  /** Admin: permits whose package is closed, deleted, or was never there. */
  strandedPermitScan(): Observable<SpringApiResponse<StrandedPermitReport>> {
    return this.http.get<SpringApiResponse<StrandedPermitReport>>(
      `${this.apiUrl}/maintenance/stranded-permits`);
  }

  /** Admin: close them. Dry run by default. */
  closeStrandedPermits(dryRun: boolean): Observable<SpringApiResponse<StrandedPermitReport>> {
    return this.http.post<SpringApiResponse<StrandedPermitReport>>(
      `${this.apiUrl}/maintenance/close-stranded-permits`, null, { params: { dryRun } as any });
  }
}

export interface StrandedPermitRow {
  layer: string;
  id: number;
  permitNumber: string | null;
  status: string;
  date: string | null;
  location: string | null;
  /** STRANDED | ORPHANED | DELETED */
  reason: string;
  packageId: number | null;
  packageNumber: string | null;
  packageStatus: string | null;
  deleted: boolean;
}

export interface StrandedPermitReport {
  rows: StrandedPermitRow[];
  countsByReason: Record<string, number>;
  countsByLayer: Record<string, number>;
  closed: number;
  dryRun: boolean;
  failures?: string[];
}

export interface StalePackageRow {
  packageId: number;
  permitNumber: string | null;
  companyName: string | null;
  personName: string | null;
  date: string | null;
  time: string | null;
  status: string;
  windowStart: string | null;
  hoursOpen: number;
  overdueBy: number;
}

export interface StaleJobRow {
  jobId: number;
  permitNumber: string | null;
  company: string | null;
  foreman: string | null;
  location: string | null;
  workScope: string | null;
  status: string;
  lastActivity: string;
  idleDays: number;
  packagesToClose: StalePackageRow[];
}

export interface StaleSweepResult {
  inactiveDays: number;
  packageHours: number;
  openJobs: number;
  staleJobCount: number;
  stalePackageCount: number;
  cascadedPackageCount: number;
  staleJobs: StaleJobRow[];
  stalePackages: StalePackageRow[];
  dryRun?: boolean;
  jobsClosed?: number;
  packagesClosed?: number;
  failures?: string[];
}

export interface ExpiryDueRow {
  packageId: number;
  permitNumber: string | null;
  companyName: string | null;
  status: string;
  windowStart: string;
  hoursOpen: number;
  personnelStillSignedOn: boolean;
}

export interface ExpirySweepResult {
  dryRun: boolean;
  expiryHours: number;
  dueCount: number;
  due: ExpiryDueRow[];
  expired: number;
  expiredWithPersonnelOn: number;
  /** Work windows we could not read. Skipped rather than guessed at — see PackageExpiryService. */
  skippedUndated: number;
  cappedAt: number | null;
  failures: string[];
}
