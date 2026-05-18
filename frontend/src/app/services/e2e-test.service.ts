import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  // ==================== Files: extended (File Flow) ====================

  /** Server-configured upload extension whitelist (lowercase, no dots). */
  getAllowedExtensions(): Observable<SpringApiResponse<string[]>> {
    return this.http.get<SpringApiResponse<string[]>>(`${this.baseUrl}/ng/files/allowed-extensions`);
  }

  /** Fetch a generated sample PDF (variant 'a' or 'b' produces different bytes). */
  getSamplePdf(variant: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/ng/config/e2e-test-assets/sample-pdf/${encodeURIComponent(variant)}`,
      { responseType: 'blob' });
  }

  /** Fetch a generated sample PNG. */
  getSamplePng(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/ng/config/e2e-test-assets/sample-png`,
      { responseType: 'blob' });
  }

  /**
   * Override-upload to an existing FileObject. Sends fileDto + new file via PUT
   * /ng/files with overrideFile=true. The backend's processPidFile picks the
   * upload strategy by extension, so this works for both same-extension swaps
   * (PDF → PDF) and cross-extension swaps (PDF → PNG).
   */
  overrideUploadFile(fileIdDto: any, file: Blob, fileName: string): Observable<SpringApiResponse<any>> {
    const formData = new FormData();
    formData.append('fileDto', new Blob([JSON.stringify(fileIdDto)], { type: 'application/json' }));
    formData.append('file', file, fileName);
    formData.append('overrideFile', 'true');
    return this.http.put<SpringApiResponse<any>>(`${this.baseUrl}/ng/files`, formData);
  }

  /** Metadata-only update (no file). Routes to NgFileService.updateFileObject. */
  updateFileMetadata(fileIdDto: any): Observable<SpringApiResponse<any>> {
    const formData = new FormData();
    formData.append('fileDto', new Blob([JSON.stringify(fileIdDto)], { type: 'application/json' }));
    return this.http.put<SpringApiResponse<any>>(`${this.baseUrl}/ng/files`, formData);
  }

  /** Delete a file (routes through trash + soft-delete). */
  deleteFile(fileId: string): Observable<SpringApiResponse<any>> {
    return this.http.delete<SpringApiResponse<any>>(`${this.baseUrl}/ng/files/${fileId}`);
  }

  /** List files currently in trash. */
  listTrash(): Observable<SpringApiResponse<any[]>> {
    return this.http.get<SpringApiResponse<any[]>>(`${this.baseUrl}/ng/files/trash`);
  }

  /** Read a file's raw fileHash from the local instance (test-mode endpoint). */
  getFileHash(fileId: string): Observable<SpringApiResponse<string>> {
    return this.http.get<SpringApiResponse<string>>(
      `${this.baseUrl}/ng/config/e2e-verify/file-hash/${fileId}`);
  }

  /** Read a file's raw fileHash from a remote instance via the public verify endpoint. */
  getFileHashFromRemote(remoteBaseUrl: string, fileId: string): Observable<SpringApiResponse<string>> {
    return this.http.get<SpringApiResponse<string>>(
      `${remoteBaseUrl}/ng/config/e2e-verify/file-hash/${fileId}`);
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

  // ==================== Users (admin provisioning for the harness) ====================

  /** Admin: create a user. Returns the created UserDto with the assigned id. */
  createUser(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.baseUrl}/ng/users`, payload);
  }

  /** List active users — used by the harness to sweep stale `@e2e.local` accounts. */
  listActiveUsers(): Observable<SpringApiResponse<any[]>> {
    return this.http.get<SpringApiResponse<any[]>>(`${this.baseUrl}/ng/users/all-options`);
  }

  /** Admin: assign signing initials (2-3 letters) to a user. */
  setSigningInitials(userId: number, initials: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/api/auth/admin/users/${userId}/initials`,
      { initials }
    );
  }

  /**
   * Admin (test profile only): set a user's PIN to an exact value. Skips
   * trivial-PIN and uniqueness checks so the harness can use deterministic
   * codes like 1111. Gated server-side by `e2e.test-endpoints.enabled`.
   */
  setTestPin(userId: number, pin: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/api/auth/admin/users/${userId}/pin/set-test`,
      { pin }
    );
  }

  /** Admin (test profile only): clear PIN lockout for a user. */
  unlockPin(userId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/api/auth/admin/users/${userId}/pin/unlock`,
      {}
    );
  }

  /** Admin: soft-delete a user. Used to clean up test users after a run. */
  deleteUser(userId: number): Observable<SpringApiResponse<any>> {
    return this.http.delete<SpringApiResponse<any>>(`${this.baseUrl}/ng/users/${userId}`);
  }

  // ==================== Step-up auth ====================

  /**
   * Exchange a combined initials+PIN code (e.g. "DK1111") for a single-use
   * token. The token expires in ~90s and is consumed on first use.
   */
  authorizeStepUp(code: string): Observable<{ token: string; expiresAt: string }> {
    return this.http.post<{ token: string; expiresAt: string }>(
      `${this.baseUrl}/api/auth/step-up`,
      { code }
    );
  }

  // ==================== LOTO Standards ====================

  createLotoStandard(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.baseUrl}/ng/loto-standards`, payload);
  }

  getLotoStandard(id: string | number): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(`${this.baseUrl}/ng/loto-standards/${id}`);
  }

  /** Standard workflow transitions — all POST, all accept optional step-up token. */
  workflowSubmitForVerification(id: string | number, stepUpToken?: string | null, notes?: string): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(
      `${this.baseUrl}/ng/loto-standards/${id}/workflow/submit-for-verification`,
      { notes: notes ?? null },
      this.stepUpOptions(stepUpToken)
    );
  }

  workflowVerify(id: string | number, stepUpToken?: string | null, notes?: string): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(
      `${this.baseUrl}/ng/loto-standards/${id}/workflow/verify`,
      { notes: notes ?? null },
      this.stepUpOptions(stepUpToken)
    );
  }

  workflowMarkWalkdownComplete(id: string | number, stepUpToken?: string | null, notes?: string): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(
      `${this.baseUrl}/ng/loto-standards/${id}/workflow/walkdown-complete`,
      { notes: notes ?? null },
      this.stepUpOptions(stepUpToken)
    );
  }

  workflowMarkReadyForTesting(id: string | number, stepUpToken?: string | null, notes?: string): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(
      `${this.baseUrl}/ng/loto-standards/${id}/workflow/ready-for-testing`,
      { notes: notes ?? null },
      this.stepUpOptions(stepUpToken)
    );
  }

  workflowApprove(id: string | number, stepUpToken?: string | null, notes?: string): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(
      `${this.baseUrl}/ng/loto-standards/${id}/workflow/approve`,
      { notes: notes ?? null },
      this.stepUpOptions(stepUpToken)
    );
  }

  workflowSendBackToDraft(id: string | number, stepUpToken?: string | null, notes?: string): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(
      `${this.baseUrl}/ng/loto-standards/${id}/workflow/send-back-to-draft`,
      { notes: notes ?? null },
      this.stepUpOptions(stepUpToken)
    );
  }

  getStandardWorkflowHistory(id: string | number): Observable<SpringApiResponse<any[]>> {
    return this.http.get<SpringApiResponse<any[]>>(
      `${this.baseUrl}/ng/loto-standards/${id}/workflow/history`
    );
  }

  /** Update a LOTO Point — used by tests to trigger auto-invalidation on an APPROVED standard. */
  updateLotoStandardPoint(payload: any): Observable<SpringApiResponse<any>> {
    return this.http.put<SpringApiResponse<any>>(`${this.baseUrl}/ng/loto-points`, payload);
  }

  /** Soft-delete a LOTO standard (cleanup after a run). */
  deleteLotoStandard(id: string | number): Observable<SpringApiResponse<any>> {
    return this.http.delete<SpringApiResponse<any>>(`${this.baseUrl}/ng/loto-standards/${id}`);
  }

  // ==================== Helpers ====================

  /**
   * Build HTTP options that attach X-Sign-As-Token when a step-up token is
   * provided, else no extra headers. Returned in the shape Angular's
   * HttpClient.post accepts as its third arg.
   */
  private stepUpOptions(stepUpToken?: string | null): { headers?: HttpHeaders } {
    if (!stepUpToken) return {};
    return { headers: new HttpHeaders({ 'X-Sign-As-Token': stepUpToken }) };
  }
}
