
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
