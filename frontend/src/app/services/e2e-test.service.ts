import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SpringApiResponse } from '../models/api/spring-api-response.model';

@Injectable({ providedIn: 'root' })
export class E2eTestService {
  private baseUrl = environment.baseApiUrl;

  constructor(private http: HttpClient) {}

  // Work Request — POST /ng/work-requests (accepts array)
  createWorkRequest(payload: any[]): Observable<SpringApiResponse<any[]>> {
    return this.http.post<SpringApiResponse<any[]>>(`${this.baseUrl}/ng/work-requests`, payload);
  }

  // Job Log — POST /ng/job-logs
  createJob(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.baseUrl}/ng/job-logs`, payload);
  }

  // Job Log — POST /ng/job-logs/{jobId}/process-work-request/{wrId}
  processWorkRequest(jobId: string, wrId: string): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(
      `${this.baseUrl}/ng/job-logs/${jobId}/process-work-request/${wrId}`, {}
    );
  }

  // SafeWork — POST /ng/safe-works
  createSafeWork(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.baseUrl}/ng/safe-works`, payload);
  }

  // HotWork — POST /ng/hot-works
  createHotWork(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.baseUrl}/ng/hot-works`, payload);
  }

  // ConfinedSpace — POST /ng/confined-spaces
  createConfinedSpace(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.baseUrl}/ng/confined-spaces`, payload);
  }

  // DailyPermitPackage — PUT /ng/daily-permit-packages/{id}
  updatePackage(packageId: string, payload: any): Observable<SpringApiResponse<any>> {
    return this.http.put<SpringApiResponse<any>>(
      `${this.baseUrl}/ng/daily-permit-packages/${packageId}`, payload
    );
  }
}
