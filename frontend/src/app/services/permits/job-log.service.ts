
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

  closeJob(jobId: string): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.post<SpringApiResponse<JobLogDto>>(`${this.apiUrl}/${jobId}/close`, {});
  }

  getByPackageId(packageId: string): Observable<SpringApiResponse<JobLogDto>> {
    return this.http.get<SpringApiResponse<JobLogDto>>(`${this.apiUrl}/by-package/${packageId}`);
  }
}
