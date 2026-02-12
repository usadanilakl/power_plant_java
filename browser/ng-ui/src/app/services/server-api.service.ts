import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, timeout, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { WorkRequest } from '../models/permits/work-request.model';
import { Jha } from '../models/permits/jha.model';
import { IAttachment } from '../models/permits/attachment.model';

export interface PwaSubmissionResult {
  success: boolean;
  sharepointId?: string;
  method: 'server' | 'powerAutomate' | 'email' | 'local';
  message?: string;
  localUuid: string;
}

export interface PwaStatusResult {
  localUuid: string;
  sharepointId?: string;
  status: string;
  submittedAt?: Date;
  submissionMethod?: string;
}

export interface PwaWorkRequestDto {
  localUuid: string;
  company: string;
  dateOfWork: string;
  timeOfWork: string;
  locationOfWork: string;
  workRequestedBy: string;
  affectedEquipment: string;
  workScope: string;
  isLotoRequired: boolean;
  isHotWorkRequired: boolean;
  isConfinedSpaceEntryRequired: boolean;
  foremanName?: string;
  fireWatchName?: string;
  spaceToBeEntered?: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  submitterCompany: string;
  timeSubmitted: string;
  attachments: { fileName: string; contentType: string; base64Content: string }[];
}

export interface PwaJhaDto {
  localUuid: string;
  workRequestLocalUuid?: string;
  workRequestSharepointId?: string;
  jobName: string;
  applicability: string;
  analysisBy: string;
  reviewedBy: string;
  approvedBy: string;
  date: string;
  ppe: string;
  loto: string;
  confinedSpace: string;
  hazCom: string;
  handAndPowerTools: string;
  specialTools: string;
  jobSteps: { sequence: number; description: string; hazard: string; safetyMeasures: string }[];
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  submitterCompany: string;
  timeSubmitted: string;
  attachments: { fileName: string; contentType: string; base64Content: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class ServerApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.serverUrl;

  submitWorkRequest(dto: PwaWorkRequestDto): Observable<PwaSubmissionResult> {
    return this.http.post<{ responseData: PwaSubmissionResult }>(`${this.baseUrl}/api/pwa/work-request/submit`, dto).pipe(
      timeout(15000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  submitJha(dto: PwaJhaDto): Observable<PwaSubmissionResult> {
    return this.http.post<{ responseData: PwaSubmissionResult }>(`${this.baseUrl}/api/pwa/jha/submit`, dto).pipe(
      timeout(15000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getWorkRequestStatus(localUuid: string): Observable<PwaStatusResult | null> {
    return this.http.get<{ responseData: PwaStatusResult }>(`${this.baseUrl}/api/pwa/work-request/status/${localUuid}`).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(err => {
        if (err.status === 404) {
          return of(null);
        }
        return throwError(() => err);
      })
    );
  }

  isAvailable(): Observable<boolean> {
    return this.http.get(`${this.baseUrl}/api/pwa/work-request/health`, { responseType: 'text' }).pipe(
      timeout(5000),
      map(() => true),
      catchError(() => of(false))
    );
  }

  convertWorkRequestToDto(workRequest: WorkRequest, userData: { name: string; email: string; phone: string; company: string }): PwaWorkRequestDto {
    // Extract local date components (avoids UTC date shift from toISOString)
    let dateStr: string;
    if (workRequest.dateOfWork instanceof Date) {
      const d = workRequest.dateOfWork;
      dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else {
      dateStr = String(workRequest.dateOfWork || '');
    }

    return {
      localUuid: workRequest.localUuid || crypto.randomUUID(),
      company: workRequest.company || '',
      dateOfWork: dateStr,
      timeOfWork: workRequest.timeOfWork || '',
      locationOfWork: workRequest.locationOfWork || '',
      workRequestedBy: workRequest.workRequestedBy || '',
      affectedEquipment: workRequest.affectedEquipment || '',
      workScope: workRequest.workScope || '',
      isLotoRequired: workRequest.isLOTORequired === 'Yes',
      isHotWorkRequired: workRequest.isHotWorkRequired === 'Yes',
      isConfinedSpaceEntryRequired: workRequest.isConfinedSpaceEntryRequired === 'Yes',
      foremanName: workRequest.foremanName,
      fireWatchName: workRequest.fireWatchName,
      spaceToBeEntered: workRequest.spaceToBeEntered,
      submitterName: userData.name,
      submitterEmail: userData.email,
      submitterPhone: userData.phone,
      submitterCompany: userData.company,
      timeSubmitted: ServerApiService.formatCentralTime(new Date()),
      attachments: this.convertAttachments(workRequest.attachments)
    };
  }

  convertJhaToDto(jha: Jha, userData: { name: string; email: string; phone: string; company: string }): PwaJhaDto {
    return {
      localUuid: jha.localUuid || crypto.randomUUID(),
      workRequestLocalUuid: jha.workRequestLocalUuid,
      workRequestSharepointId: jha.workRequestSharepointId,
      jobName: jha.jobName || '',
      applicability: jha.applicability || '',
      analysisBy: jha.analysisBy || '',
      reviewedBy: jha.reviewedBy || '',
      approvedBy: jha.approvedBy || '',
      date: jha.date || '',
      ppe: jha.ppe || '',
      loto: jha.loto || '',
      confinedSpace: jha.confinedSpace || '',
      hazCom: jha.hazCom || '',
      handAndPowerTools: jha.handAndPowerTools || '',
      specialTools: jha.specialTools || '',
      jobSteps: (jha.jobSteps || []).map((step, i) => ({
        sequence: step.sequence || i + 1,
        description: step.description || '',
        hazard: step.hazard || '',
        safetyMeasures: step.safetyMeasures || ''
      })),
      submitterName: userData.name,
      submitterEmail: userData.email,
      submitterPhone: userData.phone,
      submitterCompany: userData.company,
      timeSubmitted: ServerApiService.formatCentralTime(new Date()),
      attachments: this.convertAttachments(jha.attachments)
    };
  }

  private convertAttachments(attachments: IAttachment[]): { fileName: string; contentType: string; base64Content: string }[] {
    if (!attachments || attachments.length === 0) return [];
    return attachments.map(a => ({
      fileName: a.fileName,
      contentType: a.contentType,
      base64Content: a.base64Content
    }));
  }

  /** Formats a Date as Central Time: MM/dd/yyyy hh:mm AM/PM */
  static formatCentralTime(date: Date): string {
    return date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: '2-digit', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    }).replace(',', '');
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Server request failed';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Network error: ${error.error.message}`;
    } else if (error.status === 0) {
      errorMessage = 'Server is unreachable';
    } else {
      errorMessage = `Server error: ${error.status} - ${error.message}`;
    }
    console.error('[ServerAPI]', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
