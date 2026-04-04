import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SpringApiResponse } from '../models/api/spring-api-response.model';

export interface E2eInfo {
  isHub: boolean;
  localPort: number;
  syncServerUrl: string;
  machineName: string;
  machineId: string;
}

@Injectable({ providedIn: 'root' })
export class E2eTestService {
  private baseUrl = environment.baseApiUrl;

  constructor(private http: HttpClient) {}

  // ==================== Config ====================

  getE2eInfo(): Observable<SpringApiResponse<E2eInfo>> {
    return this.http.get<SpringApiResponse<E2eInfo>>(`${this.baseUrl}/ng/config/e2e-info`);
  }

  // ==================== Work Request ====================

  createWorkRequest(payload: any[]): Observable<SpringApiResponse<any[]>> {
    return this.http.post<SpringApiResponse<any[]>>(`${this.baseUrl}/ng/work-requests`, payload);
  }

  // ==================== Job Log ====================

  createJob(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.baseUrl}/ng/job-logs`, payload);
  }

  createJobFromWorkRequest(wrId: string): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(
      `${this.baseUrl}/ng/job-logs/create-from-work-request/${wrId}`, {}
    );
  }

  getJob(jobId: string): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(`${this.baseUrl}/ng/job-logs/${jobId}`);
  }

  processWorkRequest(jobId: string, wrId: string): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(
      `${this.baseUrl}/ng/job-logs/${jobId}/process-work-request/${wrId}`, {}
    );
  }

  // ==================== Permits ====================

  createSafeWork(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.baseUrl}/ng/safe-works`, payload);
  }

  createHotWork(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.baseUrl}/ng/hot-works`, payload);
  }

  createConfinedSpace(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.baseUrl}/ng/confined-spaces`, payload);
  }

  // ==================== Package ====================

  updatePackage(packageId: string, payload: any): Observable<SpringApiResponse<any>> {
    return this.http.put<SpringApiResponse<any>>(
      `${this.baseUrl}/ng/daily-permit-packages/${packageId}`, payload
    );
  }

  getPackage(packageId: string): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(
      `${this.baseUrl}/ng/daily-permit-packages/${packageId}`
    );
  }

  // ==================== Values (find-or-create) ====================

  createValue(category: string, value: string): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.baseUrl}/ng/values/${encodeURIComponent(category)}/${encodeURIComponent(value)}`, {});
  }

  // ==================== Files ====================

  uploadFile(file: Blob, fileName: string, fileTypeId: number, vendorId: number): Observable<SpringApiResponse<any[]>> {
    const formData = new FormData();
    formData.append('files', file, fileName);
    formData.append('fileTypeId', String(fileTypeId));
    formData.append('vendorId', String(vendorId));
    return this.http.post<SpringApiResponse<any[]>>(`${this.baseUrl}/ng/files/multi-upload`, formData);
  }

  getFile(fileId: string): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(`${this.baseUrl}/ng/files/${fileId}`);
  }

  // ==================== Equipment (shapes on files) ====================

  createEquipment(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.put<SpringApiResponse<any>>(`${this.baseUrl}/ng/equipment`, payload);
  }

  getEquipment(equipmentId: string): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(`${this.baseUrl}/ng/equipment/${equipmentId}`);
  }

  // ==================== LOTO Points ====================

  createLotoPoint(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.baseUrl}/ng/loto-points`, payload);
  }

  updateLotoPoint(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.put<SpringApiResponse<any>>(`${this.baseUrl}/ng/loto-points`, payload);
  }

  getLotoPoint(id: string): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(`${this.baseUrl}/ng/loto-points/${id}`);
  }

  generateTagNumber(system: string): Observable<SpringApiResponse<string>> {
    return this.http.get<SpringApiResponse<string>>(`${this.baseUrl}/ng/loto-points/tag-number/${encodeURIComponent(system)}`);
  }

  // ==================== Cross-Instance (public e2e-verify endpoints) ====================

  /** Fetch a job from a remote instance via public verification endpoint */
  getJobFromRemote(remoteBaseUrl: string, jobId: string): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(`${remoteBaseUrl}/ng/config/e2e-verify/job/${jobId}`);
  }

  /** Fetch a package from a remote instance via public verification endpoint */
  getPackageFromRemote(remoteBaseUrl: string, packageId: string): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(`${remoteBaseUrl}/ng/config/e2e-verify/package/${packageId}`);
  }

  /** Fetch a file from a remote instance via public verification endpoint */
  getFileFromRemote(remoteBaseUrl: string, fileId: string): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(`${remoteBaseUrl}/ng/config/e2e-verify/file/${fileId}`);
  }

  /** Fetch a loto point from a remote instance via public verification endpoint */
  getLotoPointFromRemote(remoteBaseUrl: string, lpId: string): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(`${remoteBaseUrl}/ng/config/e2e-verify/loto-point/${lpId}`);
  }
}
